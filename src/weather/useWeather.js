import { useEffect, useState } from 'react';
import { CITIES, DEFAULT_CITY } from './cities.js';
import { fetchWeather } from './weatherApi.js';

const STORAGE_KEY = 'rangy.location';

/**
 * Gekozen plek: een stad uit de lijst of de (afgeronde) locatie van het toestel.
 * @typedef {{ kind: 'city', id: string, name: string, lat: number, lon: number }
 *   | { kind: 'geo', name: string, lat: number, lon: number }} Place
 */
function loadPlace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.kind === 'city') {
      const city = CITIES.find((c) => c.id === saved.id);
      if (city) return { kind: 'city', ...city };
    }
    if (saved?.kind === 'geo' && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) return saved;
  } catch {
    /* geen opslag beschikbaar */
  }
  return { kind: 'city', ...DEFAULT_CITY };
}

/** Weer voor de gekozen plek. De keuze blijft op het toestel bewaard. */
export function useWeather() {
  const [place, setPlaceState] = useState(loadPlace);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading', data: null, error: null });
    fetchWeather(place, ctrl.signal).then(
      (data) => setState({ status: 'ready', data, error: null }),
      (err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', data: null, error: err.message });
      },
    );
    return () => ctrl.abort();
  }, [place.lat, place.lon]);

  const setPlace = (next) => {
    setPlaceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* niet bewaard: geldt tot de pagina sluit */
    }
  };

  return { place, setPlace, ...state };
}
