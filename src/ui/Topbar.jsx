import { IconCloud, IconInfo } from './icons.jsx';
import { roundBtn } from './cls.js';

/** Kop: merknaam, weer (voorlopig vaste waarde, later via weer-API) en info-knop. */
export default function Topbar({ place, tempC, onInfo, mode }) {
  return (
    <header className="flex justify-between items-center pt-5 px-5 wide:pt-7 wide:px-12">
      <span className="font-mono text-[14px] font-bold tracking-[0.22em]" title={`Weergave: ${mode}. Wissel met ?view=svg of ?view=3d`}>RANGY</span>
      <div className="flex gap-2 items-center">
        <span className="h-11 px-3.5 rounded-[22px] border border-line bg-surface inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.08em]">
          <IconCloud />
          {place.toUpperCase()} · {tempC} °C
        </span>
        <button type="button" className={roundBtn} onClick={onInfo} aria-label="Waarom minder in de winter?">
          <IconInfo />
        </button>
      </div>
    </header>
  );
}
