import { useMemo } from 'react';
import { cityWinter, highwayWinter } from '../scenario/winter.js';
import { COLORS } from '../scene/shared/theme.js';

const r10 = (km) => Math.round(km / 10) * 10;
const r5 = (km) => Math.round(km / 5) * 5;
const span = ({ low, high }, r = r10) => (r(low) === r(high) ? `± ${r(low)}` : `${r(low)}–${r(high)}`);
const GREY = '#9A9A9A';

/** Blokjes van 10 km: [kleur, aantal][] */
function Blocks({ spec, label }) {
  const cells = spec.flatMap(([color, n]) => Array.from({ length: Math.max(0, n) }, () => color));
  return (
    <div className="blocks" role="img" aria-label={label}>
      {cells.map((c, i) => <span key={i} style={{ background: c }} />)}
    </div>
  );
}

/**
 * Uitleg winter: berekend met het rekenmodel (stadsrit 20 °C vs −5 °C),
 * met de vergelijking op de snelweg. De marge komt van de twee varianten voor de verwarming.
 */
export default function WinterPanel() {
  const city = useMemo(() => cityWinter(), []);
  const hwy = useMemo(() => highwayWinter(110), []);

  const warmMid = (city.warm.low + city.warm.high) / 2;
  const warm = r10(warmMid);
  const lossLow = r5(warmMid - city.cold.high);
  const lossHigh = r5(warmMid - city.cold.low);

  // blokjes (1 = 10 km)
  const total = Math.round(warm / 10);
  const keepLow = Math.round(city.cold.low / 10);
  const keepHigh = Math.round(city.cold.high / 10);
  const cold = Math.round(((city.coldLoss.low + city.coldLoss.high) / 2) / 10);
  const heat = total - keepHigh - cold;

  return (
    <>
      <p className="eyebrow mono">STADSRIT · 20 °C → −5 °C</p>
      <p className="lead lead--big">
        Bij −5 °C kom je in de stad {lossLow} tot {lossHigh} km minder ver. Het grootste deel gaat naar de verwarming,
        niet naar de batterij.
      </p>

      <div className="compare">
        <div className="compare__row">
          <div className="compare__head"><span className="mono">20 °C</span><span className="doto">{warm}<small className="mono"> KM</small></span></div>
          <Blocks spec={[[COLORS.reach, total]]} label={`Bij 20 °C ongeveer ${warm} km`} />
        </div>
        <div className="compare__row">
          <div className="compare__head"><span className="mono">−5 °C</span><span className="doto">{span(city.cold, r5)}<small className="mono"> KM</small></span></div>
          <Blocks
            spec={[[COLORS.reach, keepLow], [COLORS.margin, keepHigh - keepLow], [COLORS.charge, heat], [GREY, cold]]}
            label={`Bij −5 °C ${span(city.cold, r5)} km. Verwarming kost ${span(city.heatLoss)} km, koude batterij ${span(city.coldLoss)} km.`}
          />
        </div>
        <ul className="legend mono">
          <li><i style={{ background: COLORS.reach }} />OVER</li>
          <li><i style={{ background: COLORS.margin }} />MARGE</li>
          <li><i style={{ background: COLORS.charge }} />VERWARMING</li>
          <li><i style={{ background: GREY }} />KOUDE BATTERIJ</li>
        </ul>
        <p className="eyebrow mono">1 BLOKJE = 10 KM</p>
      </div>

      <div className="explain">
        <Explain color={COLORS.charge} title={`VERWARMING · ${span(city.heatLoss)} KM`}>
          In de stad rijd je traag. De verwarming draait dan lang voor elke kilometer die je aflegt.
        </Explain>
        <Explain color={GREY} title={`KOUDE BATTERIJ · ${span(city.coldLoss)} KM`}>
          Een koude batterij kan minder energie leveren en de aandrijving werkt iets minder efficiënt.
        </Explain>
        <Explain color={COLORS.reach} title="OP DE SNELWEG: OMGEKEERD">
          Bij 110 km/h kost de kou zelf {span(hwy.coldLoss)} km en de verwarming {span(hwy.heatLoss)} km.
        </Explain>
      </div>
    </>
  );
}

function Explain({ color, title, children }) {
  return (
    <section className="explain__item">
      <h3 className="explain__title mono" style={{ background: color }}>{title}</h3>
      <p className="explain__body" style={{ borderTopColor: color }}>{children}</p>
    </section>
  );
}

export function WinterFooter() {
  return (
    <p className="footnote">
      <strong className="mono">WAAROM EEN MARGE? </strong>
      Studies en metingen verschillen in hoe zuinig de verwarming werkt. Rangy toont daarom een bereik.
    </p>
  );
}
