/** Bouwstenen voor de onderwerpen in de Uitleg. */
import { COLORS, STATUS_COLOR } from '../../scene/shared/theme.js';
import { eyebrow, mono } from '../cls.js';

export const r10 = (km) => Math.round(km / 10) * 10;
/** Temperatuur met een echt minteken (bv. "−5 °C"). */
export const degC = (t) => `${t < 0 ? '−' : ''}${Math.abs(t)} °C`;
export const span = ({ low, high }) => (r10(low) === r10(high) ? `± ${r10(low)}` : `${r10(low)}–${r10(high)}`);

/** Gewone alinea. */
export const P = ({ children }) => <p className="text-[15px] leading-[22px]">{children}</p>;

/** Grote openingszin bovenaan een onderwerp. */
export const Lead = ({ children }) => <p className="text-[17px] leading-6">{children}</p>;

/** Kopje binnen een onderwerp. */
export const H = ({ children }) => <h3 className="mt-2 font-mono text-[12px] font-semibold tracking-[0.1em]">{children}</h3>;

/** Aanname of bron, kleiner en grijs. */
export const Note = ({ children }) => <p className="text-[12.5px] leading-[18px] text-muted">{children}</p>;

/**
 * Bereik als balken, op dezelfde schaal: groen tot het zekere bereik, geel tot het mogelijke.
 * @param {{ label: string, band: {low:number, high:number} }[]} rows
 * @param {number} [max]  zelfde schaal over meerdere grafieken (standaard: de langste balk)
 */
export function RangeBars({ rows, caption, max: fixedMax }) {
  const max = fixedMax ?? Math.max(...rows.map((r) => r.band.high));
  const pct = (km) => `${(km / max) * 100}%`;
  return (
    <figure className="flex flex-col gap-3">
      {rows.map(({ label, band }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.08em]">
            <span>{label}</span>
            <span className="font-semibold text-[13px]">{span(band)} KM</span>
          </div>
          <div className="relative h-3 bg-[#e7e7e7]" role="img" aria-label={`${label}: ${span(band)} km`}>
            <span className="absolute inset-y-0 left-0" style={{ width: pct(band.low), background: COLORS.reach }} />
            <span className="absolute inset-y-0" style={{ left: pct(band.low), width: pct(band.high - band.low), background: COLORS.margin }} />
          </div>
        </div>
      ))}
      {caption && <figcaption className={eyebrow}>{caption}</figcaption>}
    </figure>
  );
}

/** Deel van een volle batterij als percent, met één decimaal (bv. "4,6 %"). */
export const pct1 = (x) => `${(x * 100).toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/**
 * Kleine tabel: eerste kolom als label, de rest als waarden.
 * @param {{ head: string[], rows: string[][], caption?: string }} props
 */
export function Table({ head, rows, caption }) {
  return (
    <figure className="flex flex-col gap-2">
      <table className="w-full border-collapse font-mono text-[12px] tracking-[0.04em]">
        <thead>
          <tr className="border-b border-ink">
            {head.map((h, i) => (
              <th key={h} scope="col" className={`py-2 font-medium text-[11px] text-muted ${i ? 'text-right' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, ...cells]) => (
            <tr key={label} className="border-b border-line last:border-b-0">
              <th scope="row" className="py-2.5 text-left font-semibold">{label}</th>
              {cells.map((c, i) => (
                <td key={i} className="py-2.5 text-right font-semibold">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <figcaption className={eyebrow}>{caption}</figcaption>}
    </figure>
  );
}

/** Tabel met twee kolommen (bv. specificaties). */
export function Facts({ rows }) {
  return (
    <dl className="bg-surface border border-ink rounded-xl px-3.5 py-1">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2.75 border-b border-line last:border-b-0">
          <dt className={`${mono} text-[11px] text-muted`}>{k}</dt>
          <dd className={`${mono} text-[12px] font-semibold text-right`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Status zoals op de markeringen langs de baan. */
export const Status = ({ status, children }) => (
  <span className="self-start px-[7px] py-[3px] font-mono text-[12px] font-semibold tracking-[0.06em]" style={{ background: STATUS_COLOR[status] }}>
    {children}
  </span>
);
