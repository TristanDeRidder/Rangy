const round10 = (km) => Math.round(km / 10) * 10;

/** Het resultaat: altijd in 2D, zodat het in de 3D- en SVG-versie identiek is. */
export default function Result({ scene, onWinter, showLink }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  return (
    <section className="flex justify-between items-end gap-4 pt-3.5 px-5 wide:p-0" aria-live="polite">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-doto font-black text-[92px] leading-[88px] tracking-[-2px] wide:text-[132px] wide:leading-[124px]">{round10(scene.rangeKm.mid)}</span>
          <span className="font-mono text-[14px] font-semibold tracking-[0.08em]">KM</span>
        </div>
        <p className="font-mono text-[13px] text-muted tracking-[0.08em] mt-1.5">
          TUSSEN {round10(scene.rangeKm.low)} EN {round10(scene.rangeKm.high)} KM
        </p>
        {showLink && (
          <button type="button" className="py-2 font-mono text-[12px] font-semibold tracking-[0.08em] underline underline-offset-3" onClick={onWinter}>
            WAAROM MINDER IN DE WINTER? →
          </button>
        )}
      </div>
      <ul className="font-mono text-[12px] leading-[18px] tracking-[0.1em] pb-[22px] text-left" aria-label="Huidige omstandigheden">
        <li>{tripType === 'stad' ? 'STAD' : 'SNELWEG'}</li>
        {tripType === 'snelweg' && <li>{speedKmh} KM/H</li>}
        <li>{tempC} °C</li>
      </ul>
    </section>
  );
}
