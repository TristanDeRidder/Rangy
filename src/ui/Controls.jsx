import Slider from './Slider.jsx';
import Stepper from './Stepper.jsx';
import { IconChevronDown, IconChevronUp } from './icons.jsx';
import { card, eyebrow, mono } from './cls.js';
import { TERRAIN, KG_PER_PASSENGER, KG_PER_BAG, MAX_PASSENGERS, MAX_BAGS } from '../scenario/buildScene.js';

const TEMP_MARKS = [
  { value: 0, label: 'Vriespunt' },
  { value: 20, label: 'Optimaal' },
];

const choice =
  'h-11 rounded-[22px] border border-ink bg-surface font-mono text-[13px] tracking-[0.12em] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:font-semibold';
const fieldLabel = 'font-mono text-[12px] tracking-[0.08em]';
const fieldValue = 'font-mono text-[13px] font-semibold tracking-[0.08em]';

/** Korte samenvatting voor de ingeklapte balk (gsm). Terrein en lading alleen als ze iets veranderen. */
export function summaryOf(scene) {
  const { tripType, speedKmh, tempC, terrain = 'vlak' } = scene.inputs;
  const parts = [tripType === 'stad' ? 'STAD' : `SNELWEG · ${speedKmh} KM/H`, `${tempC} °C`];
  if (terrain !== 'vlak') parts.push(TERRAIN[terrain].label.toUpperCase());
  if (scene.extraKg > 0) parts.push(`+${scene.extraKg} KG`);
  return parts.join(' · ');
}

function Fields({ scene, setTripType, setSpeedKmh, setTempC, setTerrain, setPassengers, setBags, todayC }) {
  const { tripType, speedKmh, tempC, terrain = 'vlak', passengers = 0, bags = 0 } = scene.inputs;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p id="bereik-label" className={fieldLabel}>BEREIK TONEN VOOR</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="bereik-label">
          {['stad', 'snelweg'].map((t) => (
            <button key={t} type="button" className={choice} aria-pressed={tripType === t} onClick={() => setTripType(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <p id="terrein-label" className={fieldLabel}>TERREIN</p>
          <span className={fieldValue}>{TERRAIN[terrain].label.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="terrein-label">
          {Object.entries(TERRAIN).map(([key, t]) => (
            <button
              key={key}
              type="button"
              className={`${choice} min-w-0 px-1 text-[12px] tracking-[0.02em]`}
              aria-pressed={terrain === key}
              onClick={() => setTerrain(key)}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
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

      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <p className={fieldLabel}>LADING</p>
          <span className={fieldValue}>{scene.extraKg > 0 ? `+ ${scene.extraKg} KG` : 'GEEN'}</span>
        </div>
        <Stepper id="passagiers" label="PASSAGIERS" hint={`+${KG_PER_PASSENGER} KG PER PERSOON`} value={passengers} max={MAX_PASSENGERS} onChange={setPassengers} />
        <Stepper id="bagage" label="BAGAGE" hint={`+${KG_PER_BAG} KG PER STUK`} value={bags} max={MAX_BAGS} onChange={setBags} />
      </div>
    </div>
  );
}

/**
 * Omstandigheden.
 *  - variant "sheet" (gsm): ingeklapt als balk met de huidige instellingen, uitgeklapt als paneel.
 *  - variant "panel" (laptop): altijd open.
 */
export default function Controls({ variant, open, onToggle, scene, todayC, ...setters }) {
  const summary = summaryOf(scene);

  if (variant === 'panel') {
    return (
      <section className={`${card} flex flex-col gap-4.5 pt-5 px-6 pb-5`} aria-labelledby="omst-titel">
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
        <span className="flex flex-col gap-1 text-[12px] min-w-0">
          <span className={eyebrow}>OMSTANDIGHEDEN</span>
          <span className={`${mono} font-semibold`}>{summary}</span>
        </span>
        <span className="size-9 shrink-0 rounded-full bg-[#efefef] grid place-items-center">{open ? <IconChevronDown /> : <IconChevronUp />}</span>
      </button>
      <div id="omstandigheden" className={`grid transition-[grid-template-rows,opacity] duration-350 ease-soft ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} inert={open ? undefined : 'true'}>
        <div className="min-h-0 overflow-hidden">
          {/* meer velden dan op een kleine gsm passen: dit deel scrolt, de knop eronder blijft staan.
              Hoogte zo gekozen dat het grote getal erboven zichtbaar blijft. px-1/-mx-1: ruimte voor de focusrand. */}
          <div className="max-h-[calc(100dvh-340px)] overflow-x-hidden overflow-y-auto overscroll-contain pt-3.5 pb-1 px-1 -mx-1">
            <Fields scene={scene} todayC={todayC} {...setters} />
          </div>
        </div>
      </div>
    </section>
  );
}
