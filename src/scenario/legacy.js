/**
 * Tijdelijke brug naar de interface van versie 1 (Mijn ritten met stad/snelweg, de baan van buildScene).
 * Weg te halen zodra de nieuwe schermen buildPlan gebruiken.
 *
 *  - toLegacyTrip: rit v2 → { id, name, km, type } zoals buildScene en TripsPanel die kennen
 *  - fromLegacyTrips: lijst uit TripsPanel → ritten v2, met behoud van wat v1 niet kent
 *    (dagen, heen en terug, lading, ...)
 */
import { migrateTrip, normalizeTrip, tripDistance } from './trips.js';

/** Soort rit in v1: stad als de bebouwde kom minstens de helft is, anders snelweg [eigen keuze voor de brug]. */
const legacyType = (t) => (t.mix.kom >= 0.5 ? 'stad' : 'snelweg');

export function toLegacyTrip(t) {
  return { id: t.id, name: t.name, km: tripDistance(t), type: legacyType(t) };
}

/**
 * @param {{ id: string, name: string, km: number, type?: string }[]} list  zoals TripsPanel ze doorgeeft
 * @param {object[]} current  de ritten v2 van nu
 */
export function fromLegacyTrips(list, current) {
  return list.map((old) => {
    const t = current.find((c) => c.id === old.id);
    if (!t) return migrateTrip(old); // nieuwe rit uit v1: af en toe, volledige afstand
    const next = { ...t, name: old.name };
    const kmChanged = Number(old.km) !== tripDistance(t);
    const typeChanged = old.type && old.type !== legacyType(t);
    if (kmChanged) next.km = Number(old.km) / (t.roundTrip ? 2 : 1);
    if (typeChanged) next.mix = old.type === 'stad' ? { kom: 1 } : { snel: 1 };
    // zelf aangepast: de route klopt niet meer
    if (kmChanged || typeChanged) {
      next.segments = null;
      next.dest = null;
    }
    return normalizeTrip(next);
  });
}
