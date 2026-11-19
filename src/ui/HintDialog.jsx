import { useEffect, useRef, useState } from 'react';
import { topicById } from './explain/topics.jsx';
import { IconArrow, IconClose } from './icons.jsx';

/** "?" naast een omstandigheid. Zichtbaar 20 px, klikvlak 44 px. */
export function HintButton({ topic, onHint }) {
  const t = topicById(topic);
  return (
    <button
      type="button"
      className="relative -my-3 size-11 -mx-3 grid place-items-center"
      onClick={() => onHint(topic)}
      aria-haspopup="dialog"
      aria-label={`Uitleg over ${t.title.toLowerCase()}`}
    >
      <span className="size-5 rounded-full bg-[#efefef] grid place-items-center font-mono text-[11px] font-semibold" aria-hidden="true">?</span>
    </button>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Korte uitleg bij een "?", met video als die er is.
 * Video: kort, zonder geluid, in een lus. Bij "minder beweging" speelt ze niet vanzelf af.
 * "Meer uitleg" opent het onderwerp op de Uitleg-pagina.
 */
export default function HintDialog({ topic, onClose, onMore }) {
  const ref = useRef(null);
  const t = topic && topicById(topic);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (t && !d.open) d.showModal();
    if (!t && d.open) d.close();
  }, [t]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="hint-titel"
      className="mx-auto mt-auto mb-0 w-full max-w-120 max-h-[calc(100dvh-32px)] p-0 rounded-t-3xl border border-line bg-surface text-ink shadow-[0_-4px_24px_rgb(0_0_0/0.12)] backdrop:bg-black/45 open:animate-sheet-up wide:m-auto wide:max-w-100 wide:rounded-2xl wide:shadow-[0_8px_32px_rgb(0_0_0/0.16)] wide:open:animate-fade-in"
    >
      {t && (
        <div className="flex flex-col gap-4 pt-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] wide:p-6">
          <div className="w-9 h-1 rounded-full bg-line self-center wide:hidden" aria-hidden="true" />
          <div className="flex justify-between items-center">
            <h2 id="hint-titel" className="font-mono text-[13px] font-semibold tracking-[0.12em]">{t.title.toUpperCase()}</h2>
            <button type="button" className="size-11 -mr-1.5 grid place-items-center" onClick={onClose} aria-label="Sluiten">
              <span className="size-9 rounded-full bg-[#efefef] grid place-items-center" aria-hidden="true"><IconClose /></span>
            </button>
          </div>
          {t.video && (
            <video
              key={t.video}
              className="w-full aspect-video rounded-xl bg-[#212428] object-cover"
              src={t.video}
              muted
              loop
              playsInline
              preload="metadata"
              autoPlay={!reduced}
              controls={reduced}
              aria-hidden="true"
            />
          )}
          <p className="text-[15px] leading-[22px]">{t.short}</p>
          <button
            type="button"
            className="h-12 px-5 rounded-3xl border border-ink bg-surface flex items-center justify-between font-mono text-[12px] font-semibold tracking-[0.12em]"
            onClick={() => onMore(t.id)}
          >
            MEER UITLEG <IconArrow />
          </button>
        </div>
      )}
    </dialog>
  );
}
