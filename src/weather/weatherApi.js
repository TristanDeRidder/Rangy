/**
 * Huidig weer via API Ninjas (https://api-ninjas.com/api/weather).
 * De oproep gaat naar /api/weather: de Vite-server stuurt die door naar
 * https://api.api-ninjas.com/v1/weather en voegt daar de API-sleutel toe,
 * zodat de sleutel nooit in de code van de browser terechtkomt (zie vite.config.js).
 */
const ENDPOINT = '/api/weather';
const CACHE_MS = 10 * 60 * 1000; // zelfde plek binnen 10 minuten: geen nieuwe oproep (spaart het maandquotum)
const cache = new Map();

/**
 * @param {{ lat: number, lon: number }} coords
 * @param {AbortSignal} [signal]
 * @returns {Promise<Weather>}
 */
export async function fetchWeather({ lat, lon }, signal) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const params = new URLSearchParams({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
  let res;
  try {
    res = await fetch(`${ENDPOINT}?${params}`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Geen verbinding met de weerdienst.');
  }
  if (!res.ok) {
    const detail = await res.json().then((b) => String(b?.error ?? b?.message ?? ''), () => '');
    if (res.status === 401 || res.status === 403 || /api key/i.test(detail)) {
      throw new Error('Ongeldige of ontbrekende API-sleutel (API_NINJAS_KEY in .env.local).');
    }
    if (res.status === 429) throw new Error('Te veel aanvragen. Probeer later opnieuw.');
    throw new Error(`De weerdienst gaf een fout (${res.status}).`);
  }

  const data = normalize(await res.json());
  cache.set(key, { at: Date.now(), data });
  return data;
}

/**
 * @typedef {object} Weather
 * @property {number} tempC
 * @property {number} feelsLikeC
 * @property {number} minC
 * @property {number} maxC
 * @property {number} humidity    procent
 * @property {number} cloudPct    procent
 * @property {number} windKmh
 * @property {string} description bv. "broken clouds"
 * @property {string} condition   bv. "Clouds", "Rain", "Snow"
 * @property {boolean} isDay
 * @property {string | null} iconUrl
 */
function normalize(raw) {
  const round = (v) => (typeof v === 'number' ? Math.round(v) : null);
  return {
    tempC: round(raw.temp),
    feelsLikeC: round(raw.feels_like),
    minC: round(raw.min_temp),
    maxC: round(raw.max_temp),
    humidity: round(raw.humidity),
    cloudPct: round(raw.cloud_pct),
    windKmh: typeof raw.wind_speed === 'number' ? Math.round(raw.wind_speed * 3.6) : null, // m/s → km/h
    description: raw.weather_description ?? '',
    condition: raw.weather ?? '',
    isDay: raw.is_day ?? true,
    iconUrl: raw.weather_icon_url ?? null,
  };
}
