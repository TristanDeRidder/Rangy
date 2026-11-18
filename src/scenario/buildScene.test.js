/**
 * Bewaakt dat het gevalideerde rekenmodel niet ongemerkt verandert
 * en dat 3D en SVG dezelfde scène krijgen.
 * Referentiewaarden: eigen berekening met het gekalibreerde model (zie resultaten.md).
 */
import { describe, expect, it } from 'vitest';
import { buildScene, rangeBand, tripStatus } from './buildScene.js';
import { scaleMaxKm, toT } from '../scene/shared/projection.js';

const trips = [
  { id: 'a', name: 'Woon-werk', km: 45 },
  { id: 'b', name: 'Vakantie', km: 600 },
];

describe('rekenmodel', () => {
  it('snelweg 110 km/h bij 8 °C geeft ongeveer 308–381 km', () => {
    const b = rangeBand({ tripType: 'snelweg', speedKmh: 110, tempC: 8 });
    expect(b.low).toBeCloseTo(308, -1);
    expect(b.high).toBeCloseTo(381, -1);
  });

  it('stad bij −5 °C geeft ongeveer 275–320 km', () => {
    const b = rangeBand({ tripType: 'stad', speedKmh: 110, tempC: -5 });
    expect(b.low).toBeCloseTo(275, -1);
    expect(b.high).toBeCloseTo(320, -1);
  });

  it('kou verlaagt de actieradius, sneller rijden ook', () => {
    const warm = rangeBand({ tripType: 'snelweg', speedKmh: 110, tempC: 20 });
    const cold = rangeBand({ tripType: 'snelweg', speedKmh: 110, tempC: -5 });
    const fast = rangeBand({ tripType: 'snelweg', speedKmh: 130, tempC: 20 });
    expect(cold.mid).toBeLessThan(warm.mid);
    expect(fast.mid).toBeLessThan(warm.mid);
  });
});

describe('scène', () => {
  it('geeft elke rit een status en een positie t tussen 0 en 1', () => {
    const s = buildScene({ tripType: 'snelweg', speedKmh: 110, tempC: 8, trips });
    expect(s.trips.map((t) => t.status)).toEqual(['haalbaar', 'laadstop']);
    for (const t of s.trips) {
      expect(t.t).toBeGreaterThanOrEqual(0);
      expect(t.t).toBeLessThanOrEqual(1);
    }
    expect(s.rangeT.low).toBeLessThan(s.rangeT.high);
  });

  it('reserve maakt de status strenger', () => {
    const band = { low: 300, high: 380 };
    expect(tripStatus(290, band, 0)).toBe('haalbaar');
    expect(tripStatus(290, band, 10)).toBe('marge');
  });

  it('één schaal: dezelfde afstand geeft dezelfde t', () => {
    const max = scaleMaxKm(380, [600]);
    expect(max % 100).toBe(0);
    expect(toT(340, max)).toBeCloseTo(340 / max);
  });
});
