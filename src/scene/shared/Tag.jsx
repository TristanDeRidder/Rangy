import { STATUS_COLOR, STATUS_LABEL } from './theme.js';

/**
 * Markering bij een rit (gedeeld door 3D en SVG).
 * Het label staat als HTML boven de scène, dus de tekst is in beide versies identiek en scherp.
 * `side` bepaalt aan welke kant van de paal het label hangt.
 * @param {{ trip: import('../../scenario/types.js').SceneTrip, side: 'left' | 'right', x: string, y: string }} props
 */
export default function Tag({ trip, side, x, y }) {
  return (
    <div className={`tag tag--${side}`} style={{ left: x, top: y }} aria-hidden="true">
      <div className="tag__head" style={{ background: STATUS_COLOR[trip.status] }}>
        {STATUS_LABEL[trip.status].toUpperCase()}
      </div>
      <div className="tag__body">
        <span className="tag__name">{trip.name.toUpperCase()}</span>
        <span className="tag__km">{trip.km} KM</span>
      </div>
    </div>
  );
}

/** Kant en paallengte per rit: afwisselend links/rechts, zodat labels elkaar zelden raken. */
export function tagLayout(index) {
  return { side: index % 2 === 0 ? 'left' : 'right', pole: index % 2 === 0 ? 1 : 1.35 };
}
