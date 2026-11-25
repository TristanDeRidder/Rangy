/**
 * Van een route van GraphHopper naar stukken route voor het rekenmodel: soort weg, km, rijrichting, limiet.
 * Pure functies, zonder netwerk.
 *
 * GraphHopper geeft de punten van de route en "path details": [van punt, tot punt, waarde],
 * hier `road_class` (bv. motorway, trunk, primary, residential) en `max_speed` (km/u of null).
 *
 * Indeling [eigen aanname, na te gaan met echte routes]:
 *  - motorway                                 → snelweg (rekent met de ingestelde snelheid)
 *  - limiet ≥ 70 km/u                         → expresweg, met die limiet
 *  - geen limiet bekend: trunk                → expresweg, 90 km/u
 *  - geen limiet bekend: primary, secondary   → expresweg, 70 km/u (standaard buiten de bebouwde kom in Vlaanderen)
 *  - de rest                                  → bebouwde kom
 */
import { EXPRES_LIMIT_KMH } from '../scenario/roads.js';

/** Vanaf deze limiet telt een weg als expresweg. */
export const EXPRES_FROM_KMH = 70;
/** Standaardlimiet buiten de bebouwde kom in Vlaanderen sinds 2017 (ETSC, 2017). */
export const DEFAULT_OUTSIDE_KMH = 70;
/** Een stuk route wordt gesplitst als de richting meer dan zoveel graden afwijkt of het langer wordt dan MAX_KM. */
export const MAX_TURN_DEG = 30;
export const MAX_KM = 5;

const R_KM = 6371.0088; // gemiddelde straal van de aarde
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Afstand (km) tussen twee punten [lon, lat] (haversine). */
export function distanceKm([lon1, lat1], [lon2, lat2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Rijrichting (0 = noord, 90 = oost) van punt a naar punt b, beide [lon, lat]. */
export function bearingDeg([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/**
 * Soort weg en limiet voor één stuk.
 * @param {string|null} roadClass
 * @param {number|null} maxSpeed
 * @returns {{ road: 'kom'|'expres'|'snel', limitKmh: number|null }}
 */
export function classify(roadClass, maxSpeed) {
  const rc = String(roadClass ?? '').toLowerCase();
  const limit = Number(maxSpeed) > 0 ? Number(maxSpeed) : null;
  if (rc === 'motorway') return { road: 'snel', limitKmh: limit };
  if (limit) return limit >= EXPRES_FROM_KMH ? { road: 'expres', limitKmh: limit } : { road: 'kom', limitKmh: limit };
  if (rc === 'trunk') return { road: 'expres', limitKmh: EXPRES_LIMIT_KMH };
  if (rc === 'primary' || rc === 'secondary') return { road: 'expres', limitKmh: DEFAULT_OUTSIDE_KMH };
  return { road: 'kom', limitKmh: null };
}

/** Waarde van een path detail voor elk stuk tussen twee punten. */
function perStep(detail, steps) {
  const out = new Array(steps).fill(null);
  for (const [from, to, value] of detail ?? []) {
    for (let i = Math.max(0, from); i < Math.min(to, steps); i++) out[i] = value;
  }
  return out;
}

/**
 * Route (één `path` van GraphHopper) → stukken route.
 * Opeenvolgende stukjes met dezelfde soort weg en limiet worden samengevoegd, tot de richting te veel
 * draait (MAX_TURN_DEG) of het stuk te lang wordt (MAX_KM): zo houdt de wind rekening met bochten.
 * @param {{ distance?: number, points: { coordinates: number[][] }, details?: { road_class?: any[], max_speed?: any[] } }} path
 * @returns {{ km: number, segments: { road: string, km: number, bearingDeg: number, limitKmh: number|null }[] }}
 */
export function segmentsFromPath(path) {
  const pts = path?.points?.coordinates ?? [];
  const steps = Math.max(0, pts.length - 1);
  const rc = perStep(path?.details?.road_class, steps);
  const ms = perStep(path?.details?.max_speed, steps);

  const segments = [];
  let cur = null;
  const close = () => {
    if (cur && cur.km > 0) {
      segments.push({ road: cur.road, km: cur.km, bearingDeg: Math.round(bearingDeg(cur.start, cur.end)), limitKmh: cur.limitKmh });
    }
    cur = null;
  };
  for (let i = 0; i < steps; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const km = distanceKm(a, b);
    if (km === 0) continue;
    const { road, limitKmh } = classify(rc[i], ms[i]);
    const dir = bearingDeg(a, b);
    const same =
      cur && cur.road === road && cur.limitKmh === limitKmh && cur.km < MAX_KM && angleDiff(dir, cur.dir0) <= MAX_TURN_DEG;
    if (!same) {
      close();
      cur = { road, limitKmh, km: 0, start: a, end: a, dir0: dir };
    }
    cur.km += km;
    cur.end = b;
  }
  close();

  // de afstand van GraphHopper geldt: kleine verschillen door afronding van de punten rechtzetten
  const sum = segments.reduce((s, g) => s + g.km, 0);
  const total = path?.distance > 0 ? path.distance / 1000 : sum;
  const f = sum > 0 ? total / sum : 1;
  for (const g of segments) g.km = Math.round(g.km * f * 1000) / 1000;
  return { km: total, segments };
}
