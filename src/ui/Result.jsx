import { TERRAIN } from '../scenario/buildScene.js';

const round10 = (km) => Math.round(km / 10) * 10;

/** Het resultaat: altijd in 2D, zodat het in de 3D- en SVG-versie identiek is. */
export default function Result({ scene, onWinter, onCar, showLink }) {
  const { tripType, speedKmh, tempC, terrain = 'vlak' } = scene.inputs;
  return (
    <section className="flex justify-between items-end gap-4 pt-3.5 px-5 short:pt-1.5 wide:p-0" aria-live="polite">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-doto font-black text-[92px] leading-[88px] tracking-[-2px] short:text-[68px] short:leading-[64px] wide:text-[132px] wide:leading-[124px]">{round10(scene.rangeKm.mid)}</span>
          <span className="font-mono text-[14px] font-semibold tracking-[0.08em]">KM</span>
        </div>
        <p className="font-mono text-[13px] text-muted tracking-[0.08em] mt-1.5 short:mt-0.5">
          TUSSEN {round10(scene.rangeKm.low)} EN {round10(scene.rangeKm.high)} KM
        </p>
        {showLink && (
          <button type="button" className="py-2 font-mono text-[12px] font-semibold tracking-[0.08em] underline underline-offset-3" onClick={onWinter}>
            WAAROM MINDER IN DE WINTER? →
          </button>
        )}
        {/* Het getal geldt voor één wagen: altijd zichtbaar, klik voor Uitleg › Referentiewagen */}
        <button
          type="button"
          className="flex items-center gap-1.5 min-h-8 short:min-h-7 font-mono text-[11px] text-muted tracking-[0.06em] wide:text-[12px]"
          onClick={onCar}
        >
          <span className="underline underline-offset-3">TESLA MODEL Y RWD · 60 KWH</span>
          <span className="size-5 rounded-full bg-[#efefef] grid place-items-center text-ink text-[11px] font-semibold" aria-hidden="true">?</span>
          <span className="sr-only">: over de referentiewagen</span>
        </button>
      </div>
      <ul className="font-mono text-[12px] leading-[18px] tracking-[0.1em] pb-[30px] short:pb-7 text-left" aria-label="Huidige omstandigheden">
        <li>{tripType === 'stad' ? 'STAD' : 'SNELWEG'}</li>
        {tripType === 'snelweg' && <li>{speedKmh} KM/H</li>}
        <li>{tempC} °C</li>
        {terrain !== 'vlak' && <li>{TERRAIN[terrain].label.toUpperCase()}</li>}
        {scene.extraKg > 0 && <li>+{scene.extraKg} KG</li>}
      </ul>
    </section>
  );
}
