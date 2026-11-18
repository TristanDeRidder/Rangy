/**
 * Teller met − en +. De cirkels zijn 36 px, het klikvlak 44 px (WCAG 2.5.5).
 */
export default function Stepper({ id, label, hint, value, min = 0, max, onChange }) {
  const btn = 'size-11 grid place-items-center shrink-0 disabled:opacity-35 disabled:cursor-default';
  const dot = 'size-9 rounded-full border border-ink grid place-items-center font-mono text-[16px] leading-none';
  return (
    <div className="flex items-center justify-between gap-3" role="group" aria-labelledby={`${id}-label`}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono">
        <span id={`${id}-label`} className="text-[11px] font-medium tracking-[0.08em]">{label}</span>
        <span className="text-[10.5px] text-muted tracking-[0.04em]">{hint}</span>
      </p>
      <div className="flex items-center -mr-1">
        <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${label.toLowerCase()}: één minder`}>
          <span className={`${dot} bg-surface`} aria-hidden="true">−</span>
        </button>
        <output className="w-7 text-center font-mono text-[14px] font-semibold" aria-live="polite">{value}</output>
        <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label.toLowerCase()}: één meer`}>
          <span className={`${dot} bg-ink text-white`} aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
