import { useCallback, useEffect, useRef, useState } from 'react';
import { useScenario } from './scenario/useScenario.js';
import { useWeather } from './weather/useWeather.js';
import { getViewMode } from './scene/shared/viewMode.js';
import RoadScene from './scene/RoadScene.jsx';
import Topbar from './ui/Topbar.jsx';
import Result from './ui/Result.jsx';
import Controls from './ui/Controls.jsx';
import Panel from './ui/Panel.jsx';
import TripsPanel, { TripsFooter } from './ui/TripsPanel.jsx';
import ExplainPanel, { topicById } from './ui/explain/ExplainPanel.jsx';
import HintDialog from './ui/HintDialog.jsx';
import WeatherDialog from './ui/WeatherDialog.jsx';
import WelcomeDialog, { welcomeSeen } from './ui/WelcomeDialog.jsx';
import { IconArrow } from './ui/icons.jsx';
import { btnPrimary } from './ui/cls.js';

const WIDE = '(min-width: 900px)';
// ruimte voor de ingeklapte dock onderaan (balk 62 + tussenruimte 12 + knop 48 + onderrand 20),
// tot de echte hoogte gemeten is (zie useDockHeight)
const DOCK_DEFAULT = 'calc(142px + env(safe-area-inset-bottom))';

/**
 * Hoogte van de ingeklapte dock, zodat de baan er precies boven past.
 * De samenvatting kan naar twee regels gaan (terrein, lading): dan groeit de dock mee.
 * Open is de dock een paneel over de baan heen: die hoogte telt niet.
 */
function useDockHeight(ref, collapsed) {
  const [h, setH] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !collapsed) return undefined;
    const ro = new ResizeObserver(([e]) => setH(Math.ceil(e.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, collapsed]);
  return h;
}

function useMediaQuery(query) {
  const get = () => {
    try { return window.matchMedia(query).matches; } catch { return false; }
  };
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export default function App() {
  const { scene, setTrips, ...setters } = useScenario();
  const { setTempC } = setters;
  const [mode] = useState(getViewMode); // '3d' of 'svg', zie scene/shared/viewMode.js
  const wide = useMediaQuery(WIDE);
  const [view, setView] = useState('overview'); // 'overview' | 'trips' | 'explain'
  const [topic, setTopic] = useState(null); // onderwerp in de Uitleg, null = overzicht
  const [hint, setHint] = useState(null); // onderwerp van de open "?"
  const [sheetOpen, setSheetOpen] = useState(true);
  const weather = useWeather();
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !welcomeSeen());
  const todayC = weather.status === 'ready' ? weather.data.tempC : undefined;

  // nieuw weer binnen (start of andere plaats): temperatuurslider naar vandaag zetten (bereik −10…30 °C)
  useEffect(() => {
    if (todayC !== undefined) setTempC(Math.min(30, Math.max(-10, todayC)));
  }, [todayC, weather.place.lat, weather.place.lon, setTempC]);
  const mainRef = useRef(null);
  const dockRef = useRef(null);
  const dockH = useDockHeight(dockRef, !wide && !sheetOpen);

  const close = useCallback(() => setView('overview'), []);
  const toggle = (v) => setView((cur) => (cur === v ? 'overview' : v));
  /** Uitleg openen, op het overzicht (null) of meteen bij een onderwerp. */
  const explain = (id = null) => {
    setTopic(id);
    setView('explain');
  };
  const explainTopic = topic && topicById(topic);

  // Op de gsm bedekt een paneel het hele scherm: het overzicht erachter is dan niet bereikbaar
  useEffect(() => {
    if (mainRef.current) mainRef.current.inert = !wide && view !== 'overview';
  }, [wide, view]);

  const cta = (
    <button type="button" className={`${btnPrimary} justify-between px-5`} onClick={() => toggle('trips')} aria-expanded={view === 'trips'}>
      <span>MIJN RITTEN · {scene.trips.length}</span>
      <IconArrow />
    </button>
  );

  return (
    <div>
      {/* gsm: precies één schermhoogte (dvh = zonder de balken van de browser), niets om te scrollen */}
      <div
        className={wide ? '' : 'flex flex-col h-dvh overflow-hidden'}
        style={wide ? undefined : { paddingBottom: dockH ?? DOCK_DEFAULT }}
        ref={mainRef}
      >
        <Topbar weather={weather} onPlace={() => setWeatherOpen(true)} mode={mode} onInfo={() => (view === 'explain' ? close() : explain())} />

        {wide ? (
          <div className="grid grid-cols-[401px_1fr] gap-10 items-center max-w-378 mx-auto pt-6 px-12 pb-10 min-h-[calc(100vh-80px)]">
            <div className="flex flex-col gap-7">
              <Result scene={scene} showLink onWinter={() => explain('temperatuur')} onCar={() => explain('referentiewagen')} />
              <Controls variant="panel" scene={scene} todayC={todayC} onHint={setHint} {...setters} />
              {cta}
            </div>
            <div className={`flex justify-center origin-[0%_55%] transition-transform duration-350 ease-soft ${view !== 'overview' ? 'scale-75' : ''}`}>
              <RoadScene scene={scene} mode={mode} />
            </div>
          </div>
        ) : (
          <>
            <Result scene={scene} onCar={() => explain('referentiewagen')} />
            {/* vult de ruimte tussen resultaat en omstandigheden: scène in het midden = gelijke afstand erboven en eronder.
                Size-container: de baan schaalt mee met de hoogte die overblijft (zie sceneBox in cls.js).
                Ruimte bovenaan: de labels van verre ritten steken boven de baan uit. */}
            <div className="flex-1 min-h-0 flex flex-col justify-center w-full pt-9 pb-3 short:pt-8 short:pb-1.5 [container-type:size]">
              <RoadScene scene={scene} mode={mode} />
            </div>
            <div
              ref={dockRef}
              className={`fixed inset-x-0 bottom-0 mx-auto max-w-120 flex flex-col gap-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] transition-[background,box-shadow] duration-350 ease-soft ${
                sheetOpen ? 'bg-surface border border-line rounded-t-3xl shadow-[0_-4px_24px_rgb(0_0_0/0.12)] pt-3' : ''
              }`}
            >
              <Controls
                variant="sheet"
                open={sheetOpen}
                onToggle={() => setSheetOpen((o) => !o)}
                scene={scene}
                todayC={todayC}
                onHint={setHint}
                {...setters}
              />
              {cta}
            </div>
          </>
        )}
      </div>

      <WeatherDialog open={weatherOpen} onClose={() => setWeatherOpen(false)} weather={weather} />
      <WelcomeDialog
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        onMore={() => {
          setWelcomeOpen(false);
          explain('hoe-werkt');
        }}
      />
      <HintDialog
        topic={hint}
        onClose={() => setHint(null)}
        onMore={(id) => {
          setHint(null);
          explain(id);
        }}
      />

      <Panel title="Mijn ritten" open={view === 'trips'} onClose={close} wide={wide} footer={<TripsFooter onDone={close} />}>
        <TripsPanel scene={scene} setTrips={setTrips} />
      </Panel>
      <Panel
        title={explainTopic ? explainTopic.title : 'Uitleg'}
        kicker={explainTopic ? 'Uitleg' : undefined}
        open={view === 'explain'}
        onClose={close}
        onBack={explainTopic ? () => setTopic(null) : undefined}
        page={topic}
        wide={wide}
      >
        <ExplainPanel topic={topic} onTopic={setTopic} scene={scene} />
      </Panel>
    </div>
  );
}
