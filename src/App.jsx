import { useCallback, useEffect, useRef, useState } from 'react';
import { useScenario, TODAY } from './scenario/useScenario.js';
import { getViewMode } from './scene/shared/viewMode.js';
import RoadScene from './scene/RoadScene.jsx';
import Topbar from './ui/Topbar.jsx';
import Result from './ui/Result.jsx';
import Controls from './ui/Controls.jsx';
import Panel from './ui/Panel.jsx';
import TripsPanel, { TripsFooter } from './ui/TripsPanel.jsx';
import WinterPanel, { WinterFooter } from './ui/WinterPanel.jsx';
import { IconArrow } from './ui/icons.jsx';
import { btnPrimary } from './ui/cls.js';

const WIDE = '(min-width: 900px)';

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
  const { scene, setTripType, setSpeedKmh, setTempC, setTrips } = useScenario();
  const [mode] = useState(getViewMode); // '3d' of 'svg', zie scene/shared/viewMode.js
  const wide = useMediaQuery(WIDE);
  const [view, setView] = useState('overview'); // 'overview' | 'trips' | 'winter'
  const [sheetOpen, setSheetOpen] = useState(true);
  const mainRef = useRef(null);

  const close = useCallback(() => setView('overview'), []);
  const toggle = (v) => setView((cur) => (cur === v ? 'overview' : v));
  const setters = { setTripType, setSpeedKmh, setTempC };

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
      <div className={wide ? '' : 'pb-[170px]'} ref={mainRef}>
        <Topbar place={TODAY.place} tempC={TODAY.tempC} mode={mode} onInfo={() => toggle('winter')} />

        {wide ? (
          <div className="grid grid-cols-[401px_1fr] gap-10 items-center max-w-[1512px] mx-auto pt-6 px-12 pb-10 min-h-[calc(100vh-80px)]">
            <div className="flex flex-col gap-7">
              <Result scene={scene} showLink onWinter={() => toggle('winter')} />
              <Controls variant="panel" scene={scene} todayC={TODAY.tempC} {...setters} />
              {cta}
            </div>
            <div className={`flex justify-center origin-[0%_55%] transition-transform duration-350 ease-soft ${view !== 'overview' ? 'scale-75' : ''}`}>
              <RoadScene scene={scene} mode={mode} />
            </div>
          </div>
        ) : (
          <>
            <Result scene={scene} />
            <div className="w-full">
              <RoadScene scene={scene} mode={mode} />
            </div>
            <div
              className={`fixed inset-x-0 bottom-0 mx-auto max-w-[480px] flex flex-col gap-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] transition-[background,box-shadow] duration-350 ease-soft ${
                sheetOpen ? 'bg-surface border border-line rounded-t-3xl shadow-[0_-4px_24px_rgb(0_0_0/0.12)] pt-3' : ''
              }`}
            >
              <Controls
                variant="sheet"
                open={sheetOpen}
                onToggle={() => setSheetOpen((o) => !o)}
                scene={scene}
                todayC={TODAY.tempC}
                {...setters}
              />
              {cta}
            </div>
          </>
        )}
      </div>

      <Panel title="Mijn ritten" open={view === 'trips'} onClose={close} wide={wide} footer={<TripsFooter onDone={close} />}>
        <TripsPanel scene={scene} setTrips={setTrips} />
      </Panel>
      <Panel title="Waarom minder in de winter?" open={view === 'winter'} onClose={close} wide={wide} footer={<WinterFooter />}>
        <WinterPanel />
      </Panel>
    </div>
  );
}
