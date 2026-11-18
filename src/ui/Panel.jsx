import { useEffect, useRef } from 'react';
import { IconBack, IconClose } from './icons.jsx';

/**
 * Paneel voor "Mijn ritten" en "Uitleg winter".
 *  - gsm: volledig scherm dat van rechts binnenschuift, met terugknop links
 *  - laptop: zijpaneel rechts over de baan, met sluitknop rechts
 * Gesloten panelen zijn `inert`: niet bereikbaar met toetsenbord of schermlezer.
 */
export default function Panel({ title, open, onClose, wide, children, footer }) {
  const ref = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.inert = !open;
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const closeBtn = (
    <button ref={closeRef} type="button" className="round-btn" onClick={onClose} aria-label={wide ? 'Sluiten' : 'Terug'}>
      {wide ? <IconClose /> : <IconBack />}
    </button>
  );

  return (
    <aside ref={ref} className={`panel ${open ? 'panel--open' : ''}`} aria-label={title} aria-hidden={!open}>
      <header className={`panel__head ${wide ? 'panel__head--side' : ''}`}>
        {!wide && closeBtn}
        <h2 className="panel__title mono">{title.toUpperCase()}</h2>
        {wide && closeBtn}
      </header>
      <div className="panel__body">{children}</div>
      {footer && <footer className="panel__foot">{footer}</footer>}
    </aside>
  );
}
