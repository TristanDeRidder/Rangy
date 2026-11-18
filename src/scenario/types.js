/**
 * Het contract tussen het rekenmodel en de weergave.
 * De 3D-scène, de SVG-scène en de 2D-laag lezen ALLEEN dit object.
 * Ze rekenen zelf niets: zo tonen beide weergaven altijd dezelfde cijfers.
 *
 * @typedef {'stad' | 'snelweg'} TripType
 * @typedef {'haalbaar' | 'marge' | 'laadstop'} TripStatus
 *
 * @typedef {Object} Inputs
 * @property {TripType} tripType
 * @property {number} speedKmh        snelheid op de snelweg (wordt genegeerd in de stad)
 * @property {number} tempC           buitentemperatuur
 * @property {{ id: string, name: string, km: number }[]} trips  eigen ritten
 * @property {number} [reservePct]    reserve bij aankomst in % (open ontwerpkeuze, standaard 0)
 *
 * @typedef {Object} SceneTrip
 * @property {string} id
 * @property {string} name
 * @property {number} km
 * @property {TripStatus} status
 * @property {number} t               positie op de baan, 0 = auto, 1 = einde van de schaal
 *
 * @typedef {Object} Scene
 * @property {Inputs} inputs
 * @property {{ low: number, high: number, mid: number }} rangeKm  bandbreedte (twee varianten verwarming)
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
