/**
 * Eén schaal voor afstanden op de baan.
 * t = 0 bij de auto, t = 1 aan het einde van de schaal; de SVG zet t om naar een y-positie in perspectief.
 */

/** Lengte van de schaal: ruim genoeg voor het bereik en de verste rit, afgerond op 100 km. */
export function scaleMaxKm(highKm, tripKms = []) {
  const far = Math.max(highKm * 1.25, ...tripKms.map((k) => k * 1.1), 300);
  return Math.ceil(far / 100) * 100;
}

export function toT(km, maxKm) {
  return Math.min(1, Math.max(0, km / maxKm));
}

/**
 * Perspectief van de baan: verder weg = dichter bij de horizon.
 * Geeft de y-positie (0 = horizon, 1 = onderrand) voor een t.
 */
export const PERSPECTIVE_K = 4;
export function perspectiveY(t) {
  return 1 / (1 + PERSPECTIVE_K * t);
}
