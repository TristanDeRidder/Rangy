/**
 * Zet de keuzes van de gebruiker om in één scènebeschrijving.
 * Pure functie: zelfde invoer = zelfde uitvoer. Daardoor makkelijk te testen.
 */
import {
  DEFAULT_VEHICLE,
  rangeKm,
  powerBreakdown,
  simulateCycle,
  capacityFactor,
  consumptionWhPerKm,
  hvacPower,
} from '../model/model.js';
import calibrated from '../model/calibrated-vehicle.json';
import wltc from '../model/wltc-class3b.json';
import { toT, scaleMaxKm } from '../scene/shared/projection.js';

// Twee varianten voor de verwarming (zie hoofdstuk rekenmodel)
export const VEH_LIT = { ...DEFAULT_VEHICLE, ...calibrated.literatuur };
export const VEH_EVDB = { ...DEFAULT_VEHICLE, ...calibrated.evdb };
const BAND = calibrated.bandFactor;

// Stadsrit = lage + middelste fase van de WLTC (klasse 3b)
const CITY = wltc.kmh.slice(0, wltc.phases.medium[1] + 1);

function cityRange(veh, tempC) {
  const { whPerKm } = simulateCycle(CITY, { tempC }, veh);
  return (veh.usableKWh * 1000 * capacityFactor(tempC, veh)) / whPerKm;
}

/** Bandbreedte van de actieradius in km. */
export function rangeBand({ tripType, speedKmh, tempC }) {
  let a;
  let b;
  if (tripType === 'stad') {
    a = cityRange(VEH_LIT, tempC);
    b = cityRange(VEH_EVDB, tempC);
  } else {
    a = rangeKm({ speedKmh, tempC }, VEH_LIT);
    b = rangeKm({ speedKmh, tempC }, VEH_EVDB) / BAND;
  }
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return { low, high, mid: (low + high) / 2 };
}

/** Status van een rit t.o.v. de bandbreedte, met optionele reserve bij aankomst. */
export function tripStatus(km, band, reservePct = 0) {
  const k = 1 - reservePct / 100;
  if (km <= band.low * k) return 'haalbaar';
  if (km <= band.high * k) return 'marge';
  return 'laadstop';
}

/**
 * @param {import('./types.js').Inputs} inputs
 * @returns {import('./types.js').Scene}
 */
export function buildScene(inputs) {
  const { tripType, speedKmh, tempC, trips, reservePct = 0 } = inputs;
  const band = rangeBand(inputs);
  const maxKm = scaleMaxKm(band.high, trips.map((t) => t.km));

  // Krachten: bij de stad rekenen we met een gemiddelde snelheid van 30 km/h (alleen voor de pijlen)
  const v = tripType === 'stad' ? 30 : speedKmh;
  const p = powerBreakdown({ speedKmh: v, tempC }, VEH_LIT);
  const parts = { aero: p.aero, roll: p.roll, grade: Math.max(0, p.grade ?? 0), hvac: p.hvac, base: p.base };
  const sum = Object.values(parts).reduce((s, x) => s + x, 0) || 1;
  const forces = Object.fromEntries(Object.entries(parts).map(([k, x]) => [k, x / sum]));

  const hvac = hvacPower(tempC, VEH_LIT);
  return {
    inputs,
    rangeKm: band,
    rangeT: { low: toT(band.low, maxKm), high: toT(band.high, maxKm) },
    maxKm,
    trips: [...trips]
      .sort((x, y) => x.km - y.km)
      .map((t) => ({ ...t, status: tripStatus(t.km, band, reservePct), t: toT(t.km, maxKm) })),
    forces,
    whPerKm: consumptionWhPerKm({ speedKmh: v, tempC }, VEH_LIT),
    heating: hvac > 0 && tempC < VEH_LIT.heatBelowC,
    cooling: hvac > 0 && tempC > VEH_LIT.coolAboveC,
  };
}
