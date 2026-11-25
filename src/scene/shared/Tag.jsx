import { STATUS_COLOR, STATUS_LABEL } from './theme.js';

/**
 * Markering bij een rit op de baan.
 * Het label staat als HTML boven de scène, dus de tekst is in beide versies identiek en scherp.
 * `side` bepaalt aan welke kant van de paal het label hangt.
 * Maten in em: het label schaalt mee met de lettergrootte van de overlay (zie sceneOverlay in cls.js),
 * dus op een kleine baan wordt het label kleiner in plaats van de baan te bedekken.
 * Een rit van een ander type dan wat de baan toont (`trip.dim`) staat gedimd, met zijn type erbij.
 * @param {{ trip: import('../../scenario/types.js').SceneTrip, side: 'left' | 'right', x: string, y: string }} props
 */
export default function Tag({ trip, side, x, y }) {
  return (
    <div
      className={`absolute w-[11.667em] -translate-y-full shadow-[0_2px_8px_rgb(0_0_0/0.08)] ${side === 'left' ? '-translate-x-full' : ''} ${trip.dim ? 'opacity-60' : ''}`}
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      <div className="px-[0.5em] py-[0.17em] font-mono text-[1em] font-semibold tracking-[0.06em]" style={{ background: STATUS_COLOR[trip.status] }}>
        {STATUS_LABEL[trip.status].toUpperCase()}
      </div>
      <div className="flex flex-col gap-px pt-[0.33em] px-[0.5em] pb-[0.42em] bg-white/96 border border-line border-t-0">
        <span className="font-mono text-[1em] font-semibold">{trip.name.toUpperCase()}</span>
        <span className="font-mono text-[1em] text-[#4a4a4a]">{trip.km} KM{trip.dim ? ` · ${trip.type.toUpperCase()}` : ''}</span>
      </div>
    </div>
  );
}

/** Kant en paallengte per rit: afwisselend links/rechts, zodat labels elkaar zelden raken. */
export function tagLayout(index) {
  return { side: index % 2 === 0 ? 'left' : 'right', pole: index % 2 === 0 ? 1 : 1.35 };
}
