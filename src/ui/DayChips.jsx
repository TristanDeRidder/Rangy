import { DAYS } from '../scenario/trips.js';

const NAMES = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

/**
 * Zeven dagknoppen (MA … ZO). Aan = zwart, uit = wit met grijze rand, zoals in het ontwerp.
 * Zichtbaar 34 px, klikvlak 44 px hoog (onzichtbare rand).
 * @param {{ value: number[], onChange: (days: number[]) => void, label: string, suggested?: number[] }} props
 *        suggested: dagen die Rangy voorstelt (stippelrand) zolang er niets gekozen is
 */
export default function DayChips({ value, onChange, label, suggested = [] }) {
  const toggle = (d) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <div className="flex justify-between" role="group" aria-label={label}>
      {DAYS.map((name, d) => {
        const on = value.includes(d);
        const hinted = !value.length && suggested.includes(d);
        return (
          <button
            key={name}
            type="button"
            aria-pressed={on}
            aria-label={`${NAMES[d]}${hinted ? ' (voorstel)' : ''}`}
            className="relative grid place-items-center size-[34px] before:absolute before:-inset-y-[5px] before:-inset-x-0.5"
            onClick={() => toggle(d)}
          >
            <span
              className={`grid place-items-center size-[34px] rounded-full border font-mono text-[10px] tracking-[0.03em] ${
                on ? 'bg-ink border-ink text-white font-semibold' : hinted ? 'bg-white border-ink border-dashed text-ink' : 'bg-white border-line text-muted'
              }`}
              aria-hidden="true"
            >
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
