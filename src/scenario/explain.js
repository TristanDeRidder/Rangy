/**
 * Cijfers voor de Uitleg-pagina. Telkens één factor veranderen, de rest gelijk houden:
 * 20 °C, vlak, geen lading, snelweg 110 km/h. Pure functies op het rekenmodel (eigen berekening).
 */
import { rangeBand, extraKgOf } from './buildScene.js';
import { cityWinter } from './winter.js';

export const BASE = { tripType: 'snelweg', speedKmh: 110, tempC: 20, terrain: 'vlak', passengers: 0, bags: 0 };

const band = (over) => rangeBand({ ...BASE, ...over });

/** Snelweg bij verschillende snelheden. */
export function speedRows(speeds = [90, 110, 130]) {
  return speeds.map((speedKmh) => ({ speedKmh, ...band({ speedKmh }) }));
}

/** Stad tegenover snelweg, bij een zachte en een koude dag. */
export function cityVsHighway(temps = [20, -5], speedKmh = 110) {
  return temps.map((tempC) => ({
    tempC,
    stad: band({ tripType: 'stad', tempC }),
    snelweg: band({ tripType: 'snelweg', tempC, speedKmh }),
  }));
}

/** Volle wagen tegenover enkel de bestuurder, in de stad en op de snelweg. */
export function loadRows(full = { passengers: 4, bags: 4 }) {
  return {
    extraKg: extraKgOf(full),
    rows: ['stad', 'snelweg'].map((tripType) => {
      const empty = band({ tripType });
      const loaded = band({ tripType, ...full });
      return { tripType, empty, loaded, lossPct: (1 - loaded.mid / empty.mid) * 100 };
    }),
  };
}

/** Elk terrein, in de stad en op de snelweg. */
export function terrainRows(terrains = ['vlak', 'glooiend', 'heuvelachtig']) {
  return terrains.map((terrain) => ({
    terrain,
    stad: band({ tripType: 'stad', terrain }),
    snelweg: band({ tripType: 'snelweg', terrain }),
  }));
}

/** Kerncijfers van de referentiewagen bij 20 °C. */
export function carFacts() {
  return { city: cityWinter().warm, highway: band({}) };
}
