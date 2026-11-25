/**
 * Soorten weg en hun verbruik. Basis voor het bereik met je eigen mix van wegen.
 *
 *  - kom      bebouwde kom: lage + middelste fase van de WLTC (klasse 3b), met optrekken en remmen
 *  - expres   expresweg/gewestweg: snelle fase ("high") van de WLTC, geschaald naar de limiet ± 3 km/u
 *  - snel     snelweg: constante snelheid die de gebruiker zelf instelt
 *
 * Elke soort wordt doorgerekend met de twee varianten van het model (literatuur en EV Database).
 * Het verschil tussen beide, plus de ± 3 km/u op de expresweg, vormt de marge.
 */
import { simulateCycle, consumptionWhPerKm, capacityFactor } from '../model/model.js';
import calibrated from '../model/calibrated-vehicle.json';
import wltc from '../model/wltc-class3b.json';
import { VEH_LIT, VEH_EVDB } from './buildScene.js';

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

/**
 * Verbruik (Wh/km) van één soort weg voor één variant.
 * @param {'kom'|'expres'|'snel'} road
 * @param {{ veh: object, snelFactor: number }} variant
 * @param {{ speedKmh: number, tempC: number, extraKg?: number, expresKmh: number }} c
 */
function whPerKm(road, variant, c) {
  const extraKg = c.extraKg ?? 0;
  const id = variant.veh === VEH_LIT ? 'lit' : 'evdb';
  if (road === 'kom') {
    return memo(`kom|${id}|${c.tempC}|${extraKg}`, () => simulateCycle(CITY, { tempC: c.tempC, extraKg }, variant.veh).whPerKm);
  }
  if (road === 'expres') {
    return memo(`expres|${id}|${c.tempC}|${extraKg}|${c.expresKmh}`, () =>
      simulateCycle(expresCycle(c.expresKmh), { tempC: c.tempC, extraKg }, variant.veh).whPerKm,
    );
  }
  return consumptionWhPerKm({ speedKmh: c.speedKmh, tempC: c.tempC, extraKg }, variant.veh) * variant.snelFactor;
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
 * Slechtste geval: zuinigste variant niet, expresweg 3 km/u boven de limiet.
 * Beste geval: zuinigste variant, expresweg 3 km/u onder de limiet.
 * @param {{kom?:number, expres?:number, snel?:number}} mix
 * @param {{ speedKmh: number, tempC: number, extraKg?: number, expresLimitKmh?: number }} cond
 * @returns {{ worst: {wh:number, capWh:number}, best: {wh:number, capWh:number} }}
 */
export function mixEnergy(mix, cond) {
  const m = normalizeMix(mix);
  const limit = cond.expresLimitKmh ?? EXPRES_LIMIT_KMH;
  const per = (variant, expresKmh) => {
    const c = { ...cond, expresKmh };
    const wh = ROADS.reduce((s, r) => s + (m[r] ? m[r] * whPerKm(r, variant, c) : 0), 0);
    const capWh = variant.veh.usableKWh * 1000 * capacityFactor(cond.tempC, variant.veh);
    return { wh, capWh, km: capWh / wh };
  };
  const hi = VARIANTS.map((v) => per(v, limit + SPEED_TOLERANCE_KMH));
  const lo = VARIANTS.map((v) => per(v, limit - SPEED_TOLERANCE_KMH));
  const worst = hi.reduce((a, b) => (b.km < a.km ? b : a));
  const best = lo.reduce((a, b) => (b.km > a.km ? b : a));
  return { worst, best };
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
