/**
 * Steden in België waaruit je kan kiezen. Het gratis abonnement van API Ninjas
 * zoekt niet op stadsnaam, dus elke stad heeft haar eigen coördinaten.
 */
export const CITIES = [
  { id: 'antwerpen', name: 'Antwerpen', lat: 51.2194, lon: 4.4025 },
  { id: 'brugge', name: 'Brugge', lat: 51.2093, lon: 3.2247 },
  { id: 'brussel', name: 'Brussel', lat: 50.8503, lon: 4.3517 },
  { id: 'gent', name: 'Gent', lat: 51.0543, lon: 3.7174 },
  { id: 'hasselt', name: 'Hasselt', lat: 50.9307, lon: 5.3325 },
  { id: 'leuven', name: 'Leuven', lat: 50.8798, lon: 4.7005 },
  { id: 'luik', name: 'Luik', lat: 50.6326, lon: 5.5797 },
  { id: 'namen', name: 'Namen', lat: 50.4674, lon: 4.872 },
];

export const DEFAULT_CITY = CITIES.find((c) => c.id === 'gent');

/** Dichtstbijzijnde stad uit de lijst, om een locatie een herkenbare naam te geven. */
export function nearestCity(lat, lon) {
  const dist = (c) => (c.lat - lat) ** 2 + ((c.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
  return CITIES.reduce((best, c) => (dist(c) < dist(best) ? c : best));
}
