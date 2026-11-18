import { useMemo, useState } from 'react';
import { buildScene } from './buildScene.js';

const STORAGE_KEY = 'rangy.trips';

/** Weer van vandaag: voorlopig een vaste waarde, later via een weer-API. */
export const TODAY = { place: 'Gent', tempC: 8 };

const DEFAULT_TRIPS = [
  { id: 'werk', name: 'Woon-werk', km: 45 },
  { id: 'weekend', name: 'Weekendrit', km: 150 },
  { id: 'uitstap', name: 'Uitstap', km: 340 },
  { id: 'vakantie', name: 'Vakantie', km: 600 },
];

function loadTrips() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* geen opslag beschikbaar: standaardritten */
  }
  return DEFAULT_TRIPS;
}

/**
 * Houdt de keuzes van de gebruiker bij en geeft de scènebeschrijving terug.
 * Ritten blijven op het toestel (localStorage), zonder account of server.
 */
export function useScenario(initial = {}) {
  const [tripType, setTripType] = useState(initial.tripType ?? 'snelweg');
  const [speedKmh, setSpeedKmh] = useState(initial.speedKmh ?? 110);
  const [tempC, setTempC] = useState(initial.tempC ?? TODAY.tempC);
  const [trips, setTripsState] = useState(loadTrips);

  const setTrips = (next) => {
    setTripsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* opslaan mislukt: de ritten blijven tot de pagina sluit */
    }
  };

  const scene = useMemo(
    () => buildScene({ tripType, speedKmh, tempC, trips }),
    [tripType, speedKmh, tempC, trips],
  );

  return { scene, setTripType, setSpeedKmh, setTempC, setTrips };
}
