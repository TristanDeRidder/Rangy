/**
 * Het contract tussen het rekenmodel en de weergave.
 * De baan (SVG) en de interface lezen ALLEEN dit object.
 * Ze rekenen zelf niets: zo tonen ze altijd dezelfde cijfers.
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

/* ---------- Rekenmodel v2 (scenario/plan.js) ---------- */

/**
 * @typedef {{ kom: number, expres: number, snel: number }} RoadMix  aandeel per soort weg, som = 1
 * @typedef {'ja' | 'nee' | 'onbekend'} Charging  thuis of op het werk laden
 *
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} name
 * @property {number} km                    afstand voor één richting
 * @property {boolean} roundTrip            heen en terug op dezelfde dag
 * @property {number[]} days                0 = maandag … 6 = zondag; leeg = af en toe
 * @property {RoadMix} mix                  uit de route, of de standaardmix
 * @property {string|null} dest             bestemming (gemeente) of null
 * @property {RouteSegment[]|null} segments  route in stukken (heenrit), of null zonder route
 * @property {{ passengers: number, bags: number }} load  lading voor deze rit
 *
 * @typedef {{ road: 'kom'|'expres'|'snel', km: number, bearingDeg: number|null, limitKmh: number|null }} RouteSegment
 *           bearingDeg = rijrichting, 0 = noord, 90 = oost; limitKmh = snelheidslimiet uit de route (expresweg)
 *
 * @typedef {{ speedMs: number, fromDeg: number }} Wind  op 10 m hoogte, fromDeg = waar de wind vandaan komt
 *
 * @typedef {Object} Situation
 * @property {string|null} home             thuisgemeente
 * @property {Charging} charging
 * @property {number[]} chargeDays          eigen laaddagen zonder thuislader; leeg = Rangy stelt voor
 * @property {boolean} preheat              voorverwarmen aan de lader (enkel bij charging = 'ja')
 *
 * @typedef {{ worst: number, best: number }} Share  deel van een volle batterij (0–1)
 *
 * @typedef {Object} Plan
 * @property {Trip[]} trips
 * @property {RoadMix} mix                  eigen mix over de week (het grote getal)
 * @property {{ low:number, high:number, mid:number, safe:number }} rangeKm  safe = zeker min 10 % reserve
 * @property {{ safe:number, low:number, high:number }} rangeT
 * @property {number} maxKm
 * @property {{ day:number, label:string, km:number, trips:string[], share:Share, status:TripStatus|null }[]} days
 * @property {Plan['days'][number] | null} busiest
 * @property {number} weekKm
 * @property {{ id:string, name:string, distanceKm:number, share:Share, status:TripStatus }[]} occasional
 * @property {{ id:string, name:string, distanceKm:number, status:TripStatus, t:number }[]} markers  voor de baan
 * @property {Object<string, { distanceKm:number, share:Share, status:TripStatus }>} tripStats  per rit, één keer de rit
 * @property {Charging} charging
 * @property {{ allDaysOk: boolean }} daily  zou elke dag lukken met dagelijks laden?
 * @property {WeekPlan | null} week  null bij thuis laden
 *
 * @typedef {Object} WeekPlan
 * @property {{ day:number, label:string, min:number, end:number, charged:boolean, extra:boolean }[]} days
 *           min = laagste niveau die dag, end = niveau op het einde van de dag, extra = onvoorziene laadbeurt
 * @property {boolean} planned   true = met eigen laaddagen
 * @property {number} charges    geplande laadbeurten (of door Rangy gekozen als planned = false)
 * @property {number} extra      extra laadbeurten bovenop de eigen laaddagen
 * @property {boolean} ok        eigen laaddagen volstaan (extra = 0)
 * @property {number} perWeek    gemiddeld aantal laadbeurten (10 → 90 %) per week
 * @property {boolean} enRoute   een rit lukt zelfs met 90 % niet: onderweg laden
 * @property {number[]} suggested  laaddagen die Rangy voorstelt
 */
