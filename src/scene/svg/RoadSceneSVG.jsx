import { useLayoutEffect, useRef, useState } from 'react';
import { perspectiveY } from '../shared/projection.js';
import { COLORS, STATUS_COLOR, STATUS_LABEL } from '../shared/theme.js';
import Tag, { tagLayout } from '../shared/Tag.jsx';
import { rangeLabel, sceneBox, sceneOverlay } from '../../ui/cls.js';

// Afmetingen van de tekening (zelfde verhoudingen als in Figma)
const W = 393;
const H = 350;
const HOR = 30; // horizon
const BOT = 340; // onderrand van de baan
const CX = W / 2;
const HW_BOTTOM = 110; // halve breedte van de baan vooraan
const HW_TOP = 5; // halve breedte aan de horizon
const POLE = 34; // basislengte van een paal
const TAG_H = 52; // hoogte van een label in tekeningeenheden (bij de ontwerpbreedte)

const yOf = (t) => HOR + (BOT - HOR) * perspectiveY(t);
const hwOf = (y) => HW_TOP + ((HW_BOTTOM - HW_TOP) * (y - HOR)) / (BOT - HOR);
const xAt = (f, y) => CX + f * hwOf(y);
const quad = (y1, y2) =>
  `${xAt(-1, y1)},${y1} ${xAt(1, y1)},${y1} ${xAt(1, y2)},${y2} ${xAt(-1, y2)},${y2}`;
const pct = (v, total) => `${(v / total) * 100}%`;

/**
 * SVG-weergave van de baan: zeker bereik (groen, met raster), reserve van 10 % (gearceerd),
 * marge (geel) en markeringen voor de drukste dag en de ritten die af en toe terugkomen.
 * De labels staan als HTML erboven (Tag).
 * @param {{ plan: import('../../scenario/types.js').Plan }} props
 */
export default function RoadSceneSVG({ plan }) {
  const { rangeKm, rangeT, markers } = plan;
  const [boxRef, k] = useLabelScale();
  const ySafe = yOf(rangeT.safe ?? rangeT.low);
  const yLow = yOf(rangeT.low);
  const yHigh = yOf(rangeT.high);
  const yReserve = (ySafe + yLow) / 2;

  const cross = [];
  for (let t = 0; t <= (rangeT.safe ?? rangeT.low); t += 0.05) cross.push(yOf(t));
  const along = [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1];

  // Een label links mag niet over de bereiklabels (links van de baan) vallen.
  // k: hoe groot de labels zijn tegenover de tekening (1 = zoals in Figma). Groter op gsm (baan kleiner, labels niet)
  // en op een kleine baan (minimum lettergrootte).
  const tagH = TAG_H * k;
  const yHighLabel = Math.min(yHigh, yLow - 14 * k); // bovenste bereiklabel, opgeschoven als het te dicht bij het onderste staat
  const labelZone = [yHighLabel - 10 * k, yLow + 12 * k];
  const marks = markers.map((marker, i) => {
    const layout = tagLayout(i);
    const y = yOf(marker.t);
    const s = Math.max(5, (12 * hwOf(y)) / HW_BOTTOM);
    let top = Math.max(14, y - POLE * layout.pole - s / 2);
    let side = layout.side;
    if (side === 'left' && top - tagH < labelZone[1] && top > labelZone[0]) {
      // eerst proberen: label onder de bereiklabels (kortere paal), anders naar rechts
      const below = labelZone[1] + tagH;
      if (below <= y - s) top = below;
      else side = 'right';
    }
    const x = xAt(side === 'left' ? -0.45 : 0.45, y);
    return { marker, side, x, y, s, top };
  });

  const label = `Baan met bereik tot ${Math.round(rangeKm.low)} km zeker, ${Math.round(rangeKm.safe)} km met 10 % reserve en tot ${Math.round(
    rangeKm.high,
  )} km mogelijk.${marks.map(({ marker }) => ` ${marker.name} ${Math.round(marker.distanceKm)} km: ${STATUS_LABEL[marker.status]}.`).join('')}`;

  return (
    <div ref={boxRef} className={sceneBox}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <pattern id="reserve-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill={COLORS.reach} fillOpacity="0.3" />
            <line x1="0" y1="0" x2="0" y2="5" stroke={COLORS.reach} strokeWidth="2.4" />
          </pattern>
        </defs>
        <polygon points={quad(BOT, HOR)} fill={COLORS.road} />
        <g stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2">
          <line x1={xAt(-0.95, BOT)} y1={BOT} x2={xAt(-0.95, HOR)} y2={HOR} />
          <line x1={xAt(0.95, BOT)} y1={BOT} x2={xAt(0.95, HOR)} y2={HOR} />
        </g>

        {/* Zeker bereik met raster, tot de reserve */}
        <polygon points={quad(BOT, ySafe)} fill={COLORS.reach} fillOpacity="0.3" />
        <g stroke={COLORS.reach} strokeOpacity="0.9" strokeWidth="1">
          {along.map((f) => (
            <line key={f} x1={xAt(f, BOT)} y1={BOT} x2={xAt(f, ySafe)} y2={ySafe} />
          ))}
          {cross.map((y) => (
            <line key={y} x1={xAt(-1, y)} y1={y} x2={xAt(1, y)} y2={y} />
          ))}
        </g>

        {/* Reserve van 10 %: gearceerd tussen "zeker met reserve" en "zeker" */}
        <polygon points={quad(ySafe, yLow)} fill="url(#reserve-hatch)" />
        <line x1={xAt(-1, yLow)} y1={yLow} x2={xAt(1, yLow)} y2={yLow} stroke={COLORS.reach} strokeWidth="2" />

        {/* Marge */}
        <polygon points={quad(yLow, yHigh)} fill={COLORS.margin} fillOpacity="0.55" />

        {/* Hulplijnen zeker / mogelijk naar links, reserve naar rechts */}
        <g stroke={COLORS.ink} strokeDasharray="3 3">
          <line x1="60" y1={yLow} x2={xAt(-1, yLow) - 2} y2={yLow} />
          <line x1="60" y1={yHigh} x2={xAt(-1, yHigh) - 2} y2={yHigh} />
          <line x1={xAt(1, yReserve) + 2} y1={yReserve} x2={xAt(1, yReserve) + 40} y2={yReserve} />
        </g>

        {/* Markeringen op de baan en palen */}
        {marks.map(({ marker, x, y, s, top }) => (
          <g key={marker.id}>
            <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={STATUS_COLOR[marker.status]} />
            <line x1={x} y1={y} x2={x} y2={top} stroke={STATUS_COLOR[marker.status]} strokeWidth="1.5" />
          </g>
        ))}

        <Car />
      </svg>

      {/* HTML-laag: bereiklabels, reserve en markeringen */}
      <div className={sceneOverlay}>
        <span className={rangeLabel} style={{ top: pct(yHighLabel, H) }}>{Math.round(rangeKm.high / 10) * 10} KM</span>
        <span className={rangeLabel} style={{ top: pct(yLow, H) }}>{Math.round(rangeKm.low / 10) * 10} KM</span>
        <span
          className="absolute -translate-y-1/2 font-mono text-[0.83em] text-muted tracking-[0.06em] whitespace-nowrap"
          style={{ top: pct(yReserve, H), left: pct(xAt(1, yReserve) + 44, W) }}
        >
          RESERVE 10 %
        </span>
        {marks.map(({ marker, side, x, top }) => (
          <Tag key={marker.id} marker={marker} side={side} x={pct(x, W)} y={pct(top, H)} />
        ))}
      </div>
    </div>
  );
}

/**
 * Verhouding tussen de werkelijke lettergrootte van de labels en die bij de ontwerpverhouding (12 px op 393).
 * Gemeten op de overlay; volgt de grootte van de baan (ResizeObserver).
 * @returns {[React.RefObject<HTMLDivElement>, number]}
 */
function useLabelScale() {
  const ref = useRef(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const w = box.getBoundingClientRect().width;
      const overlay = box.lastElementChild;
      const font = overlay ? parseFloat(getComputedStyle(overlay).fontSize) : 0;
      // nooit onder 1: op een grote baan (laptop) blijft de plaatsing zoals in Figma
      if (w > 0 && font > 0) setK(Math.max(1, Math.round((font / ((w * 12) / W)) * 100) / 100));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);
  return [ref, k];
}

function Car() {
  const cx = CX;
  const by = BOT - 4;
  return (
    <g aria-hidden="true">
      <ellipse cx={cx} cy={by} rx="54" ry="7" fill="#000" fillOpacity="0.35" />
      <rect x={cx - 46} y={by - 22} width="14" height="22" rx="3" fill="#111" />
      <rect x={cx + 32} y={by - 22} width="14" height="22" rx="3" fill="#111" />
      <path
        d={`M${cx - 33} ${by - 52}L${cx - 23} ${by - 76}Q${cx - 21} ${by - 81} ${cx - 15} ${by - 81}L${cx + 15} ${by - 81}Q${cx + 21} ${by - 81} ${cx + 23} ${by - 76}L${cx + 33} ${by - 52}Z`}
        fill={COLORS.car}
      />
      <path
        d={`M${cx - 25} ${by - 54}L${cx - 18} ${by - 71}Q${cx - 17} ${by - 75} ${cx - 12} ${by - 75}L${cx + 12} ${by - 75}Q${cx + 17} ${by - 75} ${cx + 18} ${by - 71}L${cx + 25} ${by - 54}Z`}
        fill={COLORS.carGlass}
      />
      <rect x={cx - 50} y={by - 56} width="100" height="40" rx="14" fill={COLORS.car} />
      <rect x={cx - 42} y={by - 46} width="84" height="4" rx="2" fill={COLORS.ink} />
      <rect x={cx - 32} y={by - 31} width="64" height="7" rx="3.5" fill="#E6E6E6" />
    </g>
  );
}
