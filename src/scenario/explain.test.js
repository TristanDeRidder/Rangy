import { describe, it, expect } from 'vitest';
import { speedRows, cityVsHighway, loadRows, terrainRows, carFacts } from './explain.js';

describe('cijfers voor de Uitleg', () => {
  it('sneller rijden geeft minder bereik', () => {
    const [a, b, c] = speedRows([90, 110, 130]);
    expect(a.mid).toBeGreaterThan(b.mid);
    expect(b.mid).toBeGreaterThan(c.mid);
  });

  it('bij 20 °C kom je in de stad verder dan op de snelweg, bij −5 °C ligt het dicht bij elkaar', () => {
    const [warm, cold] = cityVsHighway([20, -5]);
    expect(warm.stad.mid).toBeGreaterThan(warm.snelweg.mid * 1.15);
    expect(Math.abs(cold.stad.mid - cold.snelweg.mid)).toBeLessThan(30);
  });

  it('volle wagen kost in de stad meer dan op de snelweg', () => {
    const { extraKg, rows } = loadRows();
    expect(extraKg).toBe(380);
    expect(rows[0].lossPct).toBeGreaterThan(rows[1].lossPct);
  });

  it('terrein: vlak > glooiend > heuvelachtig', () => {
    const [v, g, h] = terrainRows();
    expect(v.snelweg.mid).toBeGreaterThan(g.snelweg.mid);
    expect(g.snelweg.mid).toBeGreaterThan(h.snelweg.mid);
  });

  it('referentiewagen: ± 470 km in de stad bij 20 °C', () => {
    const { city } = carFacts();
    expect(city.low).toBeCloseTo(470, -1);
  });
});
