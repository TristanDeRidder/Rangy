/**
 * Opwarmen bij een koude start, en voorverwarmen aan de lader.
 *
 * Na een tijd stilstaan in de kou moeten interieur (en batterij) eerst opwarmen. Dat kost bovenop het
 * gewone verbruik voor verwarming (heatWPerDeg in het model, dat geldt voor een warme auto).
 *
 * Bron: INL, koudetest Nissan Leaf 2015 (Salisbury, 2016), ronde van 8,6 mijl (13,8 km):
 *  - "Cold starts at temperatures 30°F and below use as much as 100 DC Wh/mile more energy than their
 *    hot start counterparts" → ± 860 Wh per koude start bij −1 °C
 *  - "Around 70°F, it is difficult to determine any difference" → 0 Wh bij 21 °C
 * Daartussen lineair, onder −1 °C lineair doorgetrokken [eigen aanname].
 *
 * Slechtste geval: de INL-waarde ("as much as").
 * Beste geval: 38 % minder, het verschil in vermogen voor verwarming met een warmtepomp bij −7 °C
 * (DOE/Argonne, 2024). De Model Y heeft een warmtepomp; van de geteste Leaf is dat niet gekend [eigen aanname].
 *
 * Wanneer een koude start [eigen aanname]:
 *  - elke rit vertrekt koud; bij heen en terug is de terugrit ook een koude start (de auto stond stil op de bestemming)
 *  - voorverwarmen (alleen met thuislader) geldt voor de heenrit, die vertrekt thuis aan de lader
 *  - voorverwarmen haalt een deel van het opwarmen weg. Afgesteld op DOE/Argonne (2024): op een stadsrit
 *    van 7,5 mijl (12 km) bij −7 °C spaart voorverwarmen 9 tot 20 % batterij-energie. In ons model geeft
 *    dat 30 % (slechtste geval) tot 84 % (beste geval) van het opwarmen. INL zag hetzelfde: voorverwarmen
 *    hielp duidelijk, maar warmde op de koudste dag het interieur niet volledig op.
 *
 * Uitzetten: WARMUP_ENABLED = false, of `useWarmup: false` meegeven aan buildPlan.
 */
import { capacityFactor } from '../model/model.js';
import { VEH_LIT, VEH_EVDB } from './buildScene.js';

/** Opwarmen meerekenen in het model (schakelaar voor de hele app). */
export const WARMUP_ENABLED = true;

/** [berekend] Geen meetbaar verschil vanaf 21 °C (70 °F, INL). */
export const WARMUP_ZERO_C = 21;
/** [berekend] 100 Wh/mijl × 8,6 mijl ≈ 860 Wh per koude start bij −1 °C (30 °F, INL), dus ± 39 Wh per °C. */
export const WARMUP_WH_PER_DEG = 860 / (WARMUP_ZERO_C - -1);
/** [berekend] Beste geval: warmtepomp, 38 % minder vermogen voor verwarming bij −7 °C (DOE/Argonne, 2024). */
export const HEAT_PUMP_FACTOR = 1 - 0.38;
/** [gekalibreerd] Deel van het opwarmen dat voorverwarmen wegneemt: 9 % en 20 % besparing bij −7 °C (DOE/Argonne). */
export const PREHEAT_REMOVES = { worst: 0.3, best: 0.84 };

/**
 * Energie (Wh, uit de batterij) om op te warmen bij één koude start.
 * @param {number} tempC
 * @param {'worst'|'best'} kase
 */
export function warmupWh(tempC, kase) {
  const wh = WARMUP_WH_PER_DEG * Math.max(0, WARMUP_ZERO_C - tempC);
  return kase === 'best' ? wh * HEAT_PUMP_FACTOR : wh;
}

/**
 * Deel van een volle batterij voor het opwarmen bij één rit.
 * @param {{ roundTrip: boolean }} trip
 * @param {number} tempC
 * @param {boolean} preheat  voorverwarmen aan de lader voor de heenrit
 * @returns {{ worst: number, best: number }}
 */
export function warmupShare(trip, tempC, preheat = false) {
  const legs = trip.roundTrip ? 2 : 1;
  const share = (kase, veh) => {
    const removed = preheat ? PREHEAT_REMOVES[kase] : 0;
    const wh = warmupWh(tempC, kase) * (legs - removed); // de heenrit wordt (deels) voorverwarmd
    return wh / (veh.usableKWh * 1000 * capacityFactor(tempC, veh));
  };
  // zelfde bruikbare capaciteit in beide varianten; voor de zekerheid de kleinste in het slechtste geval
  const cap = (veh) => veh.usableKWh * capacityFactor(tempC, veh);
  const small = cap(VEH_LIT) <= cap(VEH_EVDB) ? VEH_LIT : VEH_EVDB;
  const big = small === VEH_LIT ? VEH_EVDB : VEH_LIT;
  return { worst: share('worst', small), best: share('best', big) };
}
