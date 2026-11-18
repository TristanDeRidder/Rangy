import { IconCloud, IconInfo } from './icons.jsx';

/** Kop: merknaam, weer (voorlopig vaste waarde, later via weer-API) en info-knop. */
export default function Topbar({ place, tempC, onInfo, mode }) {
  return (
    <header className="topbar">
      <span className="brand mono" title={`Weergave: ${mode}. Wissel met ?view=svg of ?view=3d`}>RANGY</span>
      <div className="topbar__actions">
        <span className="pill mono">
          <IconCloud />
          {place.toUpperCase()} · {tempC} °C
        </span>
        <button type="button" className="round-btn" onClick={onInfo} aria-label="Waarom minder in de winter?">
          <IconInfo />
        </button>
      </div>
    </header>
  );
}
