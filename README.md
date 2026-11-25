# Rangy

Mobiele webtool die toont welke van je eigen ritten een EV aankan, en hoe snelheid, temperatuur, terrein en lading dat veranderen.
De baan kan in 3D (React Three Fiber) of als SVG getoond worden. Beide krijgen exact dezelfde gegevens.

## Starten

```bash
npm install
npm run dev        # ontwikkelserver; ook bereikbaar op je gsm via het netwerkadres dat Vite toont
npm test           # controleert het rekenmodel en de scène
npm run build      # productieversie in dist/
```

Wisselen tussen 3D en SVG: voeg `?view=svg` of `?view=3d` toe aan de URL.

## Opbouw

```
src/
  model/                 rekenmodel (ongewijzigd uit het onderzoek)
    model.js
    calibrated-vehicle.json
    wltc-class3b.json
  scenario/
    types.js             het contract: hoe een "scène" eruitziet
    buildScene.js        rekenmodel → scène (pure functie)
    buildScene.test.js   tests op de gevalideerde waarden
    useScenario.js       keuzes van de gebruiker + ritten in localStorage
    winter.js            uitleg temperatuur: verlies door kou vs. verwarming
    explain.js           cijfers voor de Uitleg: telkens één factor veranderen
  scene/
    RoadScene.jsx        enige plek die kiest tussen 3D en SVG
    shared/
      projection.js      één schaal voor afstanden (t = 0 bij de auto, 1 aan het einde)
      theme.js           kleuren en statuslabels uit het ontwerp
      viewMode.js        ?view=, WebGL-detectie, standaardkeuze
      Tag.jsx            label bij een rit (HTML boven de scène, gedeeld door 3D en SVG)
    three/RoadScene3D.jsx
    svg/RoadSceneSVG.jsx
  ui/
    Topbar.jsx           merknaam, weer, info-knop (opent de Uitleg)
    Result.jsx           het grote getal en de marge
    Controls.jsx         omstandigheden: bereik voor stad/snelweg, terrein, snelheid, temperatuur, lading
    Slider.jsx           slider in de stijl van het ontwerp, op een echte input[type=range]
    Stepper.jsx          teller − / + (lading)
    WelcomeDialog.jsx    welkom bij het eerste bezoek: referentiewagen en disclaimer
    Panel.jsx            volledig scherm (gsm) of zijpaneel (laptop)
    TripsPanel.jsx       mijn ritten: tijdlijn met grenzen van het bereik, stad/snelweg per rit
    WinterPanel.jsx      inhoud van Uitleg › Temperatuur, berekend met het model
    HintDialog.jsx       "?" naast een omstandigheid: korte uitleg (+ video) en link naar de Uitleg
    explain/
      topics.jsx         alle onderwerpen van de Uitleg: titel, korte tekst, video, pagina
      ExplainPanel.jsx   overzicht per groep, of één onderwerp
      parts.jsx          bouwstenen: balken voor het bereik, tabel, statuslabels
```

```
rekenmodel → buildScene() → scène ─┬─→ RoadScene3D  (of)  RoadSceneSVG
                                   └─→ 2D-laag: Topbar, Result, Controls, panelen
```

## Afspraken

1. **Geen rekenwerk in een weergave.** 3D en SVG lezen alleen het `scene`-object. Zo tonen ze nooit andere cijfers.
2. **Tekst en getallen altijd in de 2D-laag.** 3D legt uit (baan, auto, krachten), 2D toont het resultaat. De labels bij de ritten zijn HTML boven de scène (`Tag.jsx`): de SVG-versie plaatst ze met percentages, de 3D-versie projecteert de toppen van de palen naar het scherm.
3. **Eén schaal.** Een afstand wordt via `projection.js` een positie `t`. 3D zet `t` om naar de z-as, SVG naar een y-positie in perspectief.
4. **3D wordt pas geladen als het nodig is** (`React.lazy`). Tijdens het laden, en op toestellen zonder WebGL, toont de SVG-versie hetzelfde beeld.

3D schrappen? Zet `DEFAULT_VIEW` in `scene/shared/viewMode.js` op `'svg'` en verwijder de map `scene/three/`.

## Schermen

- **Gsm (< 900 px):** overzicht met de omstandigheden achter een toggle; "Mijn ritten" en "Uitleg" schuiven als volledig scherm binnen (knop onderaan of info-knop).
  Het overzicht is precies één schermhoogte (`h-dvh`): de baan schaalt mee met de ruimte tussen resultaat en dock, de labels schalen mee met de baan. Onder 700 px hoogte (`short:`) is het resultaat compacter.
- **Laptop (≥ 900 px):** twee kolommen, omstandigheden altijd open; panelen schuiven rechts binnen en de baan verkleint ernaast.
## Omstandigheden in het model

| Keuze | Hoe het model ermee rekent | Bron |
| --- | --- | --- |
| Stad of snelweg per rit | elke rit krijgt de status van zijn eigen type; de schakelaar op het overzicht kiest welk bereik de baan toont, ritten van het andere type staan gedimd | – |
| Terrein | afwisselend evenveel km bergop als bergaf: vlak 0 %, glooiend ±3 %, heuvelachtig ±5 % | eigen aanname |
| Passagiers | 75 kg per persoon, zelfde als de bestuurder in het model | Verordening (EU) 1230/2012 |
| Bagage | 20 kg per stuk | eigen aanname |

Ter controle (eigen berekening, snelweg 110 km/h, 8 °C, variant literatuur): vlak 381 km, glooiend 364 km, heuvelachtig 325 km.

Het welkomstvenster verschijnt één keer (`rangy.welcome` in localStorage). De regel met de referentiewagen onder het resultaat opent Uitleg › Referentiewagen.

## Uitleg

De info-knop opent het overzicht, met drie groepen: Basis (hoe werkt Rangy, referentiewagen, rekenmodel), Factoren (snelheid, temperatuur, stad of snelweg, lading, terrein) en Over deze schatting (disclaimer en bronnen). Elke "?" bij een omstandigheid toont eerst een korte uitleg, met "Meer uitleg" naar het onderwerp.

- **Cijfers** komen uit `scenario/explain.js`: 20 °C, vlak, geen lading, snelweg 110 km/h, en telkens één factor anders.
- **Video bij een "?"**: zet `video` van het onderwerp in `ui/explain/topics.jsx` op een pad in `public/`, bv. `'/videos/temperatuur.mp4'`. Kort, zonder geluid, in een lus. Bij "minder beweging" speelt ze niet vanzelf af.
- **Waarom deze wagen?**: vul `WHY_THIS_CAR` in `ui/explain/topics.jsx` in; zolang die leeg is, staat het blok niet op de pagina.

## Rekenmodel v2 (branch `feature/v2-calculation-model`)

Nieuwe modules naast het bestaande model. `useScenario` rekent al met `buildPlan`; de huidige schermen tonen nog
de scène van v1, tot de nieuwe interface er is.

```
scenario/
  roads.js    soorten weg: bebouwde kom (WLTC laag + middel), expresweg (WLTC high, geschaald naar limiet ± 3 km/u),
              snelweg (eigen snelheid). Bereik en batterijdeel voor een mix, reserve 10 %, status.
  trips.js    ritformaat (enkele afstand, heen en terug, dagen, mix, bestemming, lading per rit),
              "jouw situatie", presets voor het welkomstvenster, omzetten van oude ritten.
  wind.js     wind uit het weerbericht → tegen- en zijwind bij de auto; afgesteld op rijdata (ABRP).
              Uit te zetten met WIND_ENABLED = false of buildPlan({ useWind: false }).
  warmup.js   opwarmen bij een koude start (INL) en voorverwarmen aan de thuislader (DOE/Argonne).
              Uit te zetten met WARMUP_ENABLED = false of buildPlan({ useWarmup: false }).
  storage.js  ritten en "Jouw situatie" op het toestel bewaren (rangy.v2.*); ritten uit v1 worden omgezet.
  legacy.js   tijdelijke brug naar de interface van v1 (stad/snelweg in Mijn ritten); weg met de nieuwe schermen.
  useScenario geeft `plan` (v2) en `scene` (v1) terug, plus addTrip/updateTrip/removeTrip/clearTrips en setSituation.
  plan.js     buildPlan(): eigen mix → groot getal, per dag verbruik en status, drukste dag,
              week zonder dagelijks laden (eigen laaddagen of voorstel van Rangy, extra laadbeurten),
              ritten die af en toe terugkomen.
```

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
| `wind_degrees` (API Ninjas) | richting waar de wind vandaan komt, 0° = noord | eigen aanname, nog na te gaan |
| Wind over de week | de wind van vandaag geldt voor alle dagen (zoals de temperatuur) | ontwerpkeuze |
| Opwarmen per koude start | 860 Wh bij −1 °C, 0 bij 21 °C, lineair (± 39 Wh/°C); onder −1 °C doorgetrokken | berekend uit INL; doortrekken eigen aanname |
| Opwarmen, beste geval | 38 % minder (warmtepomp) | DOE/Argonne; toepassing op de Model Y eigen aanname |
| Koude starts per rit | elke rit, en bij heen en terug ook de terugrit | eigen aanname |
| Voorverwarmen | alleen met thuislader, voor de heenrit; neemt 30–84 % van het opwarmen weg | gekalibreerd op DOE/Argonne: 9–20 % besparing, stadsrit 12 km bij −7 °C |
| Opwarmen en het grote getal | het bereik (één lange rit) rekent zonder opwarmen; dagen, week en ritten met | rekenkeuze |
| Oude opgeslagen ritten | worden "af en toe", met dezelfde totale afstand | omzetting |

Wind per stuk route werkt zodra de route-API de stukken (soort weg, km, rijrichting) levert in `trip.segments`.

Bronnen wind: Bäcker (2021), *Wind influence on Tesla Model 3*, ABRP; Askerdal, Fredriksson & Laine (2023),
*Development of simplified air drag models including crosswinds for commercial heavy vehicle combinations*,
Vehicle System Dynamics 62(5); wind profile power law (exponent 1/7, open land).

Bronnen opwarmen: Salisbury (2016), *2015 Nissan Leaf Cold Weather Testing*, Idaho National Laboratory;
Walsh, Isaac, Vijayagopal e.a. (2024), *Impact of Cold Ambient Temperature and Extreme Conditions on Electric
Vehicles*, DOE Program Record (Argonne National Laboratory).
