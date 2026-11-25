/**
 * Uitleg winter: waar gaat het verlies bij kou naartoe?
 * Vergelijkt 20 °C met −5 °C en splitst het verlies in "kou" (batterij, aandrijving, lucht)
 * en "verwarming". Pure functies, gebaseerd op het rekenmodel (eigen berekening).
 */
import { rangeKm, simulateCycle, capacityFactor } from '../model/model.js';
import wltc from '../model/wltc-class3b.json';
import { VEH_LIT, VEH_EVDB } from './vehicle.js';

const CITY = wltc.kmh.slice(0, wltc.phases.medium[1] + 1);

function cityRange(veh, tempC, hvac = true) {
  const { whPerKm } = simulateCycle(CITY, { tempC, hvac }, veh);
  return (veh.usableKWh * 1000 * capacityFactor(tempC, veh)) / whPerKm;
}

function split(rangeFn, warmC, coldC) {
  const variants = [VEH_LIT, VEH_EVDB].map((veh) => {
    const warm = rangeFn(veh, warmC, true);
    const coldNoHeat = rangeFn(veh, coldC, false);
    const cold = rangeFn(veh, coldC, true);
    return { warm, cold, coldLoss: warm - coldNoHeat, heatLoss: coldNoHeat - cold };
  });
  const pick = (k) => variants.map((v) => v[k]);
  const range = (k) => ({ low: Math.min(...pick(k)), high: Math.max(...pick(k)) });
  return { warm: range('warm'), cold: range('cold'), coldLoss: range('coldLoss'), heatLoss: range('heatLoss') };
}

/** Stadsrit (WLTC laag + middel), 20 °C tegenover −5 °C. */
export function cityWinter(warmC = 20, coldC = -5) {
  return split(cityRange, warmC, coldC);
}

/** Snelweg aan een vaste snelheid, 20 °C tegenover −5 °C. */
export function highwayWinter(speedKmh = 110, warmC = 20, coldC = -5) {
  return split((veh, t, hvac) => rangeKm({ speedKmh, tempC: t, hvac }, veh), warmC, coldC);
}
