const round10 = (km) => Math.round(km / 10) * 10;

/**
 * Het resultaat: het grote getal (bereik met je eigen mix van wegen) en de marge.
 * Rechts: de mix en de temperatuur waarmee gerekend is.
 * @param {{ plan: import('../scenario/types.js').Plan, onCar: () => void }} props
 */
export default function Result({ plan, onCar }) {
  const { rangeKm, mix, inputs } = plan;
  const hasWeekly = plan.days.some((d) => d.trips.length);
  return (
    <section className="flex justify-between items-end gap-4 pt-3.5 px-5 short:pt-1.5 wide:p-0" aria-live="polite">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-doto font-black text-[92px] leading-[88px] tracking-[-2px] short:text-[68px] short:leading-[64px] wide:text-[132px] wide:leading-[124px] low:text-[104px] low:leading-[98px]">
            {round10(rangeKm.mid)}
          </span>
          <span className="font-mono text-[14px] font-semibold tracking-[0.08em]">KM</span>
        </div>
        <p className="font-mono text-[13px] text-muted tracking-[0.08em] mt-1.5 short:mt-0.5">
          TUSSEN {round10(rangeKm.low)} EN {round10(rangeKm.high)} KM
        </p>
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
      <ul className="font-mono text-[12px] leading-[20px] tracking-[0.1em] pb-[30px] short:pb-7 text-left" aria-label="Waarmee gerekend is">
        <li>{hasWeekly ? 'JOUW MIX' : 'STANDAARDMIX'}</li>
        <li>{Math.round(mix.snel * 100)} % SNELWEG</li>
        <li>{inputs.tempC} °C</li>
      </ul>
    </section>
  );
}
