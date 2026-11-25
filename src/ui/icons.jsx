/** Lijniconen uit het ontwerp. Decoratief: de knop zelf draagt het aria-label. */
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconCloud = () => (
  <svg {...base} width={16} height={16}><path {...stroke} strokeWidth={1.8} d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>
);
export const IconInfo = () => (
  <svg {...base}><circle {...stroke} strokeWidth={1.8} cx="12" cy="12" r="9" /><path {...stroke} strokeWidth={1.8} d="M12 11V16M12 8H12.01" /></svg>
);
export const IconArrow = () => (
  <svg {...base}><path {...stroke} d="M5 12H19M13 6L19 12L13 18" /></svg>
);
export const IconBack = () => (
  <svg {...base}><path {...stroke} d="M15 18L9 12L15 6" /></svg>
);
export const IconClose = () => (
  <svg {...base}><path {...stroke} d="M6 6L18 18M18 6L6 18" /></svg>
);
export const IconChevronUp = () => (
  <svg {...base}><path {...stroke} d="M6 15L12 9L18 15" /></svg>
);
export const IconChevronDown = () => (
  <svg {...base}><path {...stroke} d="M6 9L12 15L18 9" /></svg>
);
export const IconLock = () => (
  <svg {...base} width={16} height={16}><rect {...stroke} strokeWidth={1.8} x="5" y="11" width="14" height="10" rx="2" /><path {...stroke} strokeWidth={1.8} d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconPin = () => (
  <svg {...base} width={16} height={16}><path {...stroke} strokeWidth={1.8} d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" /><circle {...stroke} strokeWidth={1.8} cx="12" cy="9.5" r="2.5" /></svg>
);
/** Laden (bliksem), uit het ontwerp (icon/laden). */
export const IconBolt = ({ size = 14, title }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
    {title && <title>{title}</title>}
    <path d="M8.16667 0.583008L1.75 8.16634H6.41667L5.25 13.4163L12.25 5.24967H7.58333L8.16667 0.583008Z" fill="#FF7A3D" />
  </svg>
);
/**
 * Windrichting: pijl in de richting waarin de wind waait (uit het ontwerp, icon/windrichting).
 * `toDeg` = waarheen de wind waait, 0 = noord, 90 = oost.
 */
export const IconWind = ({ toDeg = 0 }) => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ transform: `rotate(${toDeg - 45}deg)` }}>
    <path d="M6.3638 13.4347L13.4349 6.36358M13.4349 12.0204V6.36358H7.77802" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/** Plaats (in invulvelden voor een gemeente), uit het ontwerp. */
export const IconPlace = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 14.5C8 14.5 13 10 13 6.5C13 3.7 10.8 1.5 8 1.5C5.2 1.5 3 3.7 3 6.5C3 10 8 14.5 8 14.5Z" strokeWidth="1.3" stroke="currentColor" />
    <path d="M9.79995 6.5002C9.79995 7.49431 8.99406 8.3002 7.99995 8.3002C7.00584 8.3002 6.19995 7.49431 6.19995 6.5002C6.19995 5.50608 7.00584 4.7002 7.99995 4.7002C8.99406 4.7002 9.79995 5.50608 9.79995 6.5002Z" strokeWidth="1.3" stroke="currentColor" />
  </svg>
);
/** Kleine pijl voor uitklapbare blokken (16 px), uit het ontwerp. */
export const IconChevron16 = ({ up }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d={up ? 'M3 10L8 5L13 10' : 'M3 6L8 11L13 6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
  </svg>
);
