import { IconCloud, IconInfo, IconPin } from './icons.jsx';
import { roundBtn } from './cls.js';

/** Kop: merknaam, weer van de gekozen plaats (klik om te wijzigen) en info-knop. */
export default function Topbar({ weather, onPlace, onInfo }) {
  const { place, status, data } = weather;
  const temp = status === 'ready' ? `${data.tempC} °C` : status === 'loading' ? '…' : '– °C';
  return (
    <header className="flex justify-between items-center pt-5 px-5 short:pt-2.5 wide:pt-7 wide:px-12 low:pt-4">
      <span className="font-mono text-[14px] font-bold tracking-[0.22em]">RANGY</span>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={onPlace}
          aria-haspopup="dialog"
          aria-label={`Weer in ${place.name}: ${temp}. Plaats wijzigen`}
          className="h-11 px-3.5 rounded-[22px] border border-line bg-surface inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.08em]"
        >
          {place.kind === 'geo' ? <IconPin /> : <IconCloud />}
          {place.name.toUpperCase()} · {temp}
        </button>
        <button type="button" className={roundBtn} onClick={onInfo} aria-label="Uitleg">
          <IconInfo />
        </button>
      </div>
    </header>
  );
}
