const round10 = (km) => Math.round(km / 10) * 10;

/** Het resultaat: altijd in 2D, zodat het in de 3D- en SVG-versie identiek is. */
export default function Result({ scene, onWinter, showLink }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  return (
    <section className="result" aria-live="polite">
      <div className="result__main">
        <div className="result__value">
          <span className="result__number">{round10(scene.rangeKm.mid)}</span>
          <span className="result__unit mono">KM</span>
        </div>
        <p className="result__band mono">
          TUSSEN {round10(scene.rangeKm.low)} EN {round10(scene.rangeKm.high)} KM
        </p>
        {showLink && (
          <button type="button" className="text-link mono" onClick={onWinter}>
            WAAROM MINDER IN DE WINTER? →
          </button>
        )}
      </div>
      <ul className="result__context mono" aria-label="Huidige omstandigheden">
        <li>{tripType === 'stad' ? 'STAD' : 'SNELWEG'}</li>
        {tripType === 'snelweg' && <li>{speedKmh} KM/H</li>}
        <li>{tempC} °C</li>
      </ul>
    </section>
  );
}
