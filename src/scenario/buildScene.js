/**
 * Zet de keuzes van de gebruiker om in één scènebeschrijving.
 * Pure functie: zelfde invoer = zelfde uitvoer. Daardoor makkelijk te testen.
 */
import {
  DEFAULT_VEHICLE,
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

/**
 * Terrein als helling die afwisselend bergop en bergaf gaat (evenveel km), in %.
 * Een vaste helling over de hele rit zou betekenen dat je 300 km lang klimt of daalt.
 * Zo kost terrein alleen wat je bergaf niet terugwint. [eigen aanname]
 */
export const TERRAIN = {
  vlak: { gradePct: 0, label: 'Vlak' },
  glooiend: { gradePct: 3, label: 'Glooiend' },
  heuvelachtig: { gradePct: 5, label: 'Heuvelachtig' },
};

/** Lading. Passagier = standaardmassa bestuurder (Verordening (EU) 1230/2012). Bagage: [eigen aanname]. */
export const KG_PER_PASSENGER = DEFAULT_VEHICLE.driverKg;
export const KG_PER_BAG = 20;
export const MAX_PASSENGERS = 4; // Model Y: 5 zitplaatsen, bestuurder zit al in het model
export const MAX_BAGS = 8;

export function extraKgOf({ passengers = 0, bags = 0 }) {
  return passengers * KG_PER_PASSENGER + bags * KG_PER_BAG;
}

/** Gemiddelde over evenveel km bergop als bergaf. */
const hills = (whAt, gradePct) => (gradePct ? (whAt(gradePct) + whAt(-gradePct)) / 2 : whAt(0));

const whCity = (veh, { tempC, extraKg, gradePct }) =>
  hills((g) => simulateCycle(CITY, { tempC, extraKg, gradePct: g }, veh).whPerKm, gradePct);

const whHighway = (veh, { speedKmh, tempC, extraKg, gradePct }) =>
  hills((g) => consumptionWhPerKm({ speedKmh, tempC, extraKg, gradePct: g }, veh), gradePct);

const kmFor = (veh, wh, tempC) => (veh.usableKWh * 1000 * capacityFactor(tempC, veh)) / wh;

/** Bandbreedte van de actieradius in km. */
export function rangeBand({ tripType, speedKmh, tempC, terrain = 'vlak', passengers = 0, bags = 0 }) {
  const c = { speedKmh, tempC, extraKg: extraKgOf({ passengers, bags }), gradePct: TERRAIN[terrain]?.gradePct ?? 0 };
  let a;
  let b;
  if (tripType === 'stad') {
    a = kmFor(VEH_LIT, whCity(VEH_LIT, c), tempC);
    b = kmFor(VEH_EVDB, whCity(VEH_EVDB, c), tempC);
  } else {
    a = kmFor(VEH_LIT, whHighway(VEH_LIT, c), tempC);
    b = kmFor(VEH_EVDB, whHighway(VEH_EVDB, c), tempC) / BAND;
  }
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return { low, high, mid: (low + high) / 2 };
}

/**
 * Status van een rit t.o.v. de bandbreedte. De reserve geldt alleen voor "zeker haalbaar":
 * het mogelijke bereik blijft zonder reserve (zie ook shareStatus in roads.js).
 */
export function tripStatus(km, band, reservePct = 0) {
  if (km <= band.low * (1 - reservePct / 100)) return 'haalbaar';
  if (km <= band.high) return 'marge';
  return 'laadstop';
}

/**
 * @param {import('./types.js').Inputs} inputs
 * @returns {import('./types.js').Scene}
 */
export function buildScene(inputs) {
  const { tripType, speedKmh, tempC, trips, reservePct = 0 } = inputs;
  // Elke rit heeft een eigen type. De baan toont het bereik van het gekozen type (tripType).
  const bands = {
    stad: rangeBand({ ...inputs, tripType: 'stad' }),
    snelweg: rangeBand({ ...inputs, tripType: 'snelweg' }),
  };
  const band = bands[tripType];
  const maxKm = scaleMaxKm(band.high, trips.map((t) => t.km));
  const extraKg = extraKgOf(inputs);

  // Krachten: bij de stad rekenen we met een gemiddelde snelheid van 30 km/h (alleen voor de pijlen)
  const v = tripType === 'stad' ? 30 : speedKmh;
  const p = powerBreakdown({ speedKmh: v, tempC, extraKg }, VEH_LIT);
  const parts = { aero: p.aero, roll: p.roll, grade: Math.max(0, p.grade ?? 0), hvac: p.hvac, base: p.base };
  const sum = Object.values(parts).reduce((s, x) => s + x, 0) || 1;
  const forces = Object.fromEntries(Object.entries(parts).map(([k, x]) => [k, x / sum]));

  const hvac = hvacPower(tempC, VEH_LIT);
  return {
    inputs,
    rangeKm: band,
    bands,
    rangeT: { low: toT(band.low, maxKm), high: toT(band.high, maxKm) },
    maxKm,
    extraKg,
    trips: [...trips]
      .sort((x, y) => x.km - y.km)
      .map((t) => {
        const type = t.type ?? 'snelweg';
        return { ...t, type, dim: type !== tripType, status: tripStatus(t.km, bands[type], reservePct), t: toT(t.km, maxKm) };
      }),
    forces,
    whPerKm: whHighway(VEH_LIT, { speedKmh: v, tempC, extraKg, gradePct: TERRAIN[inputs.terrain]?.gradePct ?? 0 }),
    heating: hvac > 0 && tempC < VEH_LIT.heatBelowC,
    cooling: hvac > 0 && tempC > VEH_LIT.coolAboveC,
  };
}
