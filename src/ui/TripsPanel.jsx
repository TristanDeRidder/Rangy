import { Fragment } from 'react';
import { STATUS_COLOR, STATUS_LABEL } from '../scene/shared/theme.js';
import { IconLock } from './icons.jsx';
import { btnPrimary, eyebrow } from './cls.js';

const round10 = (km) => Math.round(km / 10) * 10;

/**
 * Mijn ritten: tijdlijn met de eigen ritten van kort naar lang,
 * met de grenzen van het zekere en het mogelijke bereik ertussen.
 * Bewerken met een paar invulvelden, zonder account.
 */
export default function TripsPanel({ scene, setTrips }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  const all = scene.inputs.trips;
  const update = (id, patch) => setTrips(all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => setTrips(all.filter((t) => t.id !== id));
  // geen crypto.randomUUID: dat werkt niet via http op je gsm (geen beveiligde context)
  const add = () => setTrips([...all, { id: Date.now().toString(36), name: 'Nieuwe rit', km: 100 }]);

  const low = round10(scene.rangeKm.low);
  const high = round10(scene.rangeKm.high);
  let shownLow = false;
  let shownHigh = false;
  const cut = (text) => (
    <li className="flex items-center gap-2.5 font-mono text-[12px] font-semibold tracking-[0.08em]" aria-hidden="true">
      <span className="size-3.5 ml-0.5 bg-reach shrink-0 relative z-1" />
      <span className="flex-1 border-t-[1.5px] border-dashed border-reach" />
      {text}</li>
  );

  return (
    <>
      <p className="text-[15px] leading-[22px]">Vul de afstanden in die je geregeld rijdt. Ze verschijnen als markeringen langs de baan.</p>
      <p className={eyebrow}>
        BIJ {tripType === 'stad' ? 'STADSRIT' : `SNELWEG · ${speedKmh} KM/H`} · {tempC} °C
      </p>

      <ol className="relative flex flex-col gap-3 mt-1 before:absolute before:left-[8.5px] before:top-[22px] before:bottom-[22px] before:border-l before:border-dashed before:border-ink">
        {scene.trips.map((t) => {
          const before = [];
          if (!shownLow && t.km > scene.rangeKm.low) { shownLow = true; before.push(cut(`ZEKER BEREIK · ${low} KM`)); }
          if (!shownHigh && t.km > scene.rangeKm.high) { shownHigh = true; before.push(cut(`MOGELIJK BEREIK · ${high} KM`)); }
          return (
            <Fragment key={t.id}>
              {before.map((b, i) => <Fragment key={i}>{b}</Fragment>)}
              <li className="relative grid grid-cols-[18px_1fr] gap-x-3.5 gap-y-1.5 items-center">
                <span className="size-[18px] rounded-full border-[1.5px] border-ink relative z-1 bg-[radial-gradient(circle,var(--color-ink)_0_4px,#fff_4.5px)]" aria-hidden="true" />
                <div className="flex gap-2 items-center min-w-0">
                  <label className="sr-only" htmlFor={`naam-${t.id}`}>Naam van de rit</label>
                  <input
                    id={`naam-${t.id}`}
                    className="flex-1 min-w-0 h-11 p-0 border-b border-dashed border-ink bg-transparent font-mono text-[14px] font-semibold tracking-[0.06em] uppercase"
                    value={t.name}
                    onChange={(e) => update(t.id, { name: e.target.value })}
                  />
                  <label className="w-24 h-11 shrink-0 px-3 gap-1 flex items-center border border-ink rounded-xl bg-surface font-mono text-[11px] tracking-[0.08em] text-muted">
                    <span className="sr-only">Afstand van {t.name} in km</span>
                    <input
                      type="number"
                      className="w-full min-w-0 p-0 bg-transparent font-mono text-[15px] font-semibold tracking-normal text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      inputMode="numeric"
                      min="1"
                      value={t.km}
                      onChange={(e) => update(t.id, { km: Math.max(1, Number(e.target.value) || 1) })}
                    />
                    <span aria-hidden="true">KM</span>
                  </label>
                  <button type="button" className="w-8 h-11 shrink-0 text-[20px] text-muted" onClick={() => remove(t.id)} aria-label={`${t.name} verwijderen`}>×</button>
                </div>
                <span className="col-start-2 justify-self-start px-[7px] py-[3px] font-mono text-[12px] font-semibold tracking-[0.06em]" style={{ background: STATUS_COLOR[t.status] }}>
                  {STATUS_LABEL[t.status].toUpperCase()}
                </span>
              </li>
            </Fragment>
          );
        })}
        {!shownLow && cut(`ZEKER BEREIK · ${low} KM`)}
        {!shownHigh && cut(`MOGELIJK BEREIK · ${high} KM`)}
        <li className="flex items-center gap-3.5">
          <span className="size-[18px] rounded-full border-[1.5px] border-ink relative z-1 border-dashed bg-white" aria-hidden="true" />
          <button type="button" className="min-h-11 p-0 font-mono text-[12px] font-semibold tracking-[0.08em]" onClick={add}>+ RIT TOEVOEGEN</button>
        </li>
      </ol>
    </>
  );
}

export function TripsFooter({ onDone }) {
  return (
    <>
      <p className="flex items-center gap-2.5 font-mono text-[12px] tracking-[0.08em]"><IconLock /> GEEN ACCOUNT · BLIJFT OP DIT TOESTEL</p>
      <button type="button" className={`${btnPrimary} justify-center`} onClick={onDone}>TOON OP DE BAAN</button>
    </>
  );
}
