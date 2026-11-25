import { useEffect, useRef, useState } from 'react';
import { PRESETS } from '../scenario/trips.js';
import PlaceSearch from './PlaceSearch.jsx';
import { IconCheck, IconRadio } from './icons.jsx';
import { btnPrimary } from './cls.js';

/** Nieuwe sleutel voor v2: wie het welkom van v1 al zag, krijgt de drie stappen toch (thuisgemeente en laden zijn nieuw). */
const SEEN_KEY = 'rangy.v2.welcome';

/** Eerste bezoek? Zonder opslag (privévenster) tonen we het welkom gewoon elke keer. */
export function welcomeSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* niet bewaard: het welkom komt bij een volgend bezoek terug */
  }
}

const CHARGING = [
  { id: 'ja', label: 'JA', text: 'Dan begin je elke dag met een volle batterij' },
  { id: 'nee', label: 'NEE', text: 'Dan laad je onderweg of aan een publieke laadpaal' },
  { id: 'onbekend', label: 'WEET IK NOG NIET', text: 'Rangy rekent alsof je niet thuis laadt, en toont wat een thuislader verandert' },
];

const CHIP_LABEL = { kinderen: 'KINDEREN BRENGEN/HALEN' };
const OTHER = 'andere';

const eyebrow = 'font-mono text-[11px] text-muted tracking-[0.12em]';
const title = 'text-[22px] leading-[1.4] font-medium';
const note = 'text-[13px] leading-[1.35] text-muted';
const btnBack = 'w-[110px] h-12 shrink-0 rounded-3xl border border-ink bg-surface font-mono text-[12px] font-semibold tracking-[0.1em]';

/**
 * Welkom in drie stappen bij het eerste bezoek:
 *  1. een eerlijke schatting (referentiewagen, disclaimer)
 *  2. jouw situatie: thuisgemeente en laden
 *  3. je vaste ritten, als chips met voorbeeldafstanden
 * Sluiten (Escape, naast het paneel tikken) mag altijd: dan blijven de standaardwaarden.
 *  - gsm: paneel dat onderaan binnenschuift; laptop: kaart in het midden
 * Gebouwd op <dialog> met showModal(): focus blijft erin.
 * @param {{ open: boolean, onClose: () => void, onMore: () => void, situation: object, trips: object[], actions: object,
 *   onDone: (openTrips: boolean) => void }} props
 */
export default function WelcomeDialog({ open, onClose, onMore, situation, trips, actions, onDone }) {
  const ref = useRef(null);
  const headRef = useRef(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // nieuwe stap: focus naar de titel, zodat een schermlezer hem voorleest
  useEffect(() => {
    if (open) headRef.current?.focus();
  }, [step, open]);

  const close = () => {
    markSeen();
    onClose();
  };

  const finish = () => {
    const names = new Set(trips.map((t) => t.name.toLowerCase()));
    for (const key of picked) {
      if (key !== OTHER && !names.has(PRESETS[key].name.toLowerCase())) actions.addTrip(key);
    }
    markSeen();
    onDone(picked.includes(OTHER));
  };

  const toggle = (key) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      aria-labelledby="welkom-titel"
      className="mx-auto mt-auto mb-0 w-full max-w-120 max-h-[calc(100dvh-24px)] p-0 rounded-t-3xl border border-line bg-surface text-ink shadow-[0_-4px_24px_rgb(0_0_0/0.12)] backdrop:bg-black/45 open:animate-sheet-up wide:m-auto wide:rounded-3xl wide:shadow-[0_8px_32px_rgb(0_0_0/0.16)] wide:open:animate-fade-in"
    >
      <div className="flex flex-col gap-3.5 pt-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] wide:p-7">
        <div className="w-10 h-1 rounded-full bg-line self-center wide:hidden" aria-hidden="true" />
        <div className="flex items-center gap-1.5" aria-label={`Stap ${step + 1} van 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`w-6 h-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} aria-hidden="true" />
          ))}
          <span className="ml-3 font-mono text-[10.5px] text-muted tracking-[0.08em]" aria-hidden="true">
            {step + 1} / 3
          </span>
        </div>

        {step === 0 && (
          <>
            <p className={eyebrow}>WELKOM BIJ RANGY</p>
            <h2 id="welkom-titel" ref={headRef} tabIndex={-1} className={`${title} outline-none`}>
              Een eerlijke schatting, geen belofte
            </h2>
            <p className="text-[15px] leading-[1.4]">
              Rangy rekent met één referentiewagen: een Tesla Model Y Standard RWD met 60 kWh bruikbare batterij. Jouw wagen, je rijstijl en het weer
              kunnen het echte bereik doen afwijken. Daarom toont Rangy een marge in plaats van één getal.
            </p>
            <button
              type="button"
              className="self-start min-h-11 font-mono text-[12px] font-semibold tracking-[0.08em] underline underline-offset-3"
              onClick={() => {
                markSeen();
                onMore();
              }}
            >
              HOE REKENT RANGY? →
            </button>
            <button type="button" className={`${btnPrimary} justify-center`} onClick={() => setStep(1)}>
              VOLGENDE
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <p className={eyebrow}>JOUW SITUATIE</p>
            <h2 id="welkom-titel" ref={headRef} tabIndex={-1} className={`${title} outline-none`}>
              Waar vertrek je meestal?
            </h2>
            <div className="flex flex-col gap-1.5 [&_label]:sr-only">
              <PlaceSearch label="Thuisgemeente" value={situation.home} onSelect={(nis) => actions.setHome(nis)} placeholder="Je gemeente" />
              <p className={note}>Alleen de gemeente. Rangy rekent je ritten van hier naar hun bestemming.</p>
            </div>
            <p id="laden-vraag" className="text-[17px] leading-[1.4] font-medium">
              Kan je thuis of op het werk laden?
            </p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="laden-vraag">
              {CHARGING.map((c) => {
                const on = situation.charging === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-surface text-left ${on ? 'border-[1.5px] border-ink' : 'border border-line'}`}
                    onClick={() => actions.setSituation({ charging: c.id })}
                  >
                    <IconRadio on={on} />
                    <span className="flex-1 flex flex-col gap-0.5">
                      <span className="font-mono text-[12.5px] font-semibold tracking-[0.08em]">{c.label}</span>
                      <span className="text-[13.5px] text-muted">{c.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className={note}>Je kan dit later aanpassen bij Mijn ritten.</p>
            <div className="flex gap-2.5">
              <button type="button" className={btnBack} onClick={() => setStep(0)}>
                TERUG
              </button>
              <button type="button" className={`${btnPrimary} justify-center flex-1`} onClick={() => setStep(2)}>
                VOLGENDE
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className={eyebrow}>JOUW VASTE RITTEN</p>
            <h2 id="welkom-titel" ref={headRef} tabIndex={-1} className={`${title} outline-none`}>
              Welke ritten maak je elke week?
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Vaste ritten">
              {[...Object.keys(PRESETS), OTHER].map((key) => {
                const on = picked.includes(key);
                const text = key === OTHER ? '+ ANDERE' : (CHIP_LABEL[key] ?? PRESETS[key].name.toUpperCase());
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-ink font-mono text-[11.5px] tracking-[0.05em] ${
                      on ? 'bg-ink text-white font-semibold' : 'bg-surface'
                    }`}
                    onClick={() => toggle(key)}
                  >
                    {on && <IconCheck />}
                    {text}
                  </button>
                );
              })}
            </div>
            <p className="text-[13.5px] leading-[1.4] text-muted">
              Tot je ze invult, rekent Rangy met voorbeeldafstanden. Bij Mijn ritten geef je per rit de bestemming en de dagen.
            </p>
            <div className="flex gap-2.5">
              <button type="button" className={btnBack} onClick={() => setStep(1)}>
                TERUG
              </button>
              <button type="button" className={`${btnPrimary} justify-center flex-1`} onClick={finish}>
                KLAAR
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
