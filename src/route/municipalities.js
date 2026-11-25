/**
 * De 565 Belgische gemeenten (na de fusies van 2025) met een middelpunt, voor routes van gemeente naar gemeente.
 * Zit in de app zelf: zoeken op naam stuurt niets naar buiten (geen geocoding-API).
 *
 * Bron: FPS BOSA, BeST Address (open data, CC BY 4.0), via lekoala/belgian-geography (snapshot 2026-11-05).
 * Middelpunt = gemiddelde van alle adrescoördinaten van de gemeente: ligt waar de mensen wonen,
 * niet in het geometrische midden. Een route rekent van middelpunt tot middelpunt [eigen aanname].
 */
import data from './municipalities.json';

/** @typedef {{ nis: number, name: string, region: 'VLG'|'BRU'|'WAL', lat: number, lon: number, alt?: string[] }} Municipality */

/** @type {Municipality[]} gesorteerd op naam */
export const MUNICIPALITIES = data.municipalities;
export const MUNICIPALITIES_SOURCE = data.meta;

const byNis = new Map(MUNICIPALITIES.map((m) => [m.nis, m]));

/** @returns {Municipality | null} */
export const municipalityByNis = (nis) => byNis.get(Number(nis)) ?? null;

/** Kleine letters, zonder accenten, koppeltekens en apostrofs als spatie. */
const fold = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-'’.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const index = MUNICIPALITIES.map((m) => ({ m, names: [m.name, ...(m.alt ?? [])].map(fold) }));

/**
 * Gemeenten zoeken op (een deel van) de naam, ook in het Frans of Duits en op namen van voor een fusie
 * (bv. "Borgloon" → Tongeren-Borgloon). Volgorde: exacte naam, begint ermee (kortste eerst),
 * een woord begint ermee, bevat de zoekterm.
 * @param {string} query
 * @param {number} [limit]
 * @returns {Municipality[]}
 */
export function searchMunicipalities(query, limit = 8) {
  const q = fold(query ?? '');
  if (!q) return [];
  const tier = (n) => (n === q ? 0 : n.startsWith(q) ? 1 : n.includes(` ${q}`) ? 2 : n.includes(q) ? 3 : 9);
  return index
    .map(({ m, names }) => {
      const best = names.reduce((b, n) => {
        const t = tier(n);
        return t < b.t || (t === b.t && n.length < b.len) ? { t, len: n.length } : b;
      }, { t: 9, len: Infinity });
      return { m, ...best };
    })
    .filter((x) => x.t < 9)
    .sort((a, b) => a.t - b.t || a.len - b.len || a.m.name.localeCompare(b.m.name, 'nl'))
    .slice(0, limit)
    .map((x) => x.m);
}
