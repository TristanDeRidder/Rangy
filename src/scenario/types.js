/**
 * Het contract tussen het rekenmodel en de weergave: buildPlan() (scenario/plan.js) geeft een Plan.
 * De baan, de week, Mijn ritten en de Uitleg lezen alleen dit object.
 * Ze rekenen zelf niets: zo tonen ze altijd dezelfde cijfers.
 *
 * @typedef {'haalbaar' | 'marge' | 'laadstop'} TripStatus
 */

export {};

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
