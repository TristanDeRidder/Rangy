import { useEffect, useRef, useState } from 'react';
import { CITIES } from '../weather/cities.js';
import { getRoughLocation } from '../weather/location.js';
import { eyebrow, mono, roundBtn } from './cls.js';
import { IconClose, IconPin } from './icons.jsx';

const choice =
  'h-11 rounded-[22px] border border-ink bg-surface font-mono text-[13px] tracking-[0.12em] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:font-semibold';

/**
 * Pop-up bij de plaats in de kop: kies een stad of gebruik je (ruwe) locatie.
 * Gebouwd op <dialog> met showModal(): focus blijft in de pop-up, Escape sluit.
 */
export default function WeatherDialog({ open, onClose, weather }) {
  const ref = useRef(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const { place, setPlace } = weather;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) setGeoError(null);
  }, [open]);

  const locate = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      setPlace(await getRoughLocation());
    } catch (err) {
      setGeoError(err.message);
    } finally {
      setLocating(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // klik op de achtergrond (buiten de inhoud) sluit de pop-up
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="weer-titel"
      className="m-auto w-[calc(100%-32px)] max-w-100 max-h-[calc(100dvh-32px)] p-0 rounded-3xl border border-line bg-surface text-ink shadow-[0_8px_32px_rgb(0_0_0/0.16)] backdrop:bg-black/30"
    >
      <div className="flex flex-col gap-5 p-5">
        <header className="flex justify-between items-center">
          <h2 id="weer-titel" className="font-mono text-[13px] font-semibold tracking-[0.12em]">WEER</h2>
          <button type="button" className={roundBtn} onClick={onClose} aria-label="Sluiten">
            <IconClose />
          </button>
        </header>

        <Current weather={weather} />

        <section className="flex flex-col gap-3" aria-labelledby="plaats-titel">
          <h3 id="plaats-titel" className={eyebrow}>PLAATS</h3>
          <button
            type="button"
            className={`${choice} flex items-center justify-center gap-2`}
            aria-pressed={place.kind === 'geo'}
            onClick={locate}
            disabled={locating}
          >
            <IconPin />
            {locating ? 'LOCATIE ZOEKEN…' : 'GEBRUIK MIJN LOCATIE'}
          </button>
          {geoError && <p className="text-[13px] leading-[18px] text-charge" role="alert">{geoError}</p>}

          <p className={eyebrow}>OF KIES EEN STAD</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Stad">
            {CITIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={choice}
                aria-pressed={place.kind === 'city' && place.id === c.id}
                onClick={() => setPlace({ kind: 'city', ...c })}
              >
                {c.name.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <p className="text-[12.5px] leading-[18px] text-muted">
          Je locatie wordt afgerond tot ongeveer 1 km en enkel gebruikt om het weer op te vragen. Ze blijft op dit toestel.
        </p>
      </div>
    </dialog>
  );
}

function Current({ weather }) {
  const { place, status, data, error } = weather;
  const title = place.kind === 'geo' ? `JOUW LOCATIE · BIJ ${place.name.toUpperCase()}` : place.name.toUpperCase();

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <p className={eyebrow}>{title}</p>
      {status === 'loading' && <p className={`${mono} text-[13px] text-muted`}>WEER OPHALEN…</p>}
      {status === 'error' && <p className="text-[13px] leading-[18px] text-charge" role="alert">{error}</p>}
      {status === 'ready' && (
        <>
          <div className="flex items-center gap-3">
            {data.iconUrl && <img src={data.iconUrl} alt="" width="48" height="48" className="size-12" />}
            <span className="font-doto font-black text-[48px] leading-[44px]">{data.tempC}</span>
            <span className="flex flex-col gap-1">
              <span className={`${mono} text-[14px] font-semibold`}>°C</span>
              <span className="text-[14px] first-letter:uppercase">{data.description}</span>
            </span>
          </div>
          <dl className={`${mono} grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]`}>
            <Stat label="GEVOEL" value={`${data.feelsLikeC} °C`} />
            <Stat label="MIN / MAX" value={`${data.minC} / ${data.maxC} °C`} />
            <Stat label="WIND" value={`${data.windKmh} KM/H`} />
            <Stat label="VOCHTIGHEID" value={`${data.humidity} %`} />
          </dl>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
