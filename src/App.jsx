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
    <button type="button" className="btn-primary btn-primary--split mono" onClick={() => toggle('trips')} aria-expanded={view === 'trips'}>
      <span>MIJN RITTEN · {scene.trips.length}</span>
      <IconArrow />
    </button>
  );

  return (
    <div className={`app ${wide ? 'app--wide' : 'app--narrow'} ${view !== 'overview' ? 'app--panel' : ''}`}>
      <div className="app__main" ref={mainRef}>
        <Topbar place={TODAY.place} tempC={TODAY.tempC} mode={mode} onInfo={() => toggle('winter')} />

        {wide ? (
          <div className="wide">
            <div className="wide__left">
              <Result scene={scene} showLink onWinter={() => toggle('winter')} />
              <Controls variant="panel" scene={scene} todayC={TODAY.tempC} {...setters} />
              {cta}
            </div>
            <div className="wide__stage">
              <RoadScene scene={scene} mode={mode} />
            </div>
          </div>
        ) : (
          <>
            <Result scene={scene} />
            <div className="stage">
              <RoadScene scene={scene} mode={mode} />
            </div>
            <div className={`dock ${sheetOpen ? 'dock--open' : ''}`}>
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
