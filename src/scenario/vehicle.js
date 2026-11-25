/**
 * De referentiewagen in twee varianten, lading en terrein.
 * Gedeeld door het rekenmodel (roads.js, plan.js, warmup.js) en de Uitleg (explain.js, winter.js).
 */
import { DEFAULT_VEHICLE, simulateCycle, capacityFactor, consumptionWhPerKm } from '../model/model.js';
import calibrated from '../model/calibrated-vehicle.json';
import wltc from '../model/wltc-class3b.json';

// Twee varianten voor de verwarming (zie hoofdstuk rekenmodel)
export const VEH_LIT = { ...DEFAULT_VEHICLE, ...calibrated.literatuur };
export const VEH_EVDB = { ...DEFAULT_VEHICLE, ...calibrated.evdb };
const BAND = calibrated.bandFactor;

/** Lading. Passagier = standaardmassa bestuurder (Verordening (EU) 1230/2012). Bagage: [eigen aanname]. */
export const KG_PER_PASSENGER = DEFAULT_VEHICLE.driverKg;
export const KG_PER_BAG = 20;
export const MAX_PASSENGERS = 4; // Model Y: 5 zitplaatsen, bestuurder zit al in het model
export const MAX_BAGS = 8;

export function extraKgOf({ passengers = 0, bags = 0 } = {}) {
  return passengers * KG_PER_PASSENGER + bags * KG_PER_BAG;
}

/**
 * Terrein als helling die afwisselend bergop en bergaf gaat (evenveel km), in %.
 * Niet instelbaar in Rangy (het model rekent vlak); alleen nog voor de Uitleg, als motivatie waarom. [eigen aanname]
 */
export const TERRAIN = {
  vlak: { gradePct: 0, label: 'Vlak' },
  glooiend: { gradePct: 3, label: 'Glooiend' },
  heuvelachtig: { gradePct: 5, label: 'Heuvelachtig' },
};

// Stadsrit = lage + middelste fase van de WLTC (klasse 3b)
const CITY = wltc.kmh.slice(0, wltc.phases.medium[1] + 1);

/** Gemiddelde over evenveel km bergop als bergaf. */
const hills = (whAt, gradePct) => (gradePct ? (whAt(gradePct) + whAt(-gradePct)) / 2 : whAt(0));
const whCity = (veh, { tempC, extraKg, gradePct }) =>
  hills((g) => simulateCycle(CITY, { tempC, extraKg, gradePct: g }, veh).whPerKm, gradePct);
const whHighway = (veh, { speedKmh, tempC, extraKg, gradePct }) =>
  hills((g) => consumptionWhPerKm({ speedKmh, tempC, extraKg, gradePct: g }, veh), gradePct);
const kmFor = (veh, wh, tempC) => (veh.usableKWh * 1000 * capacityFactor(tempC, veh)) / wh;

/**
 * Bereik (km) voor 100 % stad of 100 % snelweg, met terrein. Uit v1; nu alleen nog voor de Uitleg › Terrein.
 * Zelfde uitkomst als mixRange in roads.js voor een vlakke rit.
 */
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
