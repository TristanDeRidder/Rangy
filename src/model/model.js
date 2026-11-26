/**
 * Rekenmodel actieradius – Tesla Model Y RWD (Juniper)
 *
 * Fysisch model voor het energieverbruik bij constante snelheid,
 * met de drie projectvariabelen: snelheid, temperatuur en terrein.
 *
 * Elke parameter heeft een bron of is gemarkeerd als:
 *   [gemeten]      – rechtstreeks uit een meting of officiële bron
 *   [literatuur]   – overgenomen uit onderzoek
 *   [berekend]     – eigen berekening op basis van bronnen
 *   [gekalibreerd] – afgestemd op meetpunten (zie calibrate.mjs)
 *
 * Geen afhankelijkheden: werkt in de browser (R3F) en in Node.
 */

export const G = 9.81; // m/s²
const R_AIR = 287.05; // J/(kg·K), specifieke gasconstante droge lucht
const P_ATM = 101325; // Pa, luchtdruk op zeeniveau
const T_REF = 23; // °C, referentietemperatuur (EV Database "mild")

/** Standaardparameters. CdA, crr en heatWPerDeg worden overschreven door de kalibratie. */
export const DEFAULT_VEHICLE = {
  // Voertuig
  massKg: 1906, // [gemeten] rijklaar gewicht, Tesla (z.d.)
  driverKg: 75, // [literatuur] standaardmassa bestuurder, Verordening (EU) 1230/2012
  usableKWh: 60, // [gemeten*] geschatte bruikbare capaciteit, EV Database (z.d.)

  // Rijweerstand
  cdA: 0.483, // [gekalibreerd] m², luchtweerstandsoppervlakte (Cd × A)
  crr: 0.0083, // [gekalibreerd] rolweerstandscoëfficiënt

  // Aandrijving
  etaDrive: 0.85, // [literatuur] rendement batterij → wiel, 15–20% verlies (DOE & EPA, z.d.)
  etaRegen: 0.85, // [literatuur] terugwinning bergaf, gemiddeld 86,7% (Armenta-Déu & Cortés, 2023)
  etaRegenBraking: 0.601, // [literatuur] terugwinning bij remmen in de stad, gemiddeld 60,1% (Armenta-Déu & Cortés, 2023)
  baseW: 300, // [literatuur] basisverbruik elektronica, orde van grootte (Carlson, 2015)

  // Temperatuur
  heatBelowC: 20, // [literatuur] onder 20 °C wordt verwarmd (Argue, 2023)
  coolAboveC: 22, // [literatuur] boven 22 °C wordt gekoeld (Argue, 2023)
  heatWPerDeg: 60, // [gekalibreerd] W per °C onder heatBelowC
  coolWPerDeg: 74.7, // [berekend] 4,16 kW koeling / COP 3,48 ≈ 1,2 kW bij 38 °C (Li et al., 2021)
  capLossPerDeg: 0.068 / 32, // [berekend] −6,8% capaciteit bij −7 °C t.o.v. 25 °C (Zhao et al., 2022)
  etaLossPerDeg: 0.043 / 32, // [berekend] −4,3% rendement aandrijving bij −7 °C (Zhao et al., 2022)
};

/** Luchtdichtheid (kg/m³) via de ideale gaswet. */
export function airDensity(tempC) {
  return P_ATM / (R_AIR * (tempC + 273.15));
}

/** Bovengrens van de aanstroomhoek (rad) voor de toename van de luchtweerstand bij zijwind [eigen aanname]. */
const MAX_YAW = (20 * Math.PI) / 180;

/**
 * Luchtweerstand in de rijrichting (N).
 * Zonder wind: ½ · ρ · CdA · v².
 * Met wind rekent de formule met de luchtsnelheid t.o.v. de auto (rijsnelheid + tegenwind, plus zijwind)
 * en een hogere weerstand als de lucht schuin aanstroomt (Askerdal et al., 2024).
 * @param {number} rho     luchtdichtheid (kg/m³)
 * @param {number} cdA     m²
 * @param {number} v       rijsnelheid (m/s)
 * @param {{ headMs?: number, crossMs?: number, yawCoeff?: number } | null} [wind]
 *        headMs  tegenwind (positief) of rugwind (negatief) op de hoogte van de auto, m/s
 *        crossMs zijwind op de hoogte van de auto, m/s
 *        yawCoeff toename van de weerstand per rad² aanstroomhoek
 */
export function aeroForce(rho, cdA, v, wind = null) {
  if (!wind) return 0.5 * rho * cdA * v * v;
  const ax = v + (wind.headMs ?? 0);
  const ay = Math.abs(wind.crossMs ?? 0);
  const yaw = Math.min(MAX_YAW, Math.atan2(ay, Math.abs(ax)));
  const cx = 1 + (wind.yawCoeff ?? 0) * yaw * yaw;
  return 0.5 * rho * cdA * cx * (ax * ax + ay * ay) * Math.sign(ax);
}

/** Fractie van de bruikbare batterijcapaciteit die beschikbaar is (1 bij ≥ 23 °C). */
export function capacityFactor(tempC, veh = DEFAULT_VEHICLE) {
  return Math.max(0, 1 - veh.capLossPerDeg * Math.max(0, T_REF - tempC));
}

/** Rendement van de aandrijving bij een gegeven temperatuur. */
export function driveEfficiency(tempC, veh = DEFAULT_VEHICLE) {
  return veh.etaDrive * (1 - veh.etaLossPerDeg * Math.max(0, T_REF - tempC));
}

/** Vermogen voor verwarming of airco (W). */
export function hvacPower(tempC, veh = DEFAULT_VEHICLE) {
  if (tempC < veh.heatBelowC) return veh.heatWPerDeg * (veh.heatBelowC - tempC);
  if (tempC > veh.coolAboveC) return veh.coolWPerDeg * (tempC - veh.coolAboveC);
  return 0;
}

/**
 * Vermogens bij constante snelheid.
 * @param {object} o
 * @param {number} o.speedKmh
 * @param {number} [o.tempC=23]
 * @param {number} [o.gradePct=0]   helling in % (positief = bergop)
 * @param {number} [o.extraKg=0]    passagiers en bagage
 * @param {boolean} [o.hvac=true]   verwarming/airco aan
 * @param {object|null} [o.wind]    wind op de hoogte van de auto (zie aeroForce)
 */
export function powerBreakdown(o, veh = DEFAULT_VEHICLE) {
  const { speedKmh, tempC = T_REF, gradePct = 0, extraKg = 0, hvac = true, wind = null } = o;
  const v = speedKmh / 3.6;
  const m = veh.massKg + veh.driverKg + extraKg;
  const theta = Math.atan(gradePct / 100);

  const fRoll = veh.crr * m * G * Math.cos(theta);
  const fAero = aeroForce(airDensity(tempC), veh.cdA, v, wind);
  const fGrade = m * G * Math.sin(theta);
  const fTotal = fRoll + fAero + fGrade;

  const eta = driveEfficiency(tempC, veh);
  // Positieve kracht: batterij levert. Negatieve kracht: overschot wordt (deels) teruggewonnen.
  const pTraction = fTotal >= 0 ? (fTotal * v) / eta : fTotal * v * veh.etaRegen;

  const pHvac = hvac ? hvacPower(tempC, veh) : 0;
  return {
    // Vermogen aan de batterijzijde per component (W)
    roll: (fRoll * v) / eta,
    aero: (fAero * v) / eta,
    grade: fTotal >= 0 ? (fGrade * v) / eta : null, // niet zinvol op te splitsen bij terugwinning
    traction: pTraction,
    base: veh.baseW,
    hvac: pHvac,
    total: pTraction + veh.baseW + pHvac,
    regenerating: fTotal < 0,
  };
}

/** Verbruik uit de batterij (Wh/km). */
export function consumptionWhPerKm(o, veh = DEFAULT_VEHICLE) {
  const p = powerBreakdown(o, veh).total;
  return p / (o.speedKmh / 3.6) / 3.6; // W / (m/s) = J/m → ×1000/3600 = Wh/km
}

/**
 * "Effectief" verbruik: verbruik gedeeld door de capaciteitsfactor.
 * Zo rekent EV Database: actieradius = 60 kWh / verbruik, ook bij kou.
 */
export function effectiveConsumptionWhPerKm(o, veh = DEFAULT_VEHICLE) {
  return consumptionWhPerKm(o, veh) / capacityFactor(o.tempC ?? T_REF, veh);
}

/** Actieradius (km) bij constante omstandigheden op vlakke weg of vaste helling. */
export function rangeKm(o, veh = DEFAULT_VEHICLE) {
  const wh = consumptionWhPerKm(o, veh);
  if (wh <= 0) return Infinity;
  return (veh.usableKWh * 1000 * capacityFactor(o.tempC ?? T_REF, veh)) / wh;
}

/**
 * Rijcyclus seconde per seconde doorrekenen, inclusief optrekken en remmen.
 * Bij vertragen wordt de vrijkomende energie teruggewonnen met etaRegenBraking.
 * @param {number[]} speedsKmh  snelheid per tijdstap (km/h)
 * @param {{tempC?:number, extraKg?:number, hvac?:boolean, gradePct?:number, dt?:number, wind?:object|null}} conditions
 * @returns {{distanceKm:number, energyWh:number, whPerKm:number, avgKmh:number}}
 */
export function simulateCycle(speedsKmh, conditions = {}, veh = DEFAULT_VEHICLE) {
  const { tempC = T_REF, extraKg = 0, hvac = true, gradePct = 0, dt = 1, wind = null } = conditions;
  const m = veh.massKg + veh.driverKg + extraKg;
  const rho = airDensity(tempC);
  const eta = driveEfficiency(tempC, veh);
  const theta = Math.atan(gradePct / 100);
  const pAux = veh.baseW + (hvac ? hvacPower(tempC, veh) : 0);

  let energyJ = 0;
  let distanceM = 0;
  for (let i = 0; i < speedsKmh.length - 1; i++) {
    const v0 = speedsKmh[i] / 3.6;
    const v1 = speedsKmh[i + 1] / 3.6;
    const v = (v0 + v1) / 2; // gemiddelde snelheid over de tijdstap
    const a = (v1 - v0) / dt;
    const moving = v > 0.01;
    const f = (moving ? veh.crr * m * G * Math.cos(theta) + m * G * Math.sin(theta) : 0)
      + (moving || !wind ? aeroForce(rho, veh.cdA, v, wind) : 0) // stilstaan: wind duwt niet tegen de remmen in
      + m * a;
    const pWheel = f * v;
    const pBatt = pWheel >= 0 ? pWheel / eta : pWheel * veh.etaRegenBraking;
    energyJ += (pBatt + pAux) * dt;
    distanceM += v * dt;
  }
  const distanceKm = distanceM / 1000;
  const energyWh = energyJ / 3600;
  return { distanceKm, energyWh, whPerKm: energyWh / distanceKm, avgKmh: distanceKm / ((speedsKmh.length - 1) * dt / 3600) };
}

/**
 * Energie over een route met segmenten.
 * @param {{distanceKm:number, gradePct?:number, speedKmh:number}[]} segments
 * @param {{tempC?:number, extraKg?:number, hvac?:boolean}} conditions
 * @returns {{totalWh:number, perSegment:number[], availableWh:number, remainingPct:number}}
 */
export function routeEnergy(segments, conditions = {}, veh = DEFAULT_VEHICLE) {
  const perSegment = segments.map(
    (s) => consumptionWhPerKm({ ...conditions, ...s }, veh) * s.distanceKm,
  );
  const totalWh = perSegment.reduce((a, b) => a + b, 0);
  const availableWh = veh.usableKWh * 1000 * capacityFactor(conditions.tempC ?? T_REF, veh);
  return { totalWh, perSegment, availableWh, remainingPct: 100 * (1 - totalWh / availableWh) };
}
