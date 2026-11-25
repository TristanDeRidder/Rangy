/**
 * Cijfers voor de Uitleg-pagina. Telkens één factor veranderen, de rest gelijk houden:
 * 20 °C, geen lading, geen wind, snelweg 110 km/u. Pure functies op het rekenmodel v2 (eigen berekening).
 *
 * Per onderwerp: speedRows (Snelheid), roadRows (Soort weg), loadRows (Lading), terrainRows (Terrein),
 * windRows (Wind), warmupRows (Laden en voorverwarmen), carFacts (Referentiewagen).
 * Wat van de keuzes van de gebruiker afhangt (bereik, drukste dag), komt rechtstreeks uit het plan.
 */
import { mixRange, routeShare, ROADS } from './roads.js';
import { rangeBand, extraKgOf } from './vehicle.js';
import { tripShare } from './plan.js';
import { normalizeTrip } from './trips.js';
import { warmupWh } from './warmup.js';
import { cityWinter } from './winter.js';

export const BASE = { speedKmh: 110, tempC: 20, extraKg: 0 };

const cond = (over = {}) => ({ ...BASE, wind: null, ...over });
const range = (mix, over) => mixRange(mix, cond(over));
const KOM = { kom: 1 };
const SNEL = { snel: 1 };

/** Snelweg bij verschillende snelheden. */
export function speedRows(speeds = [90, 110, 130]) {
  return speeds.map((speedKmh) => ({ speedKmh, ...range(SNEL, { speedKmh }) }));
}

/** Elke soort weg (bebouwde kom, expresweg, snelweg), bij een zachte en een koude dag. */
export function roadRows(temps = [20, -5]) {
  return temps.map((tempC) => ({ tempC, ...Object.fromEntries(ROADS.map((r) => [r, range({ [r]: 1 }, { tempC })])) }));
}

/** Volle wagen tegenover alleen de bestuurder, in de bebouwde kom en op de snelweg. */
export function loadRows(full = { passengers: 4, bags: 4 }) {
  const extraKg = extraKgOf(full);
  return {
    extraKg,
    rows: [
      ['kom', 'stad', KOM],
      ['snel', 'snelweg', SNEL],
    ].map(([road, tripType, mix]) => {
      const empty = range(mix);
      const loaded = range(mix, { extraKg });
      return { road, tripType, empty, loaded, lossPct: (1 - loaded.mid / empty.mid) * 100 };
    }),
  };
}

/**
 * Terrein, in de stad en op de snelweg: waarom het niet instelbaar is.
 * Het model v2 rekent vlak; deze cijfers komen nog uit het model van v1 (rangeBand, met helling).
 */
export function terrainRows(terrains = ['vlak', 'glooiend', 'heuvelachtig']) {
  const band = (over) => rangeBand({ tripType: 'snelweg', speedKmh: BASE.speedKmh, tempC: BASE.tempC, ...over });
  return terrains.map((terrain) => ({
    terrain,
    stad: band({ tripType: 'stad', terrain }),
    snelweg: band({ tripType: 'snelweg', terrain }),
  }));
}

/** Bereik voor één rit in één richting of heen en terug, met wind. */
function windRange(bearings, wind, over) {
  const km = 100;
  const segments = bearings.map((bearingDeg) => ({ road: 'snel', km: km / bearings.length, bearingDeg }));
  const s = routeShare(segments, cond({ ...over, wind }));
  const low = km / s.worst;
  const high = km / s.best;
  return { low, high, mid: (low + high) / 2 };
}

/**
 * Wind op de snelweg: tegenwind, rugwind, zijwind, heen en terug, en richting onbekend (gemiddelde).
 * Wind komt uit het noorden (0°); de rijrichting bepaalt wat de auto voelt.
 * @param {number[]} speedsMs  windsnelheid op 10 m (m/s)
 */
export function windRows(speedsMs = [5, 10], over = {}) {
  const calm = range(SNEL, over);
  return speedsMs.map((speedMs) => {
    const wind = { speedMs, fromDeg: 0 };
    return {
      speedMs,
      kmh: speedMs * 3.6,
      zonder: calm,
      tegen: windRange([0], wind, over),
      mee: windRange([180], wind, over),
      zij: windRange([90], wind, over),
      heenTerug: windRange([0, 180], wind, over),
      onbekend: range(SNEL, { ...over, wind }),
    };
  });
}

/**
 * Korte rit in de kou: batterijdeel zonder opwarmen, met opwarmen en met voorverwarmen.
 * Standaard: 4 km enkel, heen en terug, in de bebouwde kom.
 */
export function warmupRows(temps = [15, 5, -5], trip = { km: 4, mix: KOM }) {
  const t = normalizeTrip({ ...trip, days: [] });
  const share = (tempC, warmup, preheat) => tripShare(t, { ...cond({ tempC }), warmup, preheat });
  return temps.map((tempC) => ({
    tempC,
    whPerStart: { worst: warmupWh(tempC, 'worst'), best: warmupWh(tempC, 'best') },
    zonder: share(tempC, false, false),
    opwarmen: share(tempC, true, false),
    voorverwarmd: share(tempC, true, true),
  }));
}

/** Kerncijfers van de referentiewagen bij 20 °C. */
export function carFacts() {
  return { city: cityWinter().warm, highway: range(SNEL) };
}
