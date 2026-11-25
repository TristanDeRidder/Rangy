import Slider from './Slider.jsx';
import { HintButton } from './HintDialog.jsx';
import { IconChevronDown, IconChevronUp, IconWind } from './icons.jsx';
import { card, eyebrow, mono } from './cls.js';
import { SPEED_TOLERANCE_KMH } from '../scenario/roads.js';

const TEMP_MARKS = [
  { value: 0, label: 'Winter' },
  { value: 20, label: 'Zomer' },
];

const fieldLabel = 'font-mono text-[12px] tracking-[0.08em]';
const fieldValue = 'font-mono text-[13px] font-semibold tracking-[0.08em]';
const note = 'font-mono text-[10.5px] text-muted tracking-[0.06em]';

const COMPASS = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
/** Windrichting in woorden: waar de wind vandaan komt (zoals in het weerbericht). */
const compass = (deg) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
const windKmh = (wind) => Math.round(wind.speedMs * 3.6);

/** Wind als tekst: "18 KM/U · ZW", "WINDSTIL", of null als het weer (nog) niet geladen is. */
function windText(wind, weatherReady) {
  if (!weatherReady) return null;
  if (!wind) return 'WINDSTIL';
  return `${windKmh(wind)} KM/U · ${compass(wind.fromDeg)}`;
}

/** Korte samenvatting voor de ingeklapte balk (gsm), bv. "8 °C · 110 KM/H · WIND 18 KM/U". */
export function summaryOf(inputs, weatherReady) {
  const parts = [`${inputs.tempC} °C`, `${inputs.speedKmh} KM/H`];
  if (weatherReady) parts.push(inputs.wind ? `WIND ${windKmh(inputs.wind)} KM/U` : 'WINDSTIL');
  return parts.join(' · ');
}

/**
 * De velden: snelheid op de snelweg, temperatuur, en de wind van vandaag (niet aanpasbaar).
 * @param {{ inputs: { speedKmh: number, tempC: number, wind: object|null }, weatherReady: boolean,
 *   setSpeedKmh: Function, setTempC: Function, todayC?: number, onHint?: Function }} props
 */
function Fields({ inputs, weatherReady, setSpeedKmh, setTempC, todayC, onHint }) {
  const hint = (topic) => onHint && <HintButton topic={topic} onHint={onHint} />;
  const { speedKmh, tempC, wind } = inputs;
  const windValue = windText(wind, weatherReady);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Slider
          id="snelheid"
          label="SNELHEID OP DE SNELWEG"
          hint={hint('snelheid')}
          valueLabel={`${speedKmh} KM/H`}
          min={70}
          max={130}
          step={1}
          value={speedKmh}
          onChange={setSpeedKmh}
          ends={['70', '130']}
        />
        <p className={note}>ANDERE WEGEN: DE LIMIET, ± {SPEED_TOLERANCE_KMH} KM/U</p>
      </div>

      <Slider
        id="temperatuur"
        label="TEMPERATUUR"
        hint={hint('temperatuur')}
        valueLabel={`${tempC} °C${tempC === todayC ? ' · VANDAAG' : ''}`}
        min={-10}
        max={30}
        step={1}
        value={tempC}
        onChange={setTempC}
        marks={TEMP_MARKS}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <p className={fieldLabel}>WIND · VANDAAG</p>
            {hint('wind')}
          </div>
          <span className={`${fieldValue} flex items-center gap-1.5`}>
            {wind && weatherReady && <IconWind toDeg={(wind.fromDeg + 180) % 360} />}
            {windValue ?? '—'}
            {wind && weatherReady && <span className="sr-only">, wind uit het {compass(wind.fromDeg)}</span>}
          </span>
        </div>
        <p className={note}>{weatherReady ? 'AUTOMATISCH UIT HET WEER · PER STUK ROUTE' : 'GEEN WEERGEGEVENS: RANGY REKENT ZONDER WIND'}</p>
      </div>
    </div>
  );
}

/**
 * Omstandigheden.
 *  - variant "sheet" (gsm): ingeklapt als balk met de huidige instellingen, uitgeklapt als paneel.
 *  - variant "panel" (laptop): altijd open.
 * @param {{ variant: 'sheet'|'panel', open?: boolean, onToggle?: Function, inputs: object, weatherReady: boolean }} props
 */
export default function Controls({ variant, open, onToggle, inputs, weatherReady, ...rest }) {
  const summary = summaryOf(inputs, weatherReady);
  const fields = <Fields inputs={inputs} weatherReady={weatherReady} {...rest} />;

  if (variant === 'panel') {
    return (
      <section className={`${card} flex flex-col gap-4.5 pt-5 px-6 pb-5`} aria-labelledby="omst-titel">
        <h2 id="omst-titel" className={eyebrow}>OMSTANDIGHEDEN</h2>
        {fields}
      </section>
    );
  }

  return (
    <section className="flex flex-col">
      {open && <div className="w-10 h-1 mb-3.5 rounded-full bg-line self-center" aria-hidden="true" />}
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
          {/* past dit niet op een kleine gsm, dan scrolt dit deel en blijft de knop eronder staan.
              px-1/-mx-1: ruimte voor de focusrand. */}
          <div className="max-h-[calc(100dvh-340px)] overflow-x-hidden overflow-y-auto overscroll-contain pt-4 pb-1 px-1 -mx-1">{fields}</div>
        </div>
      </div>
    </section>
  );
}
