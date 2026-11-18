import Slider from './Slider.jsx';
import { IconChevronDown, IconChevronUp } from './icons.jsx';
import { card, eyebrow, mono } from './cls.js';

const TEMP_MARKS = [
  { value: 0, label: 'Vriespunt' },
  { value: 20, label: 'Optimaal' },
];

function Fields({ scene, setTripType, setSpeedKmh, setTempC, todayC }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  return (
    <>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Type rit">
        {['stad', 'snelweg'].map((t) => (
          <button
            key={t}
            type="button"
            className="h-11 rounded-[22px] border border-ink bg-surface font-mono text-[13px] tracking-[0.12em] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:font-semibold"
            aria-pressed={tripType === t} onClick={() => setTripType(t)}>
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
      <section className={`${card} flex flex-col gap-[18px] pt-5 px-6 pb-6`} aria-labelledby="omst-titel">
        <h2 id="omst-titel" className={eyebrow}>OMSTANDIGHEDEN</h2>
        <Fields scene={scene} todayC={todayC} {...setters} />
      </section>
    );
  }

  return (
    <section className="flex flex-col">
      {open && <div className="w-9 h-1 mb-3.5 rounded-full bg-line self-center" aria-hidden="true" />}
      <button
        type="button"
        className={`flex justify-between items-center gap-3 w-full bg-surface text-left ${open ? '' : `${card} py-3 pr-3 pl-4`}`}
        aria-expanded={open}
        aria-controls="omstandigheden"
        onClick={onToggle}
      >
        <span className="flex flex-col gap-1 text-[12px]">
          <span className={eyebrow}>OMSTANDIGHEDEN</span>
          <span className={`${mono} font-semibold`}>{summary}</span>
        </span>
        <span className="size-9 rounded-full bg-[#efefef] grid place-items-center">{open ? <IconChevronDown /> : <IconChevronUp />}</span>
      </button>
      <div id="omstandigheden" className={`grid transition-[grid-template-rows,opacity] duration-350 ease-soft ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} inert={open ? undefined : 'true'}>
        <div className="min-h-0 overflow-hidden flex flex-col gap-4 pt-3.5">
          <Fields scene={scene} todayC={todayC} {...setters} />
        </div>
      </div>
    </section>
  );
}
