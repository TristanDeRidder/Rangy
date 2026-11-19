import { useEffect, useRef } from 'react';
import { IconBack, IconClose } from './icons.jsx';
import { roundBtn } from './cls.js';

/**
 * Paneel voor "Mijn ritten" en "Uitleg".
 *  - gsm: volledig scherm dat van rechts binnenschuift, met terugknop links
 *  - laptop: zijpaneel rechts over de baan, met sluitknop rechts
 * `onBack` (optioneel): een niveau terug binnen het paneel, bv. van een onderwerp naar het overzicht.
 * `kicker` (optioneel): kleine regel boven de titel, bv. "UITLEG".
 * `page`: verandert die, dan springt de inhoud naar boven en krijgt de titel de focus.
 * Gesloten panelen zijn `inert`: niet bereikbaar met toetsenbord of schermlezer.
 */
export default function Panel({ title, kicker, open, onClose, onBack, page, wide, children, footer }) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const bodyRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.inert = !open;
    if (open) closeRef.current?.focus();
  }, [open]);

  // andere pagina binnen hetzelfde paneel
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    if (open) titleRef.current?.focus();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const closeBtn = (
    <button ref={closeRef} type="button" className={roundBtn} onClick={wide ? onClose : onBack ?? onClose} aria-label={wide ? 'Sluiten' : 'Terug'}>
      {wide ? <IconClose /> : <IconBack />}
    </button>
  );
  const backBtn = wide && onBack && (
    <button type="button" className={roundBtn} onClick={onBack} aria-label="Terug">
      <IconBack />
    </button>
  );

  return (
    <aside
      ref={ref}
      className={`fixed inset-0 z-10 flex flex-col bg-linear-to-b from-bg-top to-bg-bottom wide:left-auto wide:w-[440px] wide:bg-none wide:bg-surface wide:border-l wide:border-line wide:shadow-[-8px_0_32px_rgb(0_0_0/0.1)] ${
        open
          ? 'visible translate-x-0 [transition:translate_350ms_var(--ease-soft)]'
          : 'invisible translate-x-full [transition:translate_350ms_var(--ease-soft),visibility_0s_linear_350ms]'
      }`}
      aria-label={title} aria-hidden={!open}>
      <header className={`flex items-center gap-3 ${wide ? 'justify-between pt-7 pr-6 pl-8' : 'pt-5 pr-5 pl-4'}`}>
        {!wide && closeBtn}
        {backBtn}
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          {kicker && <span className="font-mono text-[10.5px] text-muted tracking-[0.1em]">{kicker.toUpperCase()}</span>}
          <h2 ref={titleRef} tabIndex={-1} className="font-mono text-[13px] font-semibold tracking-[0.12em] outline-none">{title.toUpperCase()}</h2>
        </div>
        {wide && closeBtn}
      </header>
      <div ref={bodyRef} className="flex-1 overflow-y-auto pt-[18px] px-5 pb-5 wide:px-8 flex flex-col gap-3.5">{children}</div>
      {footer && <footer className="pt-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] wide:px-8 flex flex-col gap-3">{footer}</footer>}
    </aside>
  );
}
