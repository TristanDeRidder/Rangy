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
    <div className={`slider ${disabled ? 'slider--disabled' : ''}`}>
      <div className="slider__head mono">
        <label htmlFor={id}>{label}</label>
        <span className="strong">{valueLabel}</span>
      </div>
      <div className="slider__track" style={{ '--f': frac }}>
        {marks.map((m) => (
          <span key={m.value} className="slider__tick" style={{ left: at(m.value) }} />
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
        <div className="slider__ends mono"><span>{ends[0]}</span><span>{ends[1]}</span></div>
      )}
      {marks.some((m) => m.label) && (
        <div className="slider__marks">
          {marks.filter((m) => m.label).map((m) => (
            <button
              key={m.value}
              type="button"
              className="slider__mark mono"
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
