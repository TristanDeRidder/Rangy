/**
 * Soorten weg en hun verbruik. Basis voor het bereik met je eigen mix van wegen.
 *
 *  - kom      bebouwde kom: lage + middelste fase van de WLTC (klasse 3b), met optrekken en remmen
 *  - expres   expresweg/gewestweg: snelle fase ("high") van de WLTC, geschaald naar de limiet ± 3 km/u
 *  - snel     snelweg: constante snelheid die de gebruiker zelf instelt
 *
 * Elke soort wordt doorgerekend met de twee varianten van het model (literatuur en EV Database).
 * Het verschil tussen beide, plus de ± 3 km/u op de expresweg en het effect van rugwind (zie wind.js),
 * vormt de marge.
 *
 * Wind (`cond.wind`, zie wind.js): met een rijrichting per stuk route wordt de echte tegen- en zijwind
 * gebruikt, zonder rijrichting het gemiddelde over alle richtingen. `cond.wind = null` = geen wind.
 */
import { simulateCycle, consumptionWhPerKm, capacityFactor } from '../model/model.js';
import calibrated from '../model/calibrated-vehicle.json';
import wltc from '../model/wltc-class3b.json';
import { VEH_LIT, VEH_EVDB } from './buildScene.js';
import { relativeWind, atVehicle, averageOverDirections } from './wind.js';

const BAND = calibrated.bandFactor;

export const ROADS = ['kom', 'expres', 'snel'];
export const ROAD_LABEL = { kom: 'bebouwde kom', expres: 'expresweg', snel: 'snelweg' };

/** Reserve bij aankomst voor "zeker haalbaar" (ontwerpkeuze). */
export const RESERVE = 0.1;
/** Limiet op expreswegen zolang de route er geen geeft [eigen aanname]. */
export const EXPRES_LIMIT_KMH = 90;
/** Afwijking van de limiet op wegen buiten de snelweg. */
export const SPEED_TOLERANCE_KMH = 3;

const CITY = wltc.kmh.slice(0, wltc.phases.medium[1] + 1);
const HIGH = wltc.kmh.slice(wltc.phases.high[0], wltc.phases.high[1] + 1);
const HIGH_MAX = Math.max(...HIGH);

/** WLTC-fase "high" geschaald zodat de topsnelheid gelijk is aan `maxKmh`. */
const expresCycle = (maxKmh) => HIGH.map((v) => (v * maxKmh) / HIGH_MAX);

const VARIANTS = [
  { veh: VEH_LIT, snelFactor: 1 },
  // EV Database op de snelweg: zelfde correctie als in rangeBand (bereik / bandFactor = verbruik × bandFactor)
  { veh: VEH_EVDB, snelFactor: BAND },
];

const cache = new Map();
const memo = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
};

const windKey = (vw) => (vw ? `${vw.headMs.toFixed(3)},${vw.crossMs.toFixed(3)}` : '-');

/**
 * Verbruik (Wh/km) van één soort weg voor één variant, bij een vaste wind op autohoogte.
 * @param {'kom'|'expres'|'snel'} road
 * @param {{ veh: object, snelFactor: number }} variant
 * @param {{ speedKmh: number, tempC: number, extraKg?: number, expresKmh: number }} c
 * @param {object|null} vw  wind op de hoogte van de auto (zie atVehicle in wind.js), of null
 */
function whPerKm(road, variant, c, vw) {
  const extraKg = c.extraKg ?? 0;
  const id = variant.veh === VEH_LIT ? 'lit' : 'evdb';
  if (road === 'kom') {
    return memo(`kom|${id}|${c.tempC}|${extraKg}|${windKey(vw)}`, () =>
      simulateCycle(CITY, { tempC: c.tempC, extraKg, wind: vw }, variant.veh).whPerKm,
    );
  }
  if (road === 'expres') {
    return memo(`expres|${id}|${c.tempC}|${extraKg}|${c.expresKmh}|${windKey(vw)}`, () =>
      simulateCycle(expresCycle(c.expresKmh), { tempC: c.tempC, extraKg, wind: vw }, variant.veh).whPerKm,
    );
  }
  const wh = consumptionWhPerKm({ speedKmh: c.snelKmh ?? c.speedKmh, tempC: c.tempC, extraKg, wind: vw }, variant.veh);
  return wh * variant.snelFactor;
}

/**
 * Verbruik (Wh/km) van één soort weg, met wind als die er is.
 * @param {number|null|undefined} bearingDeg  rijrichting; zonder richting: gemiddelde over alle richtingen
 * @param {'worst'|'best'} kase
 */
function roadWhPerKm(road, variant, c, bearingDeg, kase) {
  const w = c.wind;
  if (!w) return whPerKm(road, variant, c, null);
  if (bearingDeg == null) {
    return averageOverDirections((rel) => whPerKm(road, variant, c, atVehicle(rel, kase)), w.speedMs);
  }
  return whPerKm(road, variant, c, atVehicle(relativeWind(bearingDeg, w), kase));
}

/**
 * Energie voor een reeks stukken weg, in het slechtste en beste geval.
 * Slechtste geval: minst zuinige variant, expresweg 3 km/u boven de limiet, rugwind helpt beperkt.
 * Beste geval: zuinigste variant, expresweg 3 km/u onder de limiet, rugwind volgens de natuurkunde.
 * Een stuk route kan een eigen limiet hebben (`limitKmh`, uit de route). Expresweg: die limiet ± 3 km/u, anders
 * `cond.expresLimitKmh` of de standaardlimiet. Snelweg: de ingestelde snelheid, begrensd op de limiet ± 3 km/u.
 * @param {{ road: 'kom'|'expres'|'snel', km: number, bearingDeg?: number|null, limitKmh?: number|null }[]} parts
 * @param {{ speedKmh: number, tempC: number, extraKg?: number, expresLimitKmh?: number, wind?: object|null }} cond
 * @returns {{ worst: {wh:number, capWh:number}, best: {wh:number, capWh:number} }}  wh = voor alle km samen
 */
function partsEnergy(parts, cond) {
  const fallback = cond.expresLimitKmh ?? EXPRES_LIMIT_KMH;
  const run = (variant, tolerance, kase) => {
    const wh = parts.reduce((s, p) => {
      if (!p.km) return s;
      const c = {
        ...cond,
        expresKmh: (p.limitKmh ?? fallback) + tolerance,
        // snelweg: de ingestelde snelheid, maar nooit sneller dan de limiet ± 3 km/u van dat stuk (bv. ring aan 70)
        snelKmh: p.limitKmh != null ? Math.min(cond.speedKmh, p.limitKmh + tolerance) : cond.speedKmh,
      };
      return s + p.km * roadWhPerKm(p.road, variant, c, p.bearingDeg, kase);
    }, 0);
    const capWh = variant.veh.usableKWh * 1000 * capacityFactor(cond.tempC, variant.veh);
    return { wh, capWh };
  };
  const share = (x) => x.wh / x.capWh;
  const hi = VARIANTS.map((v) => run(v, SPEED_TOLERANCE_KMH, 'worst'));
  const lo = VARIANTS.map((v) => run(v, -SPEED_TOLERANCE_KMH, 'best'));
  const worst = hi.reduce((a, b) => (share(b) > share(a) ? b : a));
  const best = lo.reduce((a, b) => (share(b) < share(a) ? b : a));
  return { worst, best };
}

/** Mix normaliseren: ontbrekende soorten = 0, som = 1. */
export function normalizeMix(mix = {}) {
  const m = Object.fromEntries(ROADS.map((r) => [r, Math.max(0, Number(mix[r]) || 0)]));
  const sum = ROADS.reduce((s, r) => s + m[r], 0);
  if (!sum) return { kom: 0, expres: 0, snel: 1 };
  return Object.fromEntries(ROADS.map((r) => [r, m[r] / sum]));
}

/**
 * Verbruik en beschikbare energie voor een mix van wegen, in het slechtste en beste geval.
 * Zonder rijrichting: wind (als die er is) als gemiddelde over alle richtingen.
 * @param {{kom?:number, expres?:number, snel?:number}} mix
 * @param {{ speedKmh: number, tempC: number, extraKg?: number, expresLimitKmh?: number, wind?: object|null }} cond
 * @returns {{ worst: {wh:number, capWh:number, km:number}, best: {wh:number, capWh:number, km:number} }}  wh per km
 */
export function mixEnergy(mix, cond) {
  const m = normalizeMix(mix);
  const { worst, best } = partsEnergy(
    ROADS.map((road) => ({ road, km: m[road] })),
    cond,
  );
  const withKm = (x) => ({ ...x, km: x.capWh / x.wh });
  return { worst: withKm(worst), best: withKm(best) };
}

/** Bereik (km) voor een mix: zeker (laagste), mogelijk (hoogste), en zeker met reserve. */
export function mixRange(mix, cond) {
  const { worst, best } = mixEnergy(mix, cond);
  const low = worst.capWh / worst.wh;
  const high = best.capWh / best.wh;
  return { low, high, mid: (low + high) / 2, safe: low * (1 - RESERVE) };
}

/**
 * Deel van de batterij (0–1) dat een afstand kost, in het slechtste en beste geval.
 * @returns {{ worst: number, best: number }}
 */
export function batteryShare(distanceKm, mix, cond) {
  const { worst, best } = mixEnergy(mix, cond);
  return { worst: (distanceKm * worst.wh) / worst.capWh, best: (distanceKm * best.wh) / best.capWh };
}

/**
 * Deel van de batterij voor een route in stukken (uit de route-API), met de rijrichting per stuk.
 * @param {{ road: 'kom'|'expres'|'snel', km: number, bearingDeg?: number|null }[]} segments
 * @returns {{ worst: number, best: number }}
 */
export function routeShare(segments, cond) {
  const { worst, best } = partsEnergy(segments, cond);
  return { worst: worst.wh / worst.capWh, best: best.wh / best.capWh };
}

/**
 * Status van een rit of dag op basis van het batterijdeel.
 *  - haalbaar: past in het zekere bereik, met 10 % reserve
 *  - marge:    past in het mogelijke bereik (zonder reserve)
 *  - laadstop: past niet
 */
export function shareStatus({ worst, best }) {
  if (worst <= 1 - RESERVE) return 'haalbaar';
  if (best <= 1) return 'marge';
  return 'laadstop';
}

/** Gemiddelde mix over meerdere ritten, gewogen naar afstand. */
export function weightedMix(items) {
  const tot = Object.fromEntries(ROADS.map((r) => [r, 0]));
  let sum = 0;
  for (const { km, mix } of items) {
    const m = normalizeMix(mix);
    for (const r of ROADS) tot[r] += km * m[r];
    sum += km;
  }
  return sum ? normalizeMix(tot) : null;
}
