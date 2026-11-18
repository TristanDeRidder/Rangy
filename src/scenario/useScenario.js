import { useMemo, useState } from 'react';
import { buildScene } from './buildScene.js';

const STORAGE_KEY = 'rangy.trips';

/** Starttemperatuur van de slider, tot het echte weer binnen is (zie weather/useWeather.js). */
export const TODAY = { tempC: 8 };

const DEFAULT_TRIPS = [
  { id: 'werk', name: 'Woon-werk', km: 45, type: 'stad' },
  { id: 'weekend', name: 'Weekendrit', km: 150, type: 'snelweg' },
  { id: 'uitstap', name: 'Uitstap', km: 340, type: 'snelweg' },
  { id: 'vakantie', name: 'Vakantie', km: 600, type: 'snelweg' },
];

function loadTrips() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // oudere opgeslagen ritten hebben nog geen type: die waren snelwegritten
    if (Array.isArray(saved) && saved.length) return saved.map((t) => ({ type: 'snelweg', ...t }));
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
  const [terrain, setTerrain] = useState(initial.terrain ?? 'vlak');
  const [passengers, setPassengers] = useState(initial.passengers ?? 0);
  const [bags, setBags] = useState(initial.bags ?? 0);
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
    () => buildScene({ tripType, speedKmh, tempC, terrain, passengers, bags, trips }),
    [tripType, speedKmh, tempC, terrain, passengers, bags, trips],
  );

  return { scene, setTripType, setSpeedKmh, setTempC, setTerrain, setPassengers, setBags, setTrips };
}
