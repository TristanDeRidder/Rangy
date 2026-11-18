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
