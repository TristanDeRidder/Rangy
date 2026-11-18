import { useMemo } from 'react';
import { cityWinter, highwayWinter } from '../scenario/winter.js';
import { COLORS } from '../scene/shared/theme.js';
import { eyebrow, mono } from './cls.js';

const r10 = (km) => Math.round(km / 10) * 10;
const r5 = (km) => Math.round(km / 5) * 5;
const span = ({ low, high }, r = r10) => (r(low) === r(high) ? `± ${r(low)}` : `${r(low)}–${r(high)}`);
const GREY = '#9A9A9A';

/** Blokjes van 10 km: [kleur, aantal][] */
function Blocks({ spec, label }) {
  const cells = spec.flatMap(([color, n]) => Array.from({ length: Math.max(0, n) }, () => color));
  return (
    <div className="flex gap-0.5" role="img" aria-label={label}>
      {cells.map((c, i) => <span key={i} className="flex-1 h-[22px] max-w-1.5" style={{ background: c }} />)}
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
      <p className={eyebrow}>STADSRIT · 20 °C → −5 °C</p>
      <p className="text-[17px] leading-6">
        Bij −5 °C kom je in de stad {lossLow} tot {lossHigh} km minder ver. Het grootste deel gaat naar de verwarming,
        niet naar de batterij.
      </p>

      <div className="flex flex-col gap-3 mt-1.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline text-[12px]"><span className={mono}>20 °C</span><span className="font-doto font-black text-[34px] leading-[34px]">{warm}<small className={`${mono} text-[12px] font-semibold`}> KM</small></span></div>
          <Blocks spec={[[COLORS.reach, total]]} label={`Bij 20 °C ongeveer ${warm} km`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline text-[12px]"><span className={mono}>−5 °C</span><span className="font-doto font-black text-[34px] leading-[34px]">{span(city.cold, r5)}<small className={`${mono} text-[12px] font-semibold`}> KM</small></span></div>
          <Blocks
            spec={[[COLORS.reach, keepLow], [COLORS.margin, keepHigh - keepLow], [COLORS.charge, heat], [GREY, cold]]}
            label={`Bij −5 °C ${span(city.cold, r5)} km. Verwarming kost ${span(city.heatLoss)} km, koude batterij ${span(city.coldLoss)} km.`}
          />
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tracking-[0.06em]">
          <li className="flex items-center gap-1.5"><i className="size-2.5 inline-block" style={{ background: COLORS.reach }} />OVER</li>
          <li className="flex items-center gap-1.5"><i className="size-2.5 inline-block" style={{ background: COLORS.margin }} />MARGE</li>
          <li className="flex items-center gap-1.5"><i className="size-2.5 inline-block" style={{ background: COLORS.charge }} />VERWARMING</li>
          <li className="flex items-center gap-1.5"><i className="size-2.5 inline-block" style={{ background: GREY }} />KOUDE BATTERIJ</li>
        </ul>
        <p className={eyebrow}>1 BLOKJE = 10 KM</p>
      </div>

      <div className="flex flex-col gap-3 mt-2">
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
    <section className="flex flex-col">
      <h3 className="self-start px-2 py-1 font-mono text-[12px] font-semibold tracking-[0.08em]" style={{ background: color }}>{title}</h3>
      <p className="bg-surface border-t-[1.5px] px-3 py-2.5 text-[14px] leading-5" style={{ borderTopColor: color }}>{children}</p>
    </section>
  );
}

export function WinterFooter() {
  return (
    <p className="text-[12.5px] leading-[18px] text-muted">
      <strong className={`${mono} text-[12px] text-ink`}>WAAROM EEN MARGE? </strong>
      Studies en metingen verschillen in hoe zuinig de verwarming werkt. Rangy toont daarom een bereik.
    </p>
  );
}
