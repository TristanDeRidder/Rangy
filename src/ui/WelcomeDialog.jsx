import { useEffect, useRef } from 'react';
import { btnPrimary } from './cls.js';

const SEEN_KEY = 'rangy.welcome';

/** Eerste bezoek? Zonder opslag (privévenster) tonen we de kaart gewoon elke keer. */
export function welcomeSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* niet bewaard: de kaart komt bij een volgend bezoek terug */
  }
}

/**
 * Welkom bij het eerste bezoek: welke wagen Rangy gebruikt en dat het een schatting is.
 * "Hoe rekent Rangy?" opent de Uitleg; de referentiewagen staat ook in de Uitleg.
 *  - gsm: paneel dat onderaan binnenschuift
 *  - laptop: kaart in het midden
 * Gebouwd op <dialog> met showModal(): focus blijft erin, Escape sluit.
 */
export default function WelcomeDialog({ open, onClose, onMore }) {
  const ref = useRef(null);
  const okRef = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      okRef.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    markSeen();
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      aria-labelledby="welkom-titel"
      aria-describedby="welkom-tekst"
      className="mx-auto mt-auto mb-0 w-full max-w-120 max-h-[calc(100dvh-32px)] p-0 rounded-t-3xl border border-line bg-surface text-ink shadow-[0_-4px_24px_rgb(0_0_0/0.12)] backdrop:bg-black/45 open:animate-sheet-up wide:m-auto wide:rounded-3xl wide:shadow-[0_8px_32px_rgb(0_0_0/0.16)] wide:open:animate-fade-in"
    >
      <div className="flex flex-col gap-4 pt-3 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] wide:p-7">
        <div className="w-9 h-1 rounded-full bg-line self-center wide:hidden" aria-hidden="true" />
        <p className="font-mono text-[11px] text-muted tracking-[0.12em]">WELKOM BIJ RANGY</p>
        <h2 id="welkom-titel" className="text-[22px] leading-[26px] font-semibold">Een eerlijke schatting, geen belofte</h2>
        <p id="welkom-tekst" className="text-[15px] leading-[21px]">
          Rangy rekent met één referentiewagen: een Tesla Model Y Standard RWD met 60 kWh bruikbare batterij. Jouw wagen,
          je rijstijl en het weer kunnen het echte bereik doen afwijken. Daarom toont Rangy een marge in plaats van één getal.
        </p>
        <button
          type="button"
          className="self-start min-h-11 font-mono text-[12px] font-semibold tracking-[0.08em] underline underline-offset-3"
          onClick={() => {
            markSeen();
            onMore();
          }}
        >
          HOE REKENT RANGY? →
        </button>
        <button ref={okRef} type="button" className={`${btnPrimary} justify-center`} onClick={close}>
          BEGREPEN
        </button>
      </div>
    </dialog>
  );
}
