/**
 * Kiest tussen 3D en SVG.
 *  - ?view=svg of ?view=3d in de URL wint altijd (handig voor de A/B-test)
 *  - anders: SVG wanneer het toestel geen WebGL heeft
 *  - anders: de standaard (DEFAULT_VIEW). Schrap je later 3D, zet dit dan op 'svg'.
 */
export const DEFAULT_VIEW = 'svg';

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** @returns {'3d' | 'svg'} */
export function getViewMode() {
  let fromUrl = null;
  try {
    fromUrl = new URLSearchParams(window.location.search).get('view');
  } catch {
    /* geen URL beschikbaar (bv. in tests) */
  }
  if (fromUrl === 'svg') return 'svg';
  if (fromUrl === '3d') return supportsWebGL() ? '3d' : 'svg';
  return DEFAULT_VIEW === '3d' && supportsWebGL() ? '3d' : 'svg';
}
