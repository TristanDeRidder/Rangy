import { STATUS_COLOR, STATUS_LABEL } from './theme.js';

/**
 * Markering bij een rit (gedeeld door 3D en SVG).
 * Het label staat als HTML boven de scène, dus de tekst is in beide versies identiek en scherp.
 * `side` bepaalt aan welke kant van de paal het label hangt.
 * @param {{ trip: import('../../scenario/types.js').SceneTrip, side: 'left' | 'right', x: string, y: string }} props
 */
export default function Tag({ trip, side, x, y }) {
  return (
    <div className={`absolute w-[140px] -translate-y-full shadow-[0_2px_8px_rgb(0_0_0/0.08)] ${side === 'left' ? '-translate-x-full' : ''}`} style={{ left: x, top: y }} aria-hidden="true">
      <div className="px-1.5 py-0.5 font-mono text-[12px] font-semibold tracking-[0.06em]" style={{ background: STATUS_COLOR[trip.status] }}>
        {STATUS_LABEL[trip.status].toUpperCase()}
      </div>
      <div className="flex flex-col gap-px pt-1 px-1.5 pb-[5px] bg-white/96 border border-line border-t-0">
        <span className="font-mono text-[12px] font-semibold">{trip.name.toUpperCase()}</span>
        <span className="font-mono text-[12px] text-[#4a4a4a]">{trip.km} KM</span>
      </div>
    </div>
  );
}

/** Kant en paallengte per rit: afwisselend links/rechts, zodat labels elkaar zelden raken. */
export function tagLayout(index) {
  return { side: index % 2 === 0 ? 'left' : 'right', pole: index % 2 === 0 ? 1 : 1.35 };
}
