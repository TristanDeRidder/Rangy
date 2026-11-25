/**
 * Ritten en "jouw situatie": het formaat, standaardwaarden en het omzetten van oudere opgeslagen ritten.
 *
 * Een rit:
 *  - km         afstand voor één richting
 *  - roundTrip  heen en terug op dezelfde dag (standaard ja)
 *  - days       weekdagen waarop je de rit maakt, 0 = maandag … 6 = zondag. Leeg = af en toe.
 *  - mix        aandeel bebouwde kom / expresweg / snelweg (uit de route, of een standaardmix)
 *  - dest       bestemming (NIS-code van de gemeente) of null als de afstand zelf ingegeven is
 *  - segments   route in stukken (heenrit): soort weg, km en rijrichting; null zonder route.
 *               Met een route komen km en mix uit de stukken.
 *  - load       lading voor deze rit, bovenop de bestuurder
 */
import { normalizeMix, ROADS } from './roads.js';

export const DAYS = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];
export const WEEKDAYS = [0, 1, 2, 3, 4];

/** Mix voor een rit zonder bestemming [eigen aanname]. */
export const DEFAULT_MIX = { kom: 0.4, expres: 0.2, snel: 0.4 };

/**
 * "Jouw situatie" bij een eerste bezoek.
 *  - chargeDays  dagen waarop je laadt als je geen thuislader hebt (0 = maandag … 6 = zondag).
 *                Leeg = Rangy stelt zelf laaddagen voor.
 */
export const DEFAULT_SITUATION = { home: null, charging: 'onbekend', chargeDays: [], preheat: false };

/** @typedef {'ja' | 'nee' | 'onbekend'} Charging */

/**
 * Soorten ritten voor de chips in het welkomstvenster.
 * Afstanden, dagen en mix zijn voorbeeldwaarden tot de gebruiker ze aanpast [eigen aanname].
 */
export const PRESETS = {
  werk: { name: 'Werk', km: 25, days: WEEKDAYS, mix: { kom: 0.2, expres: 0.2, snel: 0.6 } },
  kinderen: { name: 'Kinderen brengen/halen', km: 4, days: WEEKDAYS, mix: { kom: 1 } },
  sport: { name: 'Sport', km: 8, days: [1, 3], mix: { kom: 0.6, expres: 0.4 } },
  boodschappen: { name: 'Boodschappen', km: 5, days: [5], mix: { kom: 1 } },
  familie: { name: 'Familie', km: 40, days: [6], mix: { kom: 0.15, expres: 0.15, snel: 0.7 } },
  school: { name: 'School', km: 10, days: WEEKDAYS, mix: { kom: 0.7, expres: 0.3 } },
  hobby: { name: 'Hobby', km: 10, days: [2], mix: { kom: 0.6, expres: 0.4 } },
};

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Lijst van weekdagen opschonen: alleen 0–6, geen dubbels, gesorteerd. */
export const cleanDays = (days) =>
  [...new Set((days ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);

/** NIS-code van een gemeente (positief geheel getal) of null. */
const toNis = (v) => {
  const n = Number(v);
  return v != null && v !== '' && Number.isInteger(n) && n > 0 ? n : null;
};

const cleanBearing = (deg) => (deg == null || !Number.isFinite(Number(deg)) ? null : ((Number(deg) % 360) + 360) % 360);
const kmOn = (segments, road) => segments.filter((g) => g.road === road).reduce((s, g) => s + g.km, 0);

/** Route-stukken opschonen: geldige soort weg, km > 0, rijrichting 0–360° of null, limiet (km/u) of null. */
function cleanSegments(segments) {
  if (!Array.isArray(segments)) return null;
  const clean = segments
    .filter((g) => ROADS.includes(g.road) && Number(g.km) > 0)
    .map((g) => ({
      road: g.road,
      km: Number(g.km),
      bearingDeg: cleanBearing(g.bearingDeg),
      limitKmh: Number(g.limitKmh) > 0 ? Number(g.limitKmh) : null,
    }));
  return clean.length ? clean : null;
}

/** Rit aanvullen met standaardwaarden en opschonen. */
export function normalizeTrip(t) {
  const days = cleanDays(t.days);
  const segments = cleanSegments(t.segments);
  const fromRoute = segments
    ? {
        km: segments.reduce((s, g) => s + g.km, 0),
        mix: Object.fromEntries(ROADS.map((r) => [r, kmOn(segments, r)])),
      }
    : null;
  return {
    id: t.id ?? newId(),
    name: t.name ?? 'Rit',
    km: fromRoute ? fromRoute.km : Math.max(0, Number(t.km) || 0),
    roundTrip: t.roundTrip ?? true,
    days,
    mix: normalizeMix(fromRoute ? fromRoute.mix : (t.mix ?? DEFAULT_MIX)),
    dest: toNis(t.dest), // NIS-code van de bestemming
    segments,
    load: { passengers: Math.max(0, t.load?.passengers ?? 0), bags: Math.max(0, t.load?.bags ?? 0) },
  };
}

/** Rit uit een preset (welkomstvenster). */
export function tripFromPreset(key) {
  const p = PRESETS[key];
  return normalizeTrip({ ...p, id: key });
}

/**
 * Ritten uit een vorige versie omzetten.
 * Vroeger: { id, name, km, type: 'stad' | 'snelweg' }, km = de volledige afstand van die dag.
 * Nu: een rit die af en toe terugkomt, met die volledige afstand als enkele rit, zodat er niets verandert.
 */
export function migrateTrip(old) {
  if (Array.isArray(old.days)) return normalizeTrip(old);
  return normalizeTrip({
    id: old.id,
    name: old.name,
    km: old.km,
    roundTrip: false,
    days: [],
    mix: old.type === 'stad' ? { kom: 1 } : { snel: 1 },
  });
}

/** Afstand van één keer de rit, heen en terug meegerekend. */
export const tripDistance = (t) => t.km * (t.roundTrip ? 2 : 1);

/** Rit met vaste dagen (elke week) of af en toe. */
export const isWeekly = (t) => t.days.length > 0;

export function normalizeSituation(s = {}) {
  const charging = ['ja', 'nee', 'onbekend'].includes(s.charging) ? s.charging : DEFAULT_SITUATION.charging;
  const home = charging === 'ja';
  return {
    home: toNis(s.home), // NIS-code van de gemeente
    charging,
    // met een thuislader laad je elke dag: laaddagen kiezen heeft dan geen zin
    chargeDays: home ? [] : cleanDays(s.chargeDays),
    preheat: home ? Boolean(s.preheat) : false,
  };
}
