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
    winter.js            uitleg winter: verlies door kou vs. verwarming
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
    Topbar.jsx           merknaam, weer, info-knop
    Result.jsx           het grote getal en de marge
    Controls.jsx         omstandigheden: bereik voor stad/snelweg, terrein, snelheid, temperatuur, lading
    Slider.jsx           slider in de stijl van het ontwerp, op een echte input[type=range]
    Stepper.jsx          teller − / + (lading)
    WelcomeDialog.jsx    welkom bij het eerste bezoek: referentiewagen en disclaimer
    Panel.jsx            volledig scherm (gsm) of zijpaneel (laptop)
    TripsPanel.jsx       mijn ritten: tijdlijn met grenzen van het bereik, stad/snelweg per rit
    WinterPanel.jsx      waarom minder in de winter, berekend met het model
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

- **Gsm (< 900 px):** overzicht met de omstandigheden achter een toggle; "Mijn ritten" en "Uitleg winter" schuiven als volledig scherm binnen (info-knop of knop onderaan).
- **Laptop (≥ 900 px):** twee kolommen, omstandigheden altijd open; panelen schuiven rechts binnen en de baan verkleint ernaast.
## Omstandigheden in het model

| Keuze | Hoe het model ermee rekent | Bron |
| --- | --- | --- |
| Stad of snelweg per rit | elke rit krijgt de status van zijn eigen type; de schakelaar op het overzicht kiest welk bereik de baan toont, ritten van het andere type staan gedimd | – |
| Terrein | afwisselend evenveel km bergop als bergaf: vlak 0 %, glooiend ±3 %, heuvelachtig ±5 % | eigen aanname |
| Passagiers | 75 kg per persoon, zelfde als de bestuurder in het model | Verordening (EU) 1230/2012 |
| Bagage | 20 kg per stuk | eigen aanname |

Ter controle (eigen berekening, snelweg 110 km/h, 8 °C, variant literatuur): vlak 381 km, glooiend 364 km, heuvelachtig 325 km.

Het welkomstvenster verschijnt één keer (`rangy.welcome` in localStorage) en opent opnieuw via de regel met de referentiewagen onder het resultaat.
