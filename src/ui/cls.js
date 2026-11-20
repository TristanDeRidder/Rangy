/** Gedeelde Tailwind-klassen voor elementen die op meerdere plaatsen terugkomen. */
export const mono = 'font-mono tracking-[0.08em]';
export const eyebrow = 'font-mono text-[12px] font-normal text-muted tracking-[0.1em]';
export const card = 'bg-surface border border-line rounded-2xl';
export const roundBtn = 'size-11 rounded-full border border-line bg-surface grid place-items-center shrink-0';
export const btnPrimary = 'w-full h-12 rounded-3xl bg-ink text-white flex items-center font-mono text-[12px] font-semibold tracking-[0.12em]';
export const rangeLabel = 'absolute left-2 -translate-y-1/2 font-mono font-medium tracking-normal';
// gsm: zo breed als past in de hoogte van de size-container rond de baan (App.jsx), laptop: naar de schermhoogte
export const sceneBox = 'relative w-screen aspect-[350/307] mx-auto [container-type:inline-size] max-wide:w-[min(100%,calc(100cqh*393/350))] wide:w-[min(100%,calc((100vh-140px)*393/350))] [&_svg]:block [&_svg]:size-full [&_canvas]:block [&_canvas]:size-full';
// labels: 12 px bij de ontwerpbreedte (393 px), kleiner op een kleinere baan, nooit onder 9,5 px
export const sceneOverlay = 'absolute inset-0 pointer-events-none text-[clamp(9.5px,calc(100cqw*12/393),12px)]';
