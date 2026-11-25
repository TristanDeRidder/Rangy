/**
 * Route tussen twee gemeenten via de Routing API van GraphHopper (https://docs.graphhopper.com).
 * De oproep gaat naar /api/route: de Vite-server stuurt die door naar https://graphhopper.com/api/1/route
 * en voegt daar de sleutel (GRAPHHOPPER_KEY) toe, zodat ze nooit in de code van de browser terechtkomt
 * (zie vite.config.js).
 *
 * Wat naar GraphHopper gaat: alleen de middelpunten van de twee gemeenten, geen adres of locatie van het toestel.
 * Rangy bewaart daarna alleen de uitkomst (stukken route), niet de route zelf.
 */
import { segmentsFromPath } from './segments.js';

const ENDPOINT = '/api/route';
/** Zelfde route opnieuw in dezelfde sessie: geen nieuwe oproep (spaart de dagelijkse credits). */
const cache = new Map();

/**
 * @param {{ nis: number, lat: number, lon: number }} from
 * @param {{ nis: number, lat: number, lon: number }} to
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ km: number, segments: object[] }>}  km = afstand enkel
 */
export async function fetchRoute(from, to, signal) {
  if (!from || !to) throw new Error('Kies eerst je thuisgemeente en een bestemming.');
  if (from.nis === to.nis) throw new Error('Vertrek en bestemming liggen in dezelfde gemeente: geef de afstand zelf in.');
  const key = `${from.nis}>${to.nis}`;
  if (cache.has(key)) return cache.get(key);

  const body = {
    profile: 'car',
    points: [
      [from.lon, from.lat],
      [to.lon, to.lat],
    ],
    details: ['road_class', 'max_speed'],
    points_encoded: false,
    instructions: false,
    calc_points: true,
  };

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Geen verbinding met de routedienst.');
  }
  if (!res.ok) {
    const detail = await res.json().then((b) => String(b?.message ?? ''), () => '');
    if (res.status === 401 || res.status === 403) throw new Error('Ongeldige of ontbrekende sleutel (GRAPHHOPPER_KEY).');
    if (res.status === 429) throw new Error('Te veel routes opgevraagd vandaag. Probeer morgen opnieuw of geef de afstand zelf in.');
    if (res.status === 400 && detail) throw new Error(`Geen route gevonden (${detail}).`);
    throw new Error(`De routedienst gaf een fout (${res.status}).`);
  }

  const json = await res.json();
  const path = json?.paths?.[0];
  if (!path) throw new Error('Geen route gevonden.');
  const result = segmentsFromPath(path);
  if (!result.segments.length) throw new Error('De route bevat geen bruikbare stukken.');
  cache.set(key, result);
  return result;
}
