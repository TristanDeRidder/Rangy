import { STATUS_COLOR, STATUS_LABEL } from './theme.js';

/**
 * Markering op de baan: status bovenaan, naam en afstand eronder.
 * Het label staat als HTML boven de SVG, dus de tekst blijft scherp.
 * `side` bepaalt aan welke kant van de paal het label hangt.
 * Maten in em: het label schaalt mee met de lettergrootte van de overlay (zie sceneOverlay in cls.js),
 * dus op een kleine baan wordt het label kleiner in plaats van de baan te bedekken.
 * @param {{ marker: { name: string, distanceKm: number, status: string }, side: 'left' | 'right', x: string, y: string }} props
 */
export default function Tag({ marker, side, x, y }) {
  return (
    <div
      className={`absolute w-[11.667em] -translate-y-full shadow-[0_2px_8px_rgb(0_0_0/0.08)] ${side === 'left' ? '-translate-x-full' : ''}`}
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      <div className="px-[0.5em] py-[0.17em] font-mono text-[1em] font-semibold tracking-[0.06em]" style={{ background: STATUS_COLOR[marker.status] }}>
        {STATUS_LABEL[marker.status].toUpperCase()}
      </div>
      <div className="flex flex-col gap-px pt-[0.33em] px-[0.5em] pb-[0.42em] bg-white/96 border border-line border-t-0">
        <span className="font-mono text-[1em] font-semibold">{marker.name.toUpperCase()}</span>
        <span className="font-mono text-[1em] text-[#4a4a4a]">{Math.round(marker.distanceKm)} KM</span>
      </div>
    </div>
  );
}

/** Kant en paallengte per markering: afwisselend links/rechts, zodat labels elkaar zelden raken. */
export function tagLayout(index) {
  return { side: index % 2 === 0 ? 'left' : 'right', pole: index % 2 === 0 ? 1 : 1.35 };
}
