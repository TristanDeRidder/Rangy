/**
 * Rekenmodel v2: van ritten + omstandigheden + situatie naar wat Rangy toont.
 * Pure functies: zelfde invoer = zelfde uitvoer.
 *
 *  - bereik met je eigen mix van wegen (het grote getal)
 *  - per dag: afstand, batterijverbruik, status; de drukste dag
 *  - per week zonder dagelijks laden: batterijniveau per dag en laadmomenten
 *  - ritten die af en toe terugkomen: status per rit
 */
import { mixRange, batteryShare, shareStatus, weightedMix, RESERVE } from './roads.js';
import { DAYS, DEFAULT_MIX, normalizeTrip, normalizeSituation, tripDistance, isWeekly } from './trips.js';
import { extraKgOf } from './buildScene.js';
import { scaleMaxKm, toT } from '../scene/shared/projection.js';

/** Laden zonder thuislader: van 10 % tot 90 % per laadbeurt [eigen aanname]. */
export const CHARGE_FROM = RESERVE;
export const CHARGE_TO = 0.9;

const cond = (inputs, t) => ({
  speedKmh: inputs.speedKmh,
  tempC: inputs.tempC,
  expresLimitKmh: inputs.expresLimitKmh,
  extraKg: t ? extraKgOf(t.load) : 0,
});

/** Batterijdeel van één keer deze rit (heen en terug meegerekend). */
export function tripShare(t, inputs) {
  return batteryShare(tripDistance(t), t.mix, cond(inputs, t));
}

/**
 * Elke weekdag: welke ritten, hoeveel km, welk deel van een volle batterij.
 * @returns {{ day:number, label:string, km:number, trips:string[], share:{worst:number,best:number}, status:string }[]}
 */
export function dayTotals(trips, inputs) {
  const weekly = trips.filter(isWeekly);
  return DAYS.map((label, day) => {
    const ts = weekly.filter((t) => t.days.includes(day));
    const shares = ts.map((t) => tripShare(t, inputs));
    const share = {
      worst: shares.reduce((s, x) => s + x.worst, 0),
      best: shares.reduce((s, x) => s + x.best, 0),
    };
    return {
      day,
      label,
      km: ts.reduce((s, t) => s + tripDistance(t), 0),
      trips: ts.map((t) => t.id),
      share,
      status: ts.length ? shareStatus(share) : null,
    };
  });
}

/** Dag met het hoogste batterijverbruik (slechtste geval). Null als er geen vaste ritten zijn. */
export function busiestDay(days) {
  const withTrips = days.filter((d) => d.trips.length);
  if (!withTrips.length) return null;
  return withTrips.reduce((a, b) => (b.share.worst > a.share.worst ? b : a));
}

/** Batterijdeel van elke rit, per weekdag (slechtste geval). */
const needsPerDay = (trips, inputs) => {
  const weekly = trips.filter(isWeekly);
  return DAYS.map((_, day) => weekly.filter((t) => t.days.includes(day)).map((t) => tripShare(t, inputs).worst));
};

/**
 * Eén week met vaste laaddagen. Twee weken rekenen, de tweede tonen: na de eerste laaddag
 * herhaalt het patroon zich elke week, los van hoe vol de batterij op de eerste maandag was.
 */
function runWeek(needs, chargeDays) {
  let level = CHARGE_TO;
  let result;
  let enRoute = false;
  for (let week = 0; week < 2; week++) {
    const days = [];
    let charges = 0;
    let extra = 0;
    for (let day = 0; day < 7; day++) {
      const charged = chargeDays.includes(day);
      if (charged) {
        level = CHARGE_TO;
        charges++;
      }
      let extraCharge = false;
      let min = level;
      for (const need of needs[day]) {
        if (level - need < CHARGE_FROM) {
          level = CHARGE_TO;
          extraCharge = true;
          extra++;
          if (CHARGE_TO - need < CHARGE_FROM) enRoute = true; // zelfs vanaf 90 % niet genoeg: onderweg laden
        }
        level -= need;
        min = Math.min(min, level);
      }
      days.push({
        day,
        label: DAYS[day],
        min: Math.max(0, min),
        end: Math.max(0, level),
        charged,
        extra: extraCharge,
      });
    }
    result = { days, charges, extra };
  }
  return {
    ...result,
    enRoute,
    lowest: Math.min(...result.days.map((d) => d.min)),
  };
}

/** Alle combinaties van weekdagen (minstens één dag), van weinig naar veel dagen. */
const DAY_SETS = Array.from({ length: 127 }, (_, i) => i + 1)
  .map((bits) => [0, 1, 2, 3, 4, 5, 6].filter((d) => bits & (1 << d)))
  .sort((a, b) => a.length - b.length);

/**
 * Laaddagen die Rangy voorstelt: zo weinig mogelijk dagen per week waarmee de batterij
 * nooit onder 10 % zakt. Bij gelijk aantal: de combinatie met de meeste marge (hoogste laagste niveau).
 * Lukt het met geen enkele combinatie (een dag vraagt meer dan 80 %), dan de combinatie met de minste extra laadbeurten.
 */
function bestChargeDays(needs) {
  if (!needs.some((n) => n.length)) return [];
  let best = null;
  for (const set of DAY_SETS) {
    if (best && best.res.extra === 0 && set.length > best.set.length) break;
    const res = runWeek(needs, set);
    const better =
      !best ||
      res.extra < best.res.extra ||
      (res.extra === best.res.extra && set.length < best.set.length) ||
      (res.extra === best.res.extra && set.length === best.set.length && res.lowest > best.res.lowest + 1e-9);
    if (better) best = { set, res };
  }
  return best.set;
}

/** Laaddagen die Rangy voorstelt als je geen thuislader hebt (0 = maandag). */
export function suggestChargeDays(trips, inputs) {
  return bestChargeDays(needsPerDay(trips, inputs));
}

/**
 * Week zonder dagelijks laden. Gerekend met het slechtste geval.
 * Op een laaddag vertrek je met 90 %: je laadt vóór de ritten van die dag
 * (bv. 's nachts of 's ochtends aan een publieke laadpaal) [eigen aanname].
 *
 * Laaddagen: zelf gekozen (chargeDays), of anders het voorstel van Rangy (`suggestChargeDays`).
 * Zakt de batterij vóór een rit toch onder 10 %, dan is er een extra laadbeurt nodig vóór die rit (`extra`).
 *
 * @param {object[]} trips  genormaliseerde ritten
 * @param {object} inputs
 * @param {number[]} [chargeDays]  zelf gekozen laaddagen (0 = maandag); leeg = voorstel van Rangy
 * @returns {import('./types.js').WeekPlan}
 */
export function simulateWeek(trips, inputs, chargeDays = []) {
  const needs = needsPerDay(trips, inputs);
  const suggested = bestChargeDays(needs);
  const planned = chargeDays.length > 0;
  const { days, charges, extra, enRoute } = runWeek(needs, planned ? chargeDays : suggested);
  // gemiddeld aantal volle laadbeurten (10 → 90 %) per week, los van de laaddagen
  const total = needs.flat().reduce((s, x) => s + x, 0);
  return {
    days,
    planned,
    charges,
    extra,
    ok: extra === 0,
    perWeek: total / (CHARGE_TO - CHARGE_FROM),
    enRoute,
    suggested,
  };
}

/**
 * Alles wat de schermen nodig hebben, in één object.
 * @param {{ speedKmh:number, tempC:number, expresLimitKmh?:number, trips:object[], situation?:object }} input
 * situation.chargeDays: eigen laaddagen zonder thuislader (zie simulateWeek)
 */
export function buildPlan(input) {
  const trips = (input.trips ?? []).map(normalizeTrip);
  const situation = normalizeSituation(input.situation);
  const inputs = {
    speedKmh: input.speedKmh,
    tempC: input.tempC,
    expresLimitKmh: input.expresLimitKmh,
  };

  const weekly = trips.filter(isWeekly);
  const occasional = trips.filter((t) => !isWeekly(t));

  // het grote getal: bereik met je eigen mix, gewogen naar je km per week (zonder lading)
  const mix = weightedMix(weekly.map((t) => ({ km: tripDistance(t) * t.days.length, mix: t.mix }))) ?? DEFAULT_MIX;
  const range = mixRange(mix, cond(inputs));

  const days = dayTotals(trips, inputs);
  const busiest = busiestDay(days);
  const weekKm = days.reduce((s, d) => s + d.km, 0);

  // ritten die af en toe terugkomen: elk met zijn eigen mix en lading
  const occ = occasional.map((t) => {
    const share = tripShare(t, inputs);
    return {
      id: t.id,
      name: t.name,
      distanceKm: tripDistance(t),
      share,
      status: shareStatus(share),
    };
  });

  // dagelijks laden (thuis of op het werk): elke dag begint vol
  const daily = {
    allDaysOk: days.every((d) => !d.status || d.status === 'haalbaar'),
  };
  // niet (zeker) dagelijks laden: weekweergave met laadmomenten
  // met eigen laaddagen als die gekozen zijn, anders met de laaddagen die Rangy voorstelt
  const week = situation.charging === 'ja' ? null : simulateWeek(trips, inputs, situation.chargeDays);

  // posities op de baan (zelfde schaal als v1)
  const markers = [
    ...(busiest
      ? [
          {
            id: 'drukste-dag',
            name: `Drukste dag · ${busiest.label}`,
            distanceKm: busiest.km,
            status: busiest.status,
            share: busiest.share,
          },
        ]
      : []),
    ...occ,
  ];
  const maxKm = scaleMaxKm(
    range.high,
    markers.map((m) => m.distanceKm),
  );

  return {
    inputs: { ...inputs, situation },
    trips,
    mix,
    rangeKm: range,
    rangeT: {
      safe: toT(range.safe, maxKm),
      low: toT(range.low, maxKm),
      high: toT(range.high, maxKm),
    },
    maxKm,
    days,
    busiest,
    weekKm,
    occasional: occ,
    markers: markers.map((m) => ({ ...m, t: toT(m.distanceKm, maxKm) })),
    charging: situation.charging,
    daily,
    week,
  };
}
