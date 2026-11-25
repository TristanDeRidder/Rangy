# Rangy

Mobiele webtool die toont welke van je eigen ritten een EV aankan: per rit, op je drukste dag en over een hele week,
met de temperatuur en de wind van vandaag. De baan is een SVG; 3D is weggelaten (zie de motivatie in het dossier).

## Starten

```bash
npm install
npm run dev        # ontwikkelserver; ook bereikbaar op je gsm via het netwerkadres dat Vite toont
npm test           # controleert het rekenmodel
npm run build      # productieversie in dist/
```

Sleutels staan in `.env` (zie `.env.example`): `API_NINJAS_KEY` voor het weer, `GRAPHHOPPER_KEY` voor routes.
De Vite-proxy (`/api/weather`, `/api/route`) voegt ze toe op de server; ze komen nooit in de browser.

## Opbouw

```
src/
  model/                 natuurkundig rekenmodel (uit het onderzoek), met de wind erbij
    model.js
    calibrated-vehicle.json
    wltc-class3b.json
  scenario/
    plan.js              buildPlan(): ritten + omstandigheden + situatie → alles wat de schermen tonen
    roads.js             soorten weg (bebouwde kom, expresweg, snelweg), bereik, batterijdeel, reserve, status
    trips.js             ritformaat, "Jouw situatie", voorbeeldritten
    wind.js              wind uit het weerbericht → tegen- en zijwind bij de wagen
    warmup.js            opwarmen bij een koude start, voorverwarmen aan de thuislader
    vehicle.js           referentiewagen (twee varianten), lading, terrein (alleen voor de Uitleg)
    winter.js            uitleg temperatuur: verlies door kou vs. verwarming
    explain.js           cijfers voor de Uitleg: telkens één factor veranderen
    storage.js           ritten en situatie in localStorage (rangy.v2.*); ritten uit v1 worden omgezet
    useScenario.js       state van de app: ritten, situatie, snelheid, temperatuur, wind → plan
    types.js             vorm van het plan (JSDoc)
  route/
    municipalities.json  565 gemeenten met middelpunt (BOSA BeST Address, CC BY 4.0)
    municipalities.js    zoeken op naam, opzoeken op NIS-code
    segments.js          route → stukken (soort weg, km, rijrichting, limiet)
    routeApi.js          oproep naar /api/route (GraphHopper), met cache
  weather/               weer van vandaag via /api/weather (API Ninjas), stad of ruwe locatie
  scene/
    RoadScene.jsx        de baan
    shared/
      projection.js      één schaal voor afstanden (t = 0 bij de wagen, 1 aan het einde)
      theme.js           kleuren en statuslabels uit het ontwerp
      Tag.jsx            label bij een markering (HTML boven de baan)
    svg/RoadSceneSVG.jsx
  ui/
    Topbar.jsx           merknaam, weer, info-knop (opent de Uitleg)
    Result.jsx           het grote getal en de marge
    Tabs.jsx             Baan / Week (gsm), veegbaar
    WeekCard.jsx         de week: verbruik per dag, of batterijniveau en laaddagen
    Controls.jsx         omstandigheden: snelheid op de snelweg, temperatuur, wind (uit het weer)
    TripsPanel.jsx       Mijn ritten: Jouw situatie, ritten met bestemming, dagen, lading
    WelcomeDialog.jsx    welkom bij het eerste bezoek: thuisgemeente, laden, vaste ritten
    PlaceSearch.jsx      gemeente zoeken (combobox)
    DayChips.jsx         weekdagen kiezen
    Switch.jsx, Slider.jsx, Stepper.jsx
    Panel.jsx            volledig scherm (gsm) of zijpaneel (laptop)
    WeatherDialog.jsx    stad of locatie voor het weer
    WinterPanel.jsx      inhoud van Uitleg › Temperatuur, berekend met het model
    HintDialog.jsx       "?" naast een omstandigheid: korte uitleg (+ video) en link naar de Uitleg
    explain/
      topics.jsx         alle onderwerpen van de Uitleg: titel, korte tekst, video, pagina
      ExplainPanel.jsx   overzicht per groep, of één onderwerp
      parts.jsx          bouwstenen: balken voor het bereik, tabellen, statuslabels
```

```
ritten + situatie + weer → buildPlan() → plan ─┬─→ RoadSceneSVG (baan)
                                               ├─→ WeekCard (week)
                                               └─→ Result, TripsPanel, Uitleg
```

## Afspraken

1. **Geen rekenwerk in een weergave.** Schermen lezen alleen het `plan`-object. Zo tonen ze nooit andere cijfers.
2. **Tekst en getallen altijd in HTML.** De labels bij de markeringen staan boven de SVG (`Tag.jsx`), geplaatst met percentages.
3. **Eén schaal.** Een afstand wordt via `projection.js` een positie `t`, de SVG zet `t` om naar een y-positie in perspectief.

## Schermen

- **Gsm (< 900 px):** resultaat bovenaan, daaronder de tabs Baan en Week; "Mijn ritten" en "Uitleg" schuiven als volledig scherm binnen.
  Het overzicht is precies één schermhoogte (`h-dvh`). Onder 700 px hoogte (`short:`) is het resultaat compacter.
- **Laptop (≥ 900 px):** drie kolommen; panelen schuiven rechts binnen.

Het welkomstvenster verschijnt één keer (`rangy.v2.welcome` in localStorage). De regel met de referentiewagen onder het resultaat opent Uitleg › Referentiewagen.

## Uitleg

De info-knop opent het overzicht, met drie groepen: Basis (hoe werkt Rangy, laden en voorverwarmen, referentiewagen, rekenmodel),
Factoren (snelheid, temperatuur, wind, soort weg, lading, terrein) en Over deze schatting (disclaimer en bronnen).
Elke "?" bij een omstandigheid toont eerst een korte uitleg, met "Meer uitleg" naar het onderwerp.

- **Cijfers** komen uit `scenario/explain.js` (20 °C, vlak, geen lading, geen wind, snelweg 110 km/h, telkens één factor anders)
  of uit het plan (bereik en drukste dag van de gebruiker).
- **Video bij een "?"**: zet `video` van het onderwerp in `ui/explain/topics.jsx` op een pad in `public/`, bv. `'/videos/temperatuur.mp4'`. Kort, zonder geluid, in een lus. Bij "minder beweging" speelt ze niet vanzelf af.
- **Waarom deze wagen?**: vul `WHY_THIS_CAR` in `ui/explain/topics.jsx` in; zolang die leeg is, staat het blok niet op de pagina.
- **Bronnen**: de lijst `SOURCES` in `ui/explain/topics.jsx`, met de verplichte vermelding van OpenStreetMap (ODbL) en BeST Address (CC BY 4.0).

## Rekenmodel v2: regels en aannames

Wind en opwarmen zijn uit te zetten met `WIND_ENABLED` / `WARMUP_ENABLED`, of per berekening met
`buildPlan({ useWind: false, useWarmup: false })`.

| Regel | Waarde | Basis |
| --- | --- | --- |
| Reserve | 10 %, alleen voor "zeker haalbaar" | ontwerpkeuze |
| Expresweg zonder route | limiet 90 km/u | eigen aanname |
| Andere wegen dan snelweg | limiet ± 3 km/u | ontwerpkeuze |
| Rit zonder bestemming | 40 % bebouwde kom, 20 % expresweg, 40 % snelweg | eigen aanname |
| Laadbeurt zonder thuislader | tot 90 %; de batterij mag niet onder 10 % zakken | eigen aanname |
| Laaddag | je laadt vóór de ritten van die dag (bv. 's nachts of 's ochtends aan een publieke laadpaal) | eigen aanname |
| Eigen laaddagen | gekozen in "Jouw situatie"; volstaan ze niet, dan toont Rangy een extra laadbeurt vóór de rit die onder 10 % zou zakken | ontwerpkeuze |
| Voorstel laaddagen | zo weinig mogelijk dagen per week; bij gelijk aantal de combinatie met de meeste marge | rekenkeuze |
| Week | twee weken doorgerekend, de tweede getoond (stabiel patroon) | rekenkeuze |
| Wind: luchtweerstand | luchtsnelheid t.o.v. de auto (rijsnelheid + tegenwind, plus zijwind) | natuurkunde |
| Wind bij de auto | 0,43 × de wind op 10 m | gekalibreerd op ABRP: 10 m/s tegenwind = +19 % |
| Zijwind | +5,4 per rad² aanstroomhoek (± +10 % bij 8°), hoek begrensd op 20° | gekalibreerd op ABRP: 10 m/s zijwind = +8 %; begrenzing eigen aanname |
| Rugwind, slechtste geval | 35 % van het natuurkundige effect | gekalibreerd op ABRP: 10 m/s rugwind = −6 % |
| Rugwind, beste geval | volledig natuurkundig effect (−16,5 % bij 10 m/s) | eigen berekening |
| Wind zonder route | gemiddelde over alle windrichtingen | eigen aanname |
| Route | van middelpunt tot middelpunt van de gemeenten (gemiddelde van de adrescoördinaten) | eigen aanname |
| Soort weg uit de route | motorway of limiet ≥ 100 = snelweg; limiet 70–90 = expresweg met die limiet; zonder limiet trunk = 90, primary/secondary = 70; rest = bebouwde kom | eigen aanname, nagekeken op 3 routes |
| Stukken route | gesplitst bij meer dan 30° draaien of na 5 km (voor de wind) | rekenkeuze |
| Snelweg met route | de ingestelde snelheid, begrensd op de limiet ± 3 km/u van het stuk (op- en afritten, R4, ring van Antwerpen) | ontwerpkeuze |
| Terugrit met route | dezelfde stukken in omgekeerde richting | eigen aanname |
| `wind_degrees` (API Ninjas) | richting waar de wind vandaan komt, 0° = noord | nagegaan op 25-11-2026: API 95°, windy.com tegelijk oostenwind (pijl naar het westen) |
| Wind over de week | de wind van vandaag geldt voor alle dagen (zoals de temperatuur) | ontwerpkeuze |
| Opwarmen per koude start | 860 Wh bij −1 °C, 0 bij 21 °C, lineair (± 39 Wh/°C); onder −1 °C doorgetrokken | berekend uit INL; doortrekken eigen aanname |
| Opwarmen, beste geval | 38 % minder (warmtepomp) | DOE/Argonne; toepassing op de Model Y eigen aanname |
| Koude starts per rit | elke rit, en bij heen en terug ook de terugrit | eigen aanname |
| Voorverwarmen | alleen met thuislader, voor de heenrit; neemt 30–84 % van het opwarmen weg | gekalibreerd op DOE/Argonne: 9–20 % besparing, stadsrit 12 km bij −7 °C |
| Opwarmen en het grote getal | het bereik (één lange rit) rekent zonder opwarmen; dagen, week en ritten met | rekenkeuze |
| Oude opgeslagen ritten | worden "af en toe", met dezelfde totale afstand | omzetting |
| Terrein | vlak; alleen in de Uitleg ter vergelijking: glooiend ±3 %, heuvelachtig ±5 % | eigen keuze / eigen aanname |
| Passagier / bagage | 75 kg per persoon (Verordening (EU) 1230/2012) / 20 kg per stuk (eigen aanname) | per rit |

Bronnen wind: Bäcker (2021), *Wind influence on Tesla Model 3*, ABRP; Askerdal, Fredriksson & Laine (2023),
*Development of simplified air drag models including crosswinds for commercial heavy vehicle combinations*,
Vehicle System Dynamics 62(5); wind profile power law (exponent 1/7, open land).

Bronnen opwarmen: Salisbury (2016), *2015 Nissan Leaf Cold Weather Testing*, Idaho National Laboratory;
Walsh, Isaac, Vijayagopal e.a. (2024), *Impact of Cold Ambient Temperature and Extreme Conditions on Electric
Vehicles*, DOE Program Record (Argonne National Laboratory).
