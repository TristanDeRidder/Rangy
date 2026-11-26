/**
 * Wind: van het weerbericht naar tegenwind en zijwind op de hoogte van de auto.
 *
 * Methode (natuurkunde, afgesteld op metingen):
 *  - de luchtweerstand rekent met de luchtsnelheid t.o.v. de auto (zie aeroForce in model.js)
 *  - wind wordt op 10 m hoogte gemeten en is bij de grond zwakker: GROUND_FACTOR
 *  - lucht die schuin aanstroomt geeft meer weerstand: YAW_COEFF (Askerdal et al., 2024)
 *  - GROUND_FACTOR en YAW_COEFF zijn afgesteld op rijdata van Tesla Model 3's bij 100–120 km/u
 *    (Bäcker, 2021): 10 m/s tegenwind = +19 %, 10 m/s zijwind = +8 %
 *  - volgens de natuurkunde helpt 10 m/s rugwind dan −16,5 %, gemeten is maar −6 %.
 *    Dat verschil is de marge: slechtste geval rugwind × TAIL_WORST, beste geval volle natuurkunde.
 *
 * Uitzetten: WIND_ENABLED = false, of `useWind: false` / `wind: null` meegeven aan buildPlan.
 */

/** Wind meerekenen in het model (schakelaar voor de hele app). */
export const WIND_ENABLED = true;

/**
 * [gekalibreerd] Deel van de gemeten wind (10 m) dat de auto voelt.
 * Ter vergelijking: de power law met exponent 1/7 (open land) geeft ± 0,72 op 1 m hoogte;
 * bij ruwer terrein (bomen, gebouwen) ligt de factor lager.
 */
export const GROUND_FACTOR = 0.43;
/** [gekalibreerd] Toename van de luchtweerstand per rad² aanstroomhoek (± +10 % bij 8°). */
export const YAW_COEFF = 5.4;
/** [gekalibreerd] Slechtste geval: rugwind helpt maar 35 % van wat de natuurkunde geeft. */
export const TAIL_WORST = 0.35;

/** Windrichtingen voor het gemiddelde als de rijrichting niet gekend is (0° = recht tegen, 180° = recht mee). */
const AVG_STEP = 15;
const AVG_ANGLES = Array.from({ length: 180 / AVG_STEP + 1 }, (_, i) => i * AVG_STEP);
// trapeziumregel over 0–180° (180–360° is gespiegeld: zelfde tegen- en zijwind)
const AVG_WEIGHTS = AVG_ANGLES.map((_, i, a) => (i === 0 || i === a.length - 1 ? 0.5 : 1) / (a.length - 1));

const rad = (deg) => (deg * Math.PI) / 180;

/**
 * Wind uit het weerbericht opschonen.
 * @param {{ speedMs?: number, fromDeg?: number } | null | undefined} w
 *        speedMs  windsnelheid op 10 m (m/s), zoals `wind_speed` van API Ninjas
 *        fromDeg  richting waar de wind vandaan komt, 0 = noord, 90 = oost (zoals `wind_degrees`, nagegaan)
 * @returns {{ speedMs: number, fromDeg: number } | null}  null = geen wind
 */
export function normalizeWind(w) {
  const speedMs = Number(w?.speedMs);
  if (!w || !Number.isFinite(speedMs) || speedMs <= 0) return null;
  const fromDeg = (((Number(w.fromDeg) || 0) % 360) + 360) % 360;
  return { speedMs, fromDeg };
}

/**
 * Tegen- en zijwind (op 10 m) voor een rijrichting.
 * @param {number} bearingDeg  rijrichting, 0 = noord, 90 = oost
 * @param {{ speedMs: number, fromDeg: number }} wind
 * @returns {{ head: number, cross: number }}  head > 0 = tegenwind, < 0 = rugwind
 */
export function relativeWind(bearingDeg, wind) {
  const a = rad(wind.fromDeg - bearingDeg);
  return { head: wind.speedMs * Math.cos(a), cross: Math.abs(wind.speedMs * Math.sin(a)) };
}

/**
 * Omzetten naar wind op de hoogte van de auto, zoals aeroForce in model.js die verwacht.
 * @param {{ head: number, cross: number }} rel
 * @param {'worst'|'best'} kase
 */
export function atVehicle(rel, kase) {
  const head = rel.head < 0 && kase === 'worst' ? rel.head * TAIL_WORST : rel.head;
  return { headMs: GROUND_FACTOR * head, crossMs: GROUND_FACTOR * rel.cross, yawCoeff: YAW_COEFF };
}

/**
 * Gemiddelde over alle windrichtingen t.o.v. de rijrichting, voor ritten zonder route.
 * @param {(rel: {head:number, cross:number}) => number} fn  bv. verbruik bij die wind
 * @param {number} speedMs
 */
export function averageOverDirections(fn, speedMs) {
  return AVG_ANGLES.reduce((s, deg, i) => {
    const a = rad(deg);
    return s + AVG_WEIGHTS[i] * fn({ head: speedMs * Math.cos(a), cross: Math.abs(speedMs * Math.sin(a)) });
  }, 0);
}
