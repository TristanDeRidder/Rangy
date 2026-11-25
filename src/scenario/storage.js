/**
 * Ritten en "Jouw situatie" bewaren op het toestel (localStorage), zonder account of server.
 * Pure functies met de opslag als parameter, zodat ze ook zonder browser te testen zijn.
 * Elke lees- en schrijfactie kan mislukken (privévenster, geblokkeerde opslag): dan gelden de standaardwaarden.
 */
import { normalizeTrip, migrateTrip, normalizeSituation } from './trips.js';

export const TRIPS_KEY = 'rangy.v2.trips';
export const SITUATION_KEY = 'rangy.v2.situation';
/** Ritten uit versie 1 ({ id, name, km, type }). Blijven staan, zodat terugkeren naar v1 kan. */
export const TRIPS_KEY_V1 = 'rangy.trips';

const read = (storage, key) => {
  try {
    return JSON.parse(storage?.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};

/** @returns {boolean} gelukt */
const write = (storage, key, value) => {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Ritten laden: eerst het nieuwe formaat, anders de ritten uit v1 omzetten, anders `fallback`.
 * @param {Storage | undefined} storage
 * @param {object[]} [fallback]  ritten bij een eerste bezoek (al in het nieuwe formaat of v1)
 */
export function loadTrips(storage, fallback = []) {
  const v2 = read(storage, TRIPS_KEY);
  if (Array.isArray(v2)) return v2.map(normalizeTrip);
  const v1 = read(storage, TRIPS_KEY_V1);
  // v1 bewaarde ritten soms zonder type: dat waren snelwegritten
  if (Array.isArray(v1) && v1.length) return v1.map((t) => migrateTrip({ type: 'snelweg', ...t }));
  return fallback.map(migrateTrip);
}

export const saveTrips = (storage, trips) => write(storage, TRIPS_KEY, trips);

export function loadSituation(storage) {
  return normalizeSituation(read(storage, SITUATION_KEY) ?? undefined);
}

export const saveSituation = (storage, situation) => write(storage, SITUATION_KEY, situation);
