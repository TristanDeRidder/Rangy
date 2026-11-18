/**
 * Slider in de stijl van het ontwerp: gevulde lijn tot het handvat, stippellijn erna.
 * Gebouwd op een echte <input type="range">, dus werkt met toetsenbord en schermlezer.
 * `marks` zijn klikbare labels onder de lijn (bv. seizoenen).
 */
export default function Slider({ id, label, valueLabel, min, max, step, value, onChange, disabled, ends, marks = [] }) {
  const frac = (value - min) / (max - min);
  // zelfde positie als het handvat: de duim (20 px) loopt niet tot de uiterste rand
  const at = (v) => `calc(10px + (100% - 20px) * ${(v - min) / (max - min)})`;
  return (
    <div className={`flex flex-col ${disabled ? 'opacity-45' : ''}`}>
      <div className="flex justify-between font-mono text-[12px] tracking-[0.08em]">
        <label htmlFor={id}>{label}</label>
        <span className="font-semibold text-[13px]">{valueLabel}</span>
      </div>
      <div className="relative h-7" style={{ '--f': frac }}>
        {marks.map((m) => (
          <span key={m.value} className="absolute top-2.25 w-px h-2.5 bg-ink" style={{ left: at(m.value) }} />
        ))}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      {ends && (
        <div className="flex justify-between font-mono text-[12px] tracking-normal px-0.5"><span>{ends[0]}</span><span>{ends[1]}</span></div>
      )}
      {marks.some((m) => m.label) && (
        <div className="relative h-9">
          {marks.filter((m) => m.label).map((m) => (
            <button
              key={m.value}
              type="button"
              className="absolute -translate-x-1/2 px-1.5 min-h-9 flex flex-col items-center font-mono text-[12px] leading-3.75 tracking-normal text-muted"
              style={{ left: at(m.value) }}
              onClick={() => onChange(m.value)}
              aria-label={`${m.label} (${m.value} °C)`}
            >
              <span>{m.value}</span>
              <span>{m.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
