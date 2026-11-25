import { useCallback, useMemo, useRef, useState } from 'react';
import { buildPlan } from './plan.js';
import { PRESETS, normalizeTrip, normalizeSituation } from './trips.js';
import { loadTrips, saveTrips, loadSituation, saveSituation } from './storage.js';
import { municipalityByNis } from '../route/municipalities.js';
import { fetchRoute } from '../route/routeApi.js';

/** Starttemperatuur van de slider, tot het echte weer binnen is (zie weather/useWeather.js). */
export const TODAY = { tempC: 8 };

/** Bij een eerste bezoek zijn er geen ritten: het welkom laat de vaste ritten kiezen (zie WelcomeDialog). */
const DEFAULT_TRIPS = [];

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/**
 * Houdt de keuzes van de gebruiker bij en geeft terug wat de schermen nodig hebben.
 *  - plan: het rekenmodel v2 (buildPlan): eigen mix, dagen, drukste dag, week, ritten die af en toe terugkomen
 * Ritten en "Jouw situatie" blijven op het toestel (localStorage), zonder account of server.
 */
export function useScenario(initial = {}) {
  // omstandigheden
  const [speedKmh, setSpeedKmh] = useState(initial.speedKmh ?? 110);
  const [tempC, setTempC] = useState(initial.tempC ?? TODAY.tempC);
  const [wind, setWind] = useState(initial.wind ?? null); // { speedMs, fromDeg } uit het weerbericht

  // ritten en situatie (v2)
  const [trips, setTripsState] = useState(() => loadTrips(storage(), DEFAULT_TRIPS));
  const [situation, setSituationState] = useState(() => loadSituation(storage()));


  /** Alle ritten vervangen (nieuw formaat). Accepteert ook een functie van de huidige ritten. */
  const setTrips = useCallback((next) => {
    setTripsState((cur) => {
      const list = (typeof next === 'function' ? next(cur) : next).map(normalizeTrip);
      saveTrips(storage(), list); // mislukt het, dan blijven de ritten tot de pagina sluit
      return list;
    });
  }, []);

  /** Rit toevoegen: een rit, of de naam van een voorbeeldrit (zie PRESETS). Geeft de nieuwe rit terug. */
  const addTrip = useCallback(
    (tripOrPreset) => {
      const t = normalizeTrip(typeof tripOrPreset === 'string' ? { ...PRESETS[tripOrPreset] } : tripOrPreset);
      setTrips((cur) => [...cur, t]);
      return t;
    },
    [setTrips],
  );
  const updateTrip = useCallback(
    (id, patch) => setTrips((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [setTrips],
  );
  const removeTrip = useCallback((id) => setTrips((cur) => cur.filter((t) => t.id !== id)), [setTrips]);
  const clearTrips = useCallback(() => setTrips([]), [setTrips]);

  /** "Jouw situatie" aanpassen (alleen de velden die veranderen). */
  const setSituation = useCallback((patch) => {
    setSituationState((cur) => {
      const next = normalizeSituation({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) });
      saveSituation(storage(), next);
      return next;
    });
  }, []);

  // laatste ritten en situatie, voor de route-functies (die lopen async, na een render)
  const latest = useRef({ trips, situation });
  latest.current = { trips, situation };

  /**
   * Route van de thuisgemeente naar een bestemming (NIS-code van de gemeente) voor één rit.
   * Afstand en mix komen dan uit de route. Lukt het niet, dan blijft de rit zoals hij was.
   * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
   */
  const routeTrip = useCallback(
    async (id, destNis, signal) => {
      try {
        const home = municipalityByNis(latest.current.situation.home);
        const dest = municipalityByNis(destNis);
        if (!home) throw new Error('Kies eerst je thuisgemeente bij Jouw situatie.');
        if (!dest) throw new Error('Onbekende gemeente.');
        const { segments } = await fetchRoute(home, dest, signal);
        updateTrip(id, { dest: dest.nis, segments });
        return { ok: true };
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        return { ok: false, error: err.message };
      }
    },
    [updateTrip],
  );

  /**
   * Thuisgemeente kiezen. Ritten met een bestemming krijgen een nieuwe route vanaf de nieuwe gemeente.
   * @returns {Promise<{ id: string, ok: boolean, error?: string }[]>}  uitkomst per herberekende rit
   */
  const setHome = useCallback(
    async (nis) => {
      setSituation({ home: municipalityByNis(nis)?.nis ?? null });
      latest.current.situation = { ...latest.current.situation, home: municipalityByNis(nis)?.nis ?? null };
      const withDest = latest.current.trips.filter((t) => t.dest != null);
      const results = await Promise.all(withDest.map((t) => routeTrip(t.id, t.dest)));
      return results.map((r, i) => ({ id: withDest[i].id, ...r }));
    },
    [setSituation, routeTrip],
  );

  const plan = useMemo(
    () => buildPlan({ speedKmh, tempC, wind, trips, situation }),
    [speedKmh, tempC, wind, trips, situation],
  );

  // omstandigheden (zie Controls): snelheid op de snelweg en temperatuur; de wind komt uit het weer (setWind)
  const controls = useMemo(() => ({ setSpeedKmh, setTempC }), []);

  return {
    plan,
    trips,
    situation,
    setTrips,
    addTrip,
    updateTrip,
    removeTrip,
    clearTrips,
    setSituation,
    setHome,
    routeTrip,
    setWind,
    controls,
  };
}
