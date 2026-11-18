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

const yOf = (t) => HOR + (BOT - HOR) * perspectiveY(t);
const hwOf = (y) => HW_TOP + ((HW_BOTTOM - HW_TOP) * (y - HOR)) / (BOT - HOR);
const xAt = (f, y) => CX + f * hwOf(y);
const quad = (y1, y2) =>
  `${xAt(-1, y1)},${y1} ${xAt(1, y1)},${y1} ${xAt(1, y2)},${y2} ${xAt(-1, y2)},${y2}`;
const pct = (v, total) => `${(v / total) * 100}%`;

/**
 * SVG-weergave van de baan. De labels staan als HTML erboven (gedeelde Tag-component).
 * @param {{ scene: import('../../scenario/types.js').Scene }} props
 */
export default function RoadSceneSVG({ scene }) {
  const yLow = yOf(scene.rangeT.low);
  const yHigh = yOf(scene.rangeT.high);

  const cross = [];
  for (let t = 0; t <= scene.rangeT.low; t += 0.05) cross.push(yOf(t));
  const along = [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1];

  const marks = scene.trips.map((trip, i) => {
    const { side, pole } = tagLayout(i);
    const y = yOf(trip.t);
    const x = xAt(side === 'left' ? -0.45 : 0.45, y);
    const s = Math.max(5, (12 * hwOf(y)) / HW_BOTTOM);
    return { trip, side, x, y, s, top: Math.max(14, y - POLE * pole - (s / 2)) };
  });

  const label = `Baan met bereik tot ${Math.round(scene.rangeKm.low)} km zeker en tot ${Math.round(
    scene.rangeKm.high,
  )} km mogelijk. ${scene.trips.map((t) => `${t.name} ${t.km} km, ${t.type}: ${STATUS_LABEL[t.status]}`).join('. ')}.`;

  return (
    <div className={sceneBox}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <polygon points={quad(BOT, HOR)} fill={COLORS.road} />
        <g stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2">
          <line x1={xAt(-0.95, BOT)} y1={BOT} x2={xAt(-0.95, HOR)} y2={HOR} />
          <line x1={xAt(0.95, BOT)} y1={BOT} x2={xAt(0.95, HOR)} y2={HOR} />
        </g>

        {/* Zeker bereik met raster */}
        <polygon points={quad(BOT, yLow)} fill={COLORS.reach} fillOpacity="0.3" />
        <g stroke={COLORS.reach} strokeOpacity="0.9" strokeWidth="1">
          {along.map((f) => (
            <line key={f} x1={xAt(f, BOT)} y1={BOT} x2={xAt(f, yLow)} y2={yLow} />
          ))}
          {cross.map((y) => (
            <line key={y} x1={xAt(-1, y)} y1={y} x2={xAt(1, y)} y2={y} />
          ))}
        </g>
        <line x1={xAt(-1, yLow)} y1={yLow} x2={xAt(1, yLow)} y2={yLow} stroke={COLORS.reach} strokeWidth="2" />

        {/* Marge */}
        <polygon points={quad(yLow, yHigh)} fill={COLORS.margin} fillOpacity="0.55" />

        {/* Hulplijnen 310 / 380 naar links */}
        <g stroke={COLORS.ink} strokeDasharray="3 3">
          <line x1="52" y1={yLow} x2={xAt(-1, yLow) - 2} y2={yLow} />
          <line x1="52" y1={yHigh} x2={xAt(-1, yHigh) - 2} y2={yHigh} />
        </g>

        {/* Markeringen op de baan en palen */}
        {marks.map(({ trip, x, y, s, top }) => (
          <g key={trip.id} opacity={trip.dim ? 0.5 : 1}>
            <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={STATUS_COLOR[trip.status]} />
            <line x1={x} y1={y} x2={x} y2={top} stroke={STATUS_COLOR[trip.status]} strokeWidth="1.5" />
          </g>
        ))}

        <Car />
      </svg>

      {/* HTML-laag: bereiklabels en ritlabels */}
      <div className={sceneOverlay}>
        <span className={rangeLabel} style={{ top: pct(yHigh, H) }}>{Math.round(scene.rangeKm.high / 10) * 10} KM</span>
        <span className={rangeLabel} style={{ top: pct(yLow, H) }}>{Math.round(scene.rangeKm.low / 10) * 10} KM</span>
        {marks.map(({ trip, side, x, top }) => (
          <Tag key={trip.id} trip={trip} side={side} x={pct(x, W)} y={pct(top, H)} />
        ))}
      </div>
    </div>
  );
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
