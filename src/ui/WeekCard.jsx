import { STATUS_COLOR } from '../scene/shared/theme.js';
import { IconBolt } from './icons.jsx';

const DAY_NAMES = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
/** "maandag, woensdag en vrijdag" */
const listNl = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} en ${items.at(-1)}`);
const pct = (x) => `${Math.round(x * 100)}%`;
/** Batterij op het einde van de dag onder 20 %: geel [ontwerpkeuze]. */
const LOW_LEVEL = 0.2;

const HEADER = {
  ja: 'JOUW WEEK · THUIS OF OP HET WERK LADEN',
  nee: 'JOUW WEEK · NIET THUIS LADEN',
  onbekend: 'JOUW WEEK · LADEN: WEET IK NOG NIET',
};
const CHARGING_TEXT = { ja: 'Je laadt thuis', nee: 'Je laadt niet thuis', onbekend: 'Nog niet beslist' };

/**
 * De week: met thuislader het verbruik per dag, zonder thuislader het batterijniveau en de laaddagen.
 * Leest alleen het plan (buildPlan); rekent zelf niets.
 * @param {{ plan: import('../scenario/types.js').Plan, onChangeCharging: () => void, onAddTrips: () => void }} props
 */
export default function WeekCard({ plan, onChangeCharging, onAddTrips }) {
  const hasWeekly = plan.days.some((d) => d.trips.length);
  if (!hasWeekly) return <EmptyWeek onAddTrips={onAddTrips} />;
  return plan.charging === 'ja' ? (
    <DailyWeek plan={plan} onChangeCharging={onChangeCharging} />
  ) : (
    <ChargingWeek plan={plan} onChangeCharging={onChangeCharging} />
  );
}

function Shell({ header, title, sub, legend, status, charging, onChangeCharging, children, extra }) {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0 px-5 pt-3.5 pb-1.5">
      <p className="font-mono text-[10.5px] text-muted tracking-[0.09em]">{header}</p>
      <p className="text-[24px] font-medium leading-tight">{title}</p>
      <p className="text-[14px] text-muted -mt-1">{sub}</p>
      <ol className="flex justify-between items-stretch pt-1 flex-1 min-h-[100px] max-h-[230px] wide:min-h-[190px]" aria-label="Per dag">
        {children}
      </ol>
      <p className="font-mono text-[9.5px] text-muted tracking-[0.04em] flex items-center gap-1">{legend}</p>
      <div className="flex items-center justify-between gap-3">
        {status}
        <p className="flex items-center gap-1.5 text-[13px] text-muted whitespace-nowrap">
          {charging}
          <button type="button" className="font-mono text-[11px] font-semibold text-ink tracking-[0.07em] underline underline-offset-2 min-h-8" onClick={onChangeCharging}>
            WIJZIG
          </button>
        </p>
      </div>
      {extra}
    </div>
  );
}

function Chip({ color, children }) {
  return (
    <span className="px-[7px] py-[3px] font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap" style={{ background: color }}>
      {children}
    </span>
  );
}

/**
 * Eén dag: label boven, staaf met vulling van onder, lijn voor de reserve, dag eronder.
 * @param {{ label: string, top: React.ReactNode, fill: number, color: string, line: number, strong?: boolean, outlined?: boolean, srText: string }} p
 */
function Bar({ label, top, fill, color, line, strong, outlined, srText }) {
  return (
    <li className="flex flex-col items-center gap-[5px] w-[30px]">
      <span className={`h-[14px] font-mono text-[10.5px] text-center ${strong ? 'font-semibold text-ink' : 'text-muted'}`} aria-hidden="true">
        {top}
      </span>
      <span
        className={`relative flex-1 w-7 rounded-[6px] bg-[#e8e8e8] overflow-hidden ${outlined ? 'border-[1.5px] border-ink' : ''}`}
        aria-hidden="true"
      >
        <span className="absolute inset-x-0 bottom-0" style={{ height: `${Math.min(100, fill * 100)}%`, background: color }} />
        <span className="absolute inset-x-0 h-[1.5px] bg-ink/50" style={{ bottom: `${line * 100}%` }} />
      </span>
      <span className={`font-mono text-[11px] tracking-[0.06em] ${strong ? 'font-semibold' : ''}`} aria-hidden="true">
        {label}
      </span>
      <span className="sr-only">{srText}</span>
    </li>
  );
}

/** Met thuislader: elke dag begint vol. Staaf = batterijverbruik van die dag, lijn = 90 %. */
function DailyWeek({ plan, onChangeCharging }) {
  const busiest = plan.busiest;
  const isBusiest = (d) => busiest && d.trips.length && Math.abs(d.share.worst - busiest.share.worst) < 1e-9;
  const busiestNames = plan.days.filter(isBusiest).map((d) => DAY_NAMES[d.day]);
  const ok = plan.daily.allDaysOk;
  return (
    <Shell
      header={HEADER.ja}
      title={`${Math.round(plan.weekKm)} km per week`}
      sub={`Drukste dag: ${listNl(busiestNames)}, ${Math.round(busiest.km)} km`}
      legend="— LIJN = MAXIMAAL 90 % VERBRUIKEN (10 % RESERVE)"
      status={<Chip color={ok ? STATUS_COLOR.haalbaar : STATUS_COLOR.marge}>{ok ? 'ELKE DAG HAALBAAR' : 'NIET ELKE DAG ZEKER'}</Chip>}
      charging={CHARGING_TEXT.ja}
      onChangeCharging={onChangeCharging}
    >
      {plan.days.map((d) => {
        const strong = isBusiest(d);
        return (
          <Bar
            key={d.day}
            label={d.label}
            top={pct(d.share.worst)}
            fill={d.share.worst}
            color={STATUS_COLOR[d.status ?? 'haalbaar']}
            line={0.9}
            strong={strong}
            outlined={strong}
            srText={`${DAY_NAMES[d.day]}: ${Math.round(d.km)} km, ${pct(d.share.worst)} van de batterij${strong ? ', drukste dag' : ''}.`}
          />
        );
      })}
    </Shell>
  );
}

/** Zonder (zekere) thuislader: batterij op het einde van elke dag, laaddagen met een bliksem. */
function ChargingWeek({ plan, onChangeCharging }) {
  const { week, charging } = plan;
  const chargeDays = week.days.filter((d) => d.charged).map((d) => DAY_NAMES[d.day]);
  const extraDays = week.days.filter((d) => d.extra).map((d) => DAY_NAMES[d.day]);
  const n = week.charges + week.extra;

  let sub = chargeDays.length ? `${week.planned ? 'Laden' : 'Voorstel: laden'} op ${listNl(chargeDays)}` : 'Geen laadbeurt nodig deze week';
  if (extraDays.length) sub += `, extra op ${listNl(extraDays)}`;

  let status = <Chip color={STATUS_COLOR.marge}>± {n}× LADEN PER WEEK</Chip>;
  if (week.enRoute) status = <Chip color={STATUS_COLOR.laadstop}>ONDERWEG LADEN NODIG</Chip>;
  else if (week.extra) status = <Chip color={STATUS_COLOR.laadstop}>{week.extra}× EXTRA LADEN</Chip>;

  const compare =
    charging === 'onbekend' ? (
      <div className="flex items-center gap-2 px-3 py-2.5 short:py-1.5 bg-surface border border-line rounded-xl">
        <span className="size-2 rounded-full shrink-0" style={{ background: plan.daily.allDaysOk ? STATUS_COLOR.haalbaar : STATUS_COLOR.marge }} aria-hidden="true" />
        <p className="text-[13.5px] short:text-[12.5px]">
          {plan.daily.allDaysOk
            ? 'Met een thuislader: elke dag haalbaar, nooit onderweg laden.'
            : 'Met een thuislader: niet elke dag zeker haalbaar, maar wel elke dag vol vertrekken.'}
        </p>
      </div>
    ) : null;

  return (
    <Shell
      header={HEADER[charging]}
      title={`${Math.round(plan.weekKm)} km · ± ${n}× laden`}
      sub={sub}
      legend={
        <>
          — LIJN = 10 % RESERVE · <IconBolt size={11} /> = LADEN
        </>
      }
      status={status}
      charging={CHARGING_TEXT[charging]}
      onChangeCharging={onChangeCharging}
      extra={compare}
    >
      {week.days.map((d) => {
        const color = d.extra ? STATUS_COLOR.laadstop : d.end < LOW_LEVEL ? STATUS_COLOR.marge : STATUS_COLOR.haalbaar;
        const strong = d.charged || d.extra;
        return (
          <Bar
            key={d.day}
            label={d.label}
            top={strong ? <IconBolt /> : pct(d.end)}
            fill={d.end}
            color={color}
            line={0.1}
            strong={strong}
            srText={`${DAY_NAMES[d.day]}: ${d.charged ? 'laden, ' : ''}${d.extra ? 'extra laden, ' : ''}${pct(d.end)} batterij op het einde van de dag.`}
          />
        );
      })}
    </Shell>
  );
}

function EmptyWeek({ onAddTrips }) {
  return (
    <div className="flex flex-col gap-3 h-full px-5 pt-3.5">
      <p className="font-mono text-[10.5px] text-muted tracking-[0.09em]">JOUW WEEK</p>
      <p className="text-[24px] font-medium leading-tight">Nog geen vaste ritten</p>
      <p className="text-[14px] text-muted">Geef bij Mijn ritten aan op welke dagen je een rit maakt. Dan toont Rangy hier je week.</p>
      <button type="button" className="self-start font-mono text-[11px] font-semibold tracking-[0.07em] underline underline-offset-2 min-h-8" onClick={onAddTrips}>
        NAAR MIJN RITTEN
      </button>
    </div>
  );
}
