import { useRef } from 'react';

/**
 * Tabs Baan · Week, als schakelaar (omlijnd, actief deel zwart): na de gebruikerstest zagen niet alle
 * gebruikers dat er een tweede tab was. Tikken op een tab of swipen over het paneel (zie useSwipe):
 * swipen is een extra, nooit de enige manier (WCAG 2.5.1). Pijltjestoetsen wisselen ook.
 * @param {{ tabs: { id: string, label: string }[], value: string, onChange: (id: string) => void, idBase: string }} props
 */
export default function Tabs({ tabs, value, onChange, idBase }) {
  const refs = useRef({});
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length];
    onChange(t.id);
    refs.current[t.id]?.focus();
  };
  return (
    <div className="flex justify-center pt-2 pb-1">
      <div role="tablist" aria-label="Weergave" className="inline-flex p-[3px] rounded-full border border-ink bg-surface" onKeyDown={onKey}>
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => (refs.current[t.id] = el)}
              type="button"
              role="tab"
              id={`${idBase}-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`${idBase}-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              className={`h-8 w-23 rounded-full font-mono text-[12px] tracking-[0.1em] transition-colors duration-200 ${
                active ? 'bg-ink text-white font-semibold' : 'text-ink'
              }`}
              onClick={() => onChange(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Horizontaal swipen over een element: links = volgende tab, rechts = vorige.
 * Alleen als de beweging duidelijk horizontaal is (minstens 40 px, meer horizontaal dan verticaal).
 * @returns {{ onPointerDown: Function, onPointerUp: Function, onPointerCancel: Function }}
 */
export function useSwipe(onLeft, onRight) {
  const start = useRef(null);
  return {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onLeft();
      else onRight();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
