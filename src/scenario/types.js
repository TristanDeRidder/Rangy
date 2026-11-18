/**
 * Het contract tussen het rekenmodel en de weergave.
 * De 3D-scène, de SVG-scène en de 2D-laag lezen ALLEEN dit object.
 * Ze rekenen zelf niets: zo tonen beide weergaven altijd dezelfde cijfers.
 *
 * @typedef {'stad' | 'snelweg'} TripType
 * @typedef {'haalbaar' | 'marge' | 'laadstop'} TripStatus
 * @typedef {'vlak' | 'glooiend' | 'heuvelachtig'} Terrain
 *
 * @typedef {Object} Inputs
 * @property {TripType} tripType      welk bereik de baan toont
 * @property {number} speedKmh        snelheid op de snelweg (wordt genegeerd in de stad)
 * @property {number} tempC           buitentemperatuur
 * @property {Terrain} [terrain]      afwisselend bergop en bergaf (standaard vlak)
 * @property {number} [passengers]    passagiers naast de bestuurder (75 kg per persoon)
 * @property {number} [bags]          stuks bagage (20 kg per stuk)
 * @property {{ id: string, name: string, km: number, type?: TripType }[]} trips  eigen ritten, elk met een eigen type
 * @property {number} [reservePct]    reserve bij aankomst in % (open ontwerpkeuze, standaard 0)
 *
 * @typedef {Object} SceneTrip
 * @property {string} id
 * @property {string} name
 * @property {number} km
 * @property {TripType} type
 * @property {boolean} dim            ander type dan wat de baan toont: gedimd tonen
 * @property {TripStatus} status      berekend met het bereik van het eigen type
 * @property {number} t               positie op de baan, 0 = auto, 1 = einde van de schaal
 *
 * @typedef {Object} Scene
 * @property {Inputs} inputs
 * @property {{ low: number, high: number, mid: number }} rangeKm  bandbreedte voor tripType (twee varianten verwarming)
 * @property {Record<TripType, { low: number, high: number, mid: number }>} bands  bandbreedte per type
 * @property {number} extraKg         lading bovenop wagen en bestuurder
 * @property {{ low: number, high: number }} rangeT                dezelfde grenzen als positie op de baan
 * @property {number} maxKm           lengte van de schaal (bepaalt t)
 * @property {SceneTrip[]} trips
 * @property {{ aero: number, roll: number, grade: number, hvac: number, base: number }} forces
 *           aandeel van elk verbruik in het totaal (0–1), voor pijlen en uitleg
 * @property {number} whPerKm         verbruik (variant literatuur)
 * @property {boolean} heating        verwarming staat aan
 * @property {boolean} cooling        airco staat aan
 */

export {};
