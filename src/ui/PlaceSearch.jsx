import { useId, useState } from 'react';
import { searchMunicipalities, municipalityByNis } from '../route/municipalities.js';
import { IconPlace } from './icons.jsx';

/**
 * Gemeente zoeken (combobox). Zoekt in de lijst in de app zelf: wat je typt gaat niet naar buiten.
 * Pijltjes kiezen, Enter bevestigt, Escape sluit.
 * @param {{ label: string, value: number|null, onSelect: (nis: number) => void, disabled?: boolean, placeholder?: string }} props
 */
export default function PlaceSearch({ label, value, onSelect, disabled, placeholder = 'Gemeente' }) {
  const id = useId();
  const current = municipalityByNis(value);
  const [query, setQuery] = useState(null); // null = niet aan het typen, toon de gekozen gemeente
  const [active, setActive] = useState(0);
  const results = query ? searchMunicipalities(query, 6) : [];
  const open = query !== null && results.length > 0;

  const choose = (m) => {
    setQuery(null);
    onSelect(m.nis);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setQuery(null);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-[10.5px] text-muted tracking-[0.1em]">
        {label}
      </label>
      <div className={`flex items-center gap-2.5 h-11 px-3 rounded-xl border bg-surface ${disabled ? 'border-line text-muted' : 'border-ink'}`}>
        <IconPlace />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck="false"
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted"
          value={query ?? current?.name ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onFocus={(e) => e.target.select()}
          onKeyDown={onKey}
          onBlur={() => setTimeout(() => setQuery(null), 150)}
        />
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute z-20 top-full mt-1 inset-x-0 py-1 bg-surface border border-ink rounded-xl shadow-[0_6px_20px_rgb(0_0_0/0.12)]"
        >
          {results.map((m, i) => (
            <li
              key={m.nis}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`flex justify-between items-baseline gap-3 min-h-11 px-3 py-2.5 cursor-pointer ${i === active ? 'bg-[#efefef]' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // focus houden tot de keuze verwerkt is
                choose(m);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="text-[15px]">{m.name}</span>
              {m.alt?.length > 0 && <span className="font-mono text-[10.5px] text-muted truncate">{m.alt.slice(0, 2).join(' · ')}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
