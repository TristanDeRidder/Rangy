import { nearestCity } from './cities.js';

/**
 * Ruwe locatie van het toestel: lage nauwkeurigheid en afgerond op 2 decimalen (± 1 km).
 * Werkt enkel in een beveiligde context (https of localhost), dus niet via http://192.168… op je gsm.
 * @returns {Promise<{ kind: 'geo', lat: number, lon: number, name: string }>}
 */
export function getRoughLocation() {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !('geolocation' in navigator)) {
      reject(new Error('Locatie werkt enkel via https of localhost. Kies een stad.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = Math.round(coords.latitude * 100) / 100;
        const lon = Math.round(coords.longitude * 100) / 100;
        resolve({ kind: 'geo', lat, lon, name: nearestCity(lat, lon).name });
      },
      (err) => {
        const msg = {
          1: 'Je gaf geen toestemming voor je locatie. Kies een stad.',
          2: 'Je locatie kon niet bepaald worden. Kies een stad.',
          3: 'Je locatie bepalen duurde te lang. Probeer opnieuw.',
        }[err.code];
        reject(new Error(msg ?? 'Je locatie kon niet bepaald worden.'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  });
}
