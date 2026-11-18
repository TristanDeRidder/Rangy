import { Fragment } from 'react';
import { STATUS_COLOR, STATUS_LABEL } from '../scene/shared/theme.js';
import { IconLock } from './icons.jsx';

const round10 = (km) => Math.round(km / 10) * 10;

/**
 * Mijn ritten: tijdlijn met de eigen ritten van kort naar lang,
 * met de grenzen van het zekere en het mogelijke bereik ertussen.
 * Bewerken met een paar invulvelden, zonder account.
 */
export default function TripsPanel({ scene, setTrips }) {
  const { tripType, speedKmh, tempC } = scene.inputs;
  const all = scene.inputs.trips;
  const update = (id, patch) => setTrips(all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => setTrips(all.filter((t) => t.id !== id));
  // geen crypto.randomUUID: dat werkt niet via http op je gsm (geen beveiligde context)
  const add = () => setTrips([...all, { id: Date.now().toString(36), name: 'Nieuwe rit', km: 100 }]);

  const low = round10(scene.rangeKm.low);
  const high = round10(scene.rangeKm.high);
  let shownLow = false;
  let shownHigh = false;
  const cut = (text) => (
    <li className="timeline__cut mono" aria-hidden="true"><span className="timeline__sq" /><span className="timeline__dash" />{text}</li>
  );

  return (
    <>
      <p className="lead">Vul de afstanden in die je geregeld rijdt. Ze verschijnen als markeringen langs de baan.</p>
      <p className="eyebrow mono">
        BIJ {tripType === 'stad' ? 'STADSRIT' : `SNELWEG · ${speedKmh} KM/H`} · {tempC} °C
      </p>

      <ol className="timeline">
        {scene.trips.map((t) => {
          const before = [];
          if (!shownLow && t.km > scene.rangeKm.low) { shownLow = true; before.push(cut(`ZEKER BEREIK · ${low} KM`)); }
          if (!shownHigh && t.km > scene.rangeKm.high) { shownHigh = true; before.push(cut(`MOGELIJK BEREIK · ${high} KM`)); }
          return (
            <Fragment key={t.id}>
              {before.map((b, i) => <Fragment key={i}>{b}</Fragment>)}
              <li className="timeline__item">
                <span className="timeline__dot" aria-hidden="true" />
                <div className="timeline__fields">
                  <label className="sr-only" htmlFor={`naam-${t.id}`}>Naam van de rit</label>
                  <input
                    id={`naam-${t.id}`}
                    className="timeline__name mono"
                    value={t.name}
                    onChange={(e) => update(t.id, { name: e.target.value })}
                  />
                  <label className="km-field mono">
                    <span className="sr-only">Afstand van {t.name} in km</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={t.km}
                      onChange={(e) => update(t.id, { km: Math.max(1, Number(e.target.value) || 1) })}
                    />
                    <span aria-hidden="true">KM</span>
                  </label>
                  <button type="button" className="icon-btn" onClick={() => remove(t.id)} aria-label={`${t.name} verwijderen`}>×</button>
                </div>
                <span className="chip mono" style={{ background: STATUS_COLOR[t.status] }}>
                  {STATUS_LABEL[t.status].toUpperCase()}
                </span>
              </li>
            </Fragment>
          );
        })}
        {!shownLow && cut(`ZEKER BEREIK · ${low} KM`)}
        {!shownHigh && cut(`MOGELIJK BEREIK · ${high} KM`)}
        <li className="timeline__add">
          <span className="timeline__dot timeline__dot--empty" aria-hidden="true" />
          <button type="button" className="text-btn mono" onClick={add}>+ RIT TOEVOEGEN</button>
        </li>
      </ol>
    </>
  );
}

export function TripsFooter({ onDone }) {
  return (
    <>
      <p className="privacy mono"><IconLock /> GEEN ACCOUNT · BLIJFT OP DIT TOESTEL</p>
      <button type="button" className="btn-primary mono" onClick={onDone}>TOON OP DE BAAN</button>
    </>
  );
}
