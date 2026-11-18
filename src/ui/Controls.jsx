import Slider from './Slider.jsx';
import { IconChevronDown, IconChevronUp } from './icons.jsx';

const TEMP_MARKS = [
  { value: 0, label: 'Vriespunt' },
  { value: 20, label: 'Optimaal' },
];

function Fields({ scene, setTripType, setSpeedKmh, setTempC, todayC }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  return (
    <>
      <div className="segmented" role="group" aria-label="Type rit">
        {['stad', 'snelweg'].map((t) => (
          <button key={t} type="button" aria-pressed={tripType === t} onClick={() => setTripType(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <Slider
        id="snelheid"
        label="SNELHEID"
        valueLabel={tripType === 'stad' ? 'STADSVERKEER' : `${speedKmh} KM/H`}
        min={70}
        max={130}
        step={1}
        value={speedKmh}
        onChange={setSpeedKmh}
        disabled={tripType === 'stad'}
        ends={['70', '130']}
      />
      <Slider
        id="temperatuur"
        label="TEMPERATUUR"
        valueLabel={`${tempC} °C${tempC === todayC ? ' · VANDAAG' : ''}`}
        min={-10}
        max={30}
        step={1}
        value={tempC}
        onChange={setTempC}
        marks={TEMP_MARKS}
      />
    </>
  );
}

/**
 * Omstandigheden.
 *  - variant "sheet" (gsm): ingeklapt als balk met de huidige instellingen, uitgeklapt als paneel.
 *  - variant "panel" (laptop): altijd open.
 */
export default function Controls({ variant, open, onToggle, scene, todayC, ...setters }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  const summary = `${tripType === 'stad' ? 'STAD' : `SNELWEG · ${speedKmh} KM/H`} · ${tempC} °C`;

  if (variant === 'panel') {
    return (
      <section className="card controls-panel" aria-labelledby="omst-titel">
        <h2 id="omst-titel" className="eyebrow mono">OMSTANDIGHEDEN</h2>
        <Fields scene={scene} todayC={todayC} {...setters} />
      </section>
    );
  }

  return (
    <section className={`sheet ${open ? 'sheet--open' : ''}`}>
      {open && <div className="sheet__grip" aria-hidden="true" />}
      <button
        type="button"
        className={`sheet__toggle ${open ? '' : 'card'}`}
        aria-expanded={open}
        aria-controls="omstandigheden"
        onClick={onToggle}
      >
        <span className="sheet__summary">
          <span className="eyebrow mono">OMSTANDIGHEDEN</span>
          <span className="mono strong">{summary}</span>
        </span>
        <span className="sheet__chevron">{open ? <IconChevronDown /> : <IconChevronUp />}</span>
      </button>
      <div id="omstandigheden" className="sheet__body" inert={open ? undefined : 'true'}>
        <div className="sheet__inner">
          <Fields scene={scene} todayC={todayC} {...setters} />
        </div>
      </div>
    </section>
  );
}
