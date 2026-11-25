import { Fragment, useEffect, useState } from 'react';
import { STATUS_COLOR, STATUS_LABEL } from '../scene/shared/theme.js';
import { DAYS } from '../scenario/trips.js';
import { KG_PER_PASSENGER, KG_PER_BAG, MAX_PASSENGERS, MAX_BAGS, extraKgOf } from '../scenario/vehicle.js';
import { municipalityByNis } from '../route/municipalities.js';
import PlaceSearch from './PlaceSearch.jsx';
import DayChips from './DayChips.jsx';
import Stepper from './Stepper.jsx';
import Switch from './Switch.jsx';
import { IconChevron16, IconLock } from './icons.jsx';
import { btnPrimary, eyebrow } from './cls.js';

const round10 = (km) => Math.round(km / 10) * 10;
const label = 'font-mono text-[10.5px] text-muted tracking-[0.1em]';
const link = 'min-h-8 font-mono text-[10.5px] font-semibold tracking-[0.05em] underline underline-offset-2';
const NAMES = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const listNl = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} en ${items.at(-1)}`);

/** "MA–VR" voor opeenvolgende dagen, anders "DI, DO". */
function daysText(days) {
  if (!days.length) return 'AF EN TOE';
  const runs = [];
  for (const d of days) {
    const last = runs.at(-1);
    if (last && d === last[1] + 1) last[1] = d;
    else runs.push([d, d]);
  }
  return runs.map(([a, b]) => (b - a >= 2 ? `${DAYS[a]}–${DAYS[b]}` : a === b ? DAYS[a] : `${DAYS[a]}, ${DAYS[b]}`)).join(', ');
}

const CHARGING = [
  { id: 'ja', label: 'JA', text: 'thuis laden' },
  { id: 'nee', label: 'NEE', text: 'niet thuis laden' },
  { id: 'onbekend', label: 'WEET IK NOG NIET', text: 'laden: weet ik nog niet' },
];

/**
 * Mijn ritten: "Jouw situatie" bovenaan, daaronder de ritten als uitklapmenu (één tegelijk open),
 * van licht naar zwaar, met de grenzen van het zekere en het mogelijke bereik ertussen.
 * Alles blijft op het toestel (zie scenario/storage.js).
 * @param {{ plan: object, trips: object[], situation: object, actions: object, focus?: string|null }} props
 *        focus: wat bij het openen al open staat, 'situatie' of het id van een rit
 */
export default function TripsPanel({ plan, trips, situation, actions, focus }) {
  const [openId, setOpenId] = useState(focus ?? null);
  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));
  const stats = plan.tripStats;
  // volgorde van licht naar zwaar, maar alleen opnieuw sorteren bij het open- of dichtklappen:
  // anders springt een rit weg terwijl je hem aanpast
  const sortIds = () => [...trips].sort((a, b) => stats[a.id].share.worst - stats[b.id].share.worst).map((t) => t.id);
  const [order, setOrder] = useState(sortIds);
  useEffect(() => setOrder(sortIds()), [openId]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  const sorted = [...order.filter((id) => byId[id]), ...trips.map((t) => t.id).filter((id) => !order.includes(id))].map((id) => byId[id]);
  const hasWeekly = trips.some((t) => t.days.length);

  const add = () => {
    const t = actions.addTrip({ name: 'Nieuwe rit', km: 0, days: [] });
    setOpenId(t.id);
  };

  let shownSafe = false;
  let shownHigh = false;
  const cut = (key, text) => (
    <li key={key} className="flex items-center gap-2.5 pl-0.5 font-mono text-[10px] font-semibold tracking-[0.1em]" aria-hidden="true">
      <span className="size-3.5 bg-reach shrink-0 relative z-1" />
      <span className="flex-1 border-t-[1.5px] border-dashed border-reach" />
      {text}
    </li>
  );
  const safeText = `ZEKER BEREIK · ${round10(plan.rangeKm.safe)} KM (10 % RESERVE)`;
  const highText = `MOGELIJK BEREIK · ${round10(plan.rangeKm.high)} KM`;

  return (
    <>
      <Situation
        open={openId === 'situatie'}
        onToggle={() => toggle('situatie')}
        situation={situation}
        suggested={plan.week?.suggested ?? []}
        actions={actions}
      />

      <p className="text-[14px] leading-[20px]">Tik op een rit om hem aan te passen. Heen en terug staat standaard aan.</p>
      <p className={eyebrow}>
        GRENZEN: {hasWeekly ? 'JOUW MIX' : 'STANDAARDMIX'} · {plan.inputs.tempC} °C · 10 % RESERVE
      </p>

      <ol className="relative flex flex-col gap-3.5 before:absolute before:left-[8.5px] before:top-[12px] before:bottom-[22px] before:border-l before:border-dashed before:border-ink">
        {sorted.map((t) => {
          const st = stats[t.id];
          const before = [];
          if (!shownSafe && st.status !== 'haalbaar') {
            shownSafe = true;
            before.push(cut('safe', safeText));
          }
          if (!shownHigh && st.status === 'laadstop') {
            shownHigh = true;
            before.push(cut('high', highText));
          }
          return (
            <Fragment key={t.id}>
              {before}
              <TripItem trip={t} stat={st} open={openId === t.id} onToggle={() => toggle(t.id)} hasHome={situation.home != null} actions={actions} />
            </Fragment>
          );
        })}
        {!shownSafe && cut('safe', safeText)}
        {!shownHigh && cut('high', highText)}
        <li className="flex items-center gap-3.5">
          <span className="size-[18px] rounded-full border-[1.5px] border-ink border-dashed bg-white relative z-1" aria-hidden="true" />
          <button type="button" className="min-h-11 font-mono text-[12px] font-semibold tracking-[0.08em]" onClick={add}>
            + RIT TOEVOEGEN
          </button>
        </li>
      </ol>

      {trips.length > 0 && <ClearAll onClear={actions.clearTrips} />}
    </>
  );
}

/** "Jouw situatie": thuisgemeente, laden (en laaddagen of voorverwarmen). */
function Situation({ open, onToggle, situation, suggested, actions }) {
  const home = municipalityByNis(situation.home);
  const charging = CHARGING.find((c) => c.id === situation.charging);
  const summary = [home?.name ?? 'Nog geen gemeente', charging.text, situation.preheat ? 'voorverwarmen' : null].filter(Boolean).join(' · ');
  const [homeStatus, setHomeStatus] = useState(null);

  const chooseHome = async (nis) => {
    setHomeStatus('Routes worden opnieuw berekend…');
    const results = await actions.setHome(nis);
    const failed = results.filter((r) => !r.ok);
    setHomeStatus(failed.length ? `${failed.length} route(s) lukten niet: ${failed[0].error}` : null);
  };

  return (
    <section className={`rounded-[14px] bg-surface border ${open ? 'border-ink' : 'border-line'}`}>
      <button type="button" className="flex items-center gap-2.5 w-full pt-3 pb-3 px-3.5 text-left" aria-expanded={open} aria-controls="jouw-situatie" onClick={onToggle}>
        <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
          <span className={label}>JOUW SITUATIE</span>
          <span className="text-[14.5px] font-medium truncate">{summary}</span>
        </span>
        <IconChevron16 up={open} />
      </button>
      {open && (
        <div id="jouw-situatie" className="flex flex-col gap-3.5 px-3.5 pb-4">
          <div className="flex flex-col gap-1">
            <PlaceSearch label="VERTREK VANAF" value={situation.home} onSelect={chooseHome} placeholder="Je gemeente" />
            <p className="text-[12.5px] text-muted leading-[1.35]" role="status">
              {homeStatus ?? 'Alleen de gemeente. Rangy rekent ritten van hier naar hun bestemming.'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p id="laden-label" className={label}>THUIS OF OP HET WERK LADEN</p>
            <div className="flex gap-1.5" role="group" aria-labelledby="laden-label">
              {CHARGING.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={situation.charging === c.id}
                  className={`h-9 rounded-full border border-ink font-mono text-[10.5px] tracking-[0.04em] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:font-semibold ${
                    c.id === 'onbekend' ? 'flex-1 px-3' : 'w-16 px-1.5'
                  }`}
                  onClick={() => actions.setSituation({ charging: c.id })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {situation.charging === 'ja' ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-[3px]">
                <p id="voorverwarmen-label" className="font-mono text-[11.5px] tracking-[0.07em]">VOORVERWARMEN AAN DE LADER</p>
                <p className="text-[12.5px] text-muted leading-[1.35]">Scheelt in de winter, vooral bij korte ritten. Alleen als je thuis of op het werk laadt.</p>
              </div>
              <Switch checked={situation.preheat} onChange={(preheat) => actions.setSituation({ preheat })} label="Voorverwarmen aan de lader" />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className={label}>WANNEER LAAD JE?</p>
              <DayChips value={situation.chargeDays} onChange={(chargeDays) => actions.setSituation({ chargeDays })} label="Laaddagen" suggested={suggested} />
              <p className="text-[12.5px] text-muted leading-[1.35]">
                {situation.chargeDays.length
                  ? 'Je vertrekt op die dagen met 90 %. Volstaat dat niet, dan toont de week een extra laadbeurt.'
                  : suggested.length
                    ? `Nog niets gekozen: Rangy stelt ${listNl(suggested.map((d) => NAMES[d]))} voor.`
                    : 'Nog niets gekozen. Met vaste ritten stelt Rangy laaddagen voor.'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Eén rit: ingeklapt een regel, uitgeklapt alle velden. */
function TripItem({ trip, stat, open, onToggle, hasHome, actions }) {
  const dest = municipalityByNis(trip.dest);
  const weekly = trip.days.length > 0;
  const showStatus = !weekly || stat.status !== 'haalbaar';
  const sub = weekly
    ? `${dest ? `→ ${dest.name.toUpperCase()}` : 'ZELF INGEGEVEN'} · ${Math.round(trip.km)} KM · ${daysText(trip.days)}`
    : `${Math.round(stat.distanceKm)} KM · AF EN TOE`;

  return (
    <li className="flex gap-3.5 items-start">
      <span
        className={`size-[18px] shrink-0 rounded-full border-[1.5px] border-ink relative z-1 bg-[radial-gradient(circle,var(--color-ink)_0_4px,#fff_4.5px)] ${open ? 'mt-3.5' : 'mt-[3px]'}`}
        aria-hidden="true"
      />
      {open ? (
        <TripEditor trip={trip} dest={dest} onToggle={onToggle} hasHome={hasHome} actions={actions} />
      ) : (
        <button type="button" className="flex-1 min-w-0 flex items-center gap-2.5 text-left min-h-11 -mt-1" aria-expanded={false} onClick={onToggle}>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="font-mono text-[13px] font-semibold tracking-[0.09em] truncate">{trip.name.toUpperCase()}</span>
            <span className="flex items-center gap-2 min-w-0">
              {showStatus && (
                <span className="shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.05em]" style={{ background: STATUS_COLOR[stat.status] }}>
                  {STATUS_LABEL[stat.status].toUpperCase()}
                </span>
              )}
              <span className="font-mono text-[11px] text-muted tracking-[0.04em] truncate">{sub}</span>
            </span>
          </span>
          <IconChevron16 />
        </button>
      )}
    </li>
  );
}

function TripEditor({ trip, dest, onToggle, hasHome, actions }) {
  const [manual, setManual] = useState(!trip.dest && trip.km > 0);
  const [routeMsg, setRouteMsg] = useState(null);
  const update = (patch) => actions.updateTrip(trip.id, patch);
  const extraKg = extraKgOf(trip.load);

  const chooseDest = async (nis) => {
    setRouteMsg('Route berekenen…');
    const r = await actions.routeTrip(trip.id, nis);
    setRouteMsg(r.ok ? null : r.error);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3.5 pt-3 pb-3.5 px-3.5 bg-surface border border-ink rounded-[14px]">
      <div className="flex items-center gap-2.5">
        <label className="sr-only" htmlFor={`naam-${trip.id}`}>Naam van de rit</label>
        <input
          id={`naam-${trip.id}`}
          className="flex-1 min-w-0 h-8 bg-transparent border-b border-dashed border-ink font-mono text-[13px] font-semibold tracking-[0.09em] uppercase outline-none"
          value={trip.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <button type="button" className="size-8 grid place-items-center -mr-2" aria-expanded={true} aria-label={`${trip.name} dichtklappen`} onClick={onToggle}>
          <IconChevron16 up />
        </button>
      </div>

      {manual ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`km-${trip.id}`} className={label}>AFSTAND ENKEL</label>
          <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-ink">
            <input
              id={`km-${trip.id}`}
              type="number"
              inputMode="numeric"
              min="0"
              className="flex-1 min-w-0 bg-transparent font-mono text-[16px] font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              value={trip.km || ''}
              onChange={(e) => update({ km: Math.max(0, Number(e.target.value) || 0), dest: null, segments: null })}
            />
            <span className="font-mono text-[11px] text-muted" aria-hidden="true">KM</span>
          </div>
          <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[10.5px] tracking-[0.04em]">
            <span className="font-medium">ZONDER ROUTE: STANDAARDMIX</span>
            <button type="button" className={link} onClick={() => setManual(false)}>BESTEMMING KIEZEN</button>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <PlaceSearch label="BESTEMMING" value={trip.dest} onSelect={chooseDest} disabled={!hasHome} placeholder={hasHome ? 'Gemeente' : 'Kies eerst je thuisgemeente'} />
          <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[10.5px] tracking-[0.04em]" role="status">
            <span className={`font-medium ${routeMsg && routeMsg !== 'Route berekenen…' ? 'text-[#bf3333]' : ''}`}>
              {routeMsg ?? (dest && trip.segments ? `${Math.round(trip.km)} KM ENKEL · VIA DE ROUTE` : hasHome ? 'NOG GEEN BESTEMMING' : 'THUISGEMEENTE: BIJ JOUW SITUATIE')}
            </span>
            <button type="button" className={link} onClick={() => setManual(true)}>ZELF INGEVEN</button>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-[3px]">
          <p className="font-mono text-[11px] font-medium tracking-[0.07em]">HEEN EN TERUG</p>
          <p className="text-[12.5px] text-muted leading-[1.35]">Uit voor een rit in één richting, bv. op vakantie.</p>
        </div>
        <Switch checked={trip.roundTrip} onChange={(roundTrip) => update({ roundTrip })} label="Heen en terug" />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={label}>DAGEN</p>
        <DayChips value={trip.days} onChange={(days) => update({ days })} label={`Dagen van ${trip.name}`} />
        {!trip.days.length && <p className="font-mono text-[10px] text-muted tracking-[0.04em]">GEEN DAG GEKOZEN = AF EN TOE</p>}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between font-mono text-[10.5px]">
          <span className="text-muted tracking-[0.1em]">LADING · DEZE RIT</span>
          <span className="font-semibold tracking-[0.05em]">{extraKg ? `+ ${extraKg} KG` : 'ALLEEN DE BESTUURDER'}</span>
        </div>
        <Stepper
          id={`passagiers-${trip.id}`}
          label="PASSAGIERS"
          hint={`+${KG_PER_PASSENGER} KG`}
          value={trip.load.passengers}
          max={MAX_PASSENGERS}
          onChange={(passengers) => update({ load: { ...trip.load, passengers } })}
        />
        <Stepper
          id={`bagage-${trip.id}`}
          label="BAGAGE"
          hint={`+${KG_PER_BAG} KG`}
          value={trip.load.bags}
          max={MAX_BAGS}
          onChange={(bags) => update({ load: { ...trip.load, bags } })}
        />
      </div>

      <button type="button" className="self-start min-h-8 font-mono text-[11px] font-semibold tracking-[0.07em] underline underline-offset-2 text-[#bf3333]" onClick={() => actions.removeTrip(trip.id)}>
        RIT VERWIJDEREN
      </button>
    </div>
  );
}

/** Alles wissen, met een bevestiging op dezelfde plek (geen pop-up). */
function ClearAll({ onClear }) {
  const [ask, setAsk] = useState(false);
  const red = 'min-h-11 font-mono text-[11px] font-semibold tracking-[0.07em] underline underline-offset-2 text-[#bf3333]';
  return ask ? (
    <p className="flex items-center gap-4" role="group" aria-label="Alle ritten wissen?">
      <span className="font-mono text-[11px] tracking-[0.06em]">ALLE RITTEN WISSEN?</span>
      <button type="button" className={red} onClick={onClear}>JA, WISSEN</button>
      <button type="button" className="min-h-11 font-mono text-[11px] font-semibold tracking-[0.07em] underline underline-offset-2" onClick={() => setAsk(false)}>
        ANNULEREN
      </button>
    </p>
  ) : (
    <button type="button" className={`self-start ${red}`} onClick={() => setAsk(true)}>ALLES WISSEN</button>
  );
}

export function TripsFooter({ onDone }) {
  return (
    <>
      <p className="flex items-center gap-2.5 font-mono text-[12px] tracking-[0.08em]"><IconLock /> GEEN ACCOUNT · BLIJFT OP DIT TOESTEL</p>
      <button type="button" className={`${btnPrimary} justify-center`} onClick={onDone}>TOON OP DE BAAN</button>
    </>
  );
}
