/**
 * Inhoud van de Uitleg-pagina.
 * Elk onderwerp heeft een korte tekst voor de "?"-knop (`short`) en een volledige pagina (`Body`).
 * Cijfers komen altijd uit het rekenmodel (scenario/explain.js), nooit vast in de tekst.
 *
 * Video bij een "?": zet `video` op het pad van de clip in /public, bv. '/videos/temperatuur.mp4'.
 * Zonder video toont de "?" alleen de tekst.
 */
import { useMemo } from 'react';
import WinterPanel from '../WinterPanel.jsx';
import { speedRows, cityVsHighway, loadRows, terrainRows, carFacts, BASE } from '../../scenario/explain.js';
import { TERRAIN, KG_PER_PASSENGER, KG_PER_BAG } from '../../scenario/buildScene.js';
import { STATUS_LABEL } from '../../scene/shared/theme.js';
import { P, Lead, H, Note, RangeBars, Facts, Status, span, r10 } from './parts.jsx';

const AT_20 = `${BASE.tempC} °C · VLAK · ZONDER LADING · BEREKEND MET HET MODEL`;

/**
 * Waarom precies deze wagen? Eigen motivatie, met bron. Zolang dit leeg is,
 * wordt het blok op de pagina Referentiewagen niet getoond.
 */
const WHY_THIS_CAR = null;

export const GROUPS = [
  { id: 'basis', label: 'BASIS' },
  { id: 'factoren', label: 'FACTOREN' },
  { id: 'over', label: 'OVER DEZE SCHATTING' },
];

export const TOPICS = [
  {
    id: 'hoe-werkt',
    group: 'basis',
    title: 'Hoe werkt Rangy?',
    sub: 'Zeker en mogelijk bereik, markeringen lezen',
    Body: HowItWorks,
  },
  {
    id: 'referentiewagen',
    group: 'basis',
    title: 'Referentiewagen',
    sub: 'Tesla Model Y Standard RWD · 60 kWh',
    Body: ReferenceCar,
  },
  {
    id: 'rekenmodel',
    group: 'basis',
    title: 'Het rekenmodel',
    sub: 'Natuurkunde, testcyclus en waarom een marge',
    Body: Model,
  },
  {
    id: 'snelheid',
    group: 'factoren',
    title: 'Snelheid',
    sub: 'Hoe sneller, hoe meer luchtweerstand',
    short: 'Hoe sneller je rijdt, hoe harder de wagen tegen de lucht in moet duwen. Die luchtweerstand groeit met het kwadraat van de snelheid.',
    video: null,
    Body: Speed,
  },
  {
    id: 'temperatuur',
    group: 'factoren',
    title: 'Temperatuur',
    sub: 'Koude batterij en verwarming',
    short: 'Een koude batterij levert iets minder energie en de verwarming moet aan. In de stad rij je traag, dus draait de verwarming lang voor elke kilometer.',
    video: null,
    Body: Temperature,
  },
  {
    id: 'stad-snelweg',
    group: 'factoren',
    title: 'Stad of snelweg',
    sub: 'Traag met stops of snel en constant',
    short: 'In de stad rij je traag en win je energie terug bij het remmen. Op de snelweg kost de luchtweerstand veel. Kies per rit wat het meest voorkomt.',
    video: null,
    Body: CityHighway,
  },
  {
    id: 'lading',
    group: 'factoren',
    title: 'Lading',
    sub: 'Passagiers en bagage',
    short: `Elke passagier telt voor ${KG_PER_PASSENGER} kg, elk stuk bagage voor ${KG_PER_BAG} kg. Extra gewicht kost vooral bij optrekken, dus meer in de stad dan op de snelweg.`,
    video: null,
    Body: Load,
  },
  {
    id: 'terrein',
    group: 'factoren',
    title: 'Terrein',
    sub: 'Bergop, bergaf en terugwinnen',
    short: 'Bergop kost energie, bergaf win je een deel terug. Rangy rekent met evenveel bergop als bergaf: je verliest alleen wat je niet terugwint.',
    video: null,
    Body: Terrain,
  },
  {
    id: 'disclaimer',
    group: 'over',
    title: 'Disclaimer & bronnen',
    sub: 'Wat Rangy wel en niet belooft',
    Body: Disclaimer,
  },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id);

/* ---------- Basis ---------- */

function HowItWorks({ scene }) {
  const b = scene.rangeKm;
  return (
    <>
      <Lead>Rangy berekent hoe ver de referentiewagen komt onder de omstandigheden die jij kiest, en zet je eigen ritten langs de baan.</Lead>
      <H>EEN BEREIK, GEEN GETAL</H>
      <P>
        Met de huidige keuzes kom je tussen {r10(b.low)} en {r10(b.high)} km ver. Studies en metingen verschillen,
        onder meer in hoe zuinig de verwarming werkt. Rangy rekent daarom met twee varianten en toont wat ertussen ligt.
      </P>
      <ul className="flex flex-col gap-2.5">
        <li className="flex flex-col gap-1"><Status status="haalbaar">ZEKER BEREIK</Status><P>Zo ver kom je volgens beide varianten.</P></li>
        <li className="flex flex-col gap-1"><Status status="marge">MOGELIJK BEREIK</Status><P>Zo ver kom je volgens de zuinigste variant.</P></li>
      </ul>
      <H>DE MARKERINGEN</H>
      <ul className="flex flex-col gap-2.5">
        <li className="flex flex-col gap-1"><Status status="haalbaar">{STATUS_LABEL.haalbaar.toUpperCase()}</Status><P>De rit valt binnen het zekere bereik.</P></li>
        <li className="flex flex-col gap-1"><Status status="marge">{STATUS_LABEL.marge.toUpperCase()}</Status><P>De rit valt in de marge: het hangt af van de wagen en hoe je rijdt.</P></li>
        <li className="flex flex-col gap-1"><Status status="laadstop">{STATUS_LABEL.laadstop.toUpperCase()}</Status><P>De rit is langer dan het mogelijke bereik.</P></li>
      </ul>
      <P>
        Elke rit is een stads- of snelwegrit, die je zelf kiest bij Mijn ritten. Bovenaan kies je voor welk type de baan het bereik toont.
        Ritten van het andere type staan gedimd, met hun eigen status.
      </P>
      <Note>Rangy rekent met een volle batterij die helemaal leeg mag, zonder reserve bij aankomst.</Note>
    </>
  );
}

function ReferenceCar() {
  const f = useMemo(carFacts, []);
  return (
    <>
      <Lead>Alle cijfers in Rangy gelden voor één wagen. Zo kan je ritten en omstandigheden eerlijk vergelijken.</Lead>
      <Facts
        rows={[
          ['MODEL', 'TESLA MODEL Y STANDARD RWD'],
          ['BATTERIJ (BRUIKBAAR)', '60 KWH'],
          ['GEWICHT (RIJKLAAR)', '1906 KG'],
          ['BESTUURDER', `+${KG_PER_PASSENGER} KG, INBEGREPEN`],
          ['STAD · 20 °C', `${span(f.city)} KM`],
          ['SNELWEG 110 KM/H · 20 °C', `${span(f.highway)} KM`],
        ]}
      />
      <Note>
        Gewicht: Tesla (z.d.). Bruikbare batterij: geschat door EV Database (z.d.). Bereik: berekend met het rekenmodel, vlak en zonder lading.
      </Note>
      {WHY_THIS_CAR && (
        <>
          <H>WAAROM DEZE WAGEN?</H>
          <P>{WHY_THIS_CAR}</P>
        </>
      )}
      <H>EEN ANDERE WAGEN?</H>
      <P>
        Met een grotere batterij of een zuinigere vorm kom je verder, met een zwaardere of hogere wagen minder ver. Snelheid, kou en lading werken bij
        elke EV in dezelfde richting, maar de kilometers verschillen.
      </P>
    </>
  );
}

function Model() {
  return (
    <>
      <Lead>Rangy gebruikt een natuurkundig model: het rekent uit hoeveel energie elke kilometer kost.</Lead>
      <H>WAAR DE ENERGIE NAARTOE GAAT</H>
      <ul className="flex flex-col gap-1.5 list-disc pl-5 text-[15px] leading-[22px]">
        <li>luchtweerstand, die groeit met het kwadraat van de snelheid</li>
        <li>rolweerstand van de banden, die groeit met het gewicht</li>
        <li>bergop rijden; bergaf wint de wagen een deel terug</li>
        <li>verwarming onder 20 °C en airco boven 22 °C</li>
        <li>elektronica die altijd aanstaat</li>
      </ul>
      <P>Dat alles wordt gedeeld door het rendement van de aandrijving: niet alle energie uit de batterij komt bij de wielen.</P>
      <H>STAD EN SNELWEG</H>
      <P>
        Op de snelweg rekent het model met een constante snelheid. Voor de stad rijdt het seconde per seconde de lage en middelste fase van de
        WLTC-testcyclus (klasse 3b), met optrekken en remmen. Bij het remmen wint de wagen ongeveer 60 % terug.
      </P>
      <H>KOU</H>
      <P>Bij kou levert de batterij minder capaciteit en werkt de aandrijving iets minder efficiënt. Daarbovenop moet de verwarming aan.</P>
      <H>AFGESTEMD OP METINGEN</H>
      <P>
        Luchtweerstand, rolweerstand en verwarming zijn afgestemd op meetpunten. Voor de verwarming bestaan twee varianten: één op basis van
        onderzoek en één op basis van EV Database. Het verschil tussen beide bepaalt de marge die je in Rangy ziet.
      </P>
      <Note>Alle parameters en hun bron staan bij Disclaimer &amp; bronnen.</Note>
    </>
  );
}

/* ---------- Factoren ---------- */

function Speed() {
  const rows = useMemo(() => speedRows(), []);
  return (
    <>
      <Lead>Op de snelweg weegt snelheid het zwaarst door. Hoe sneller je rijdt, hoe meer energie elke kilometer kost.</Lead>
      <RangeBars rows={rows.map((r) => ({ label: `${r.speedKmh} KM/H`, band: r }))} caption={`SNELWEG · ${AT_20}`} />
      <P>
        De wagen moet de lucht voor zich uit duwen. Die luchtweerstand groeit met het kwadraat van de snelheid: dubbel zo snel is vier keer zoveel
        weerstand. Rolweerstand en elektronica veranderen veel minder.
      </P>
      <P>In de stad speelt de snelheidsslider geen rol: daar volgt Rangy een vaste testcyclus.</P>
    </>
  );
}

function Temperature() {
  return (
    <>
      <WinterPanel />
      <Note>
        <strong className="font-mono text-[12px] text-ink tracking-[0.08em]">WAAROM EEN MARGE? </strong>
        Studies en metingen verschillen in hoe zuinig de verwarming werkt. Rangy toont daarom een bereik.
      </Note>
    </>
  );
}

function CityHighway() {
  const rows = useMemo(() => cityVsHighway(), []);
  const [warm, cold] = rows;
  return (
    <>
      <Lead>Op een zachte dag kom je in de stad verder dan op de snelweg. Op een koude dag ligt dat veel dichter bij elkaar.</Lead>
      {rows.map((r) => (
        <RangeBars
          key={r.tempC}
          rows={[
            { label: 'STAD', band: r.stad },
            { label: 'SNELWEG 110 KM/H', band: r.snelweg },
          ]}
          caption={`${r.tempC} °C · VLAK · ZONDER LADING · BEREKEND MET HET MODEL`}
        />
      ))}
      <P>
        In de stad rij je traag, dus is er weinig luchtweerstand, en bij het remmen win je energie terug. Op de snelweg rij je snel en constant:
        de luchtweerstand bepaalt het verbruik.
      </P>
      <P>
        Bij kou draait de verwarming. In de stad duurt elke kilometer lang, dus kost de verwarming per kilometer veel meer. Daardoor zakt het bereik in
        de stad van {span(warm.stad)} naar {span(cold.stad)} km, op de snelweg van {span(warm.snelweg)} naar {span(cold.snelweg)} km.
      </P>
      <P>Kies bij Mijn ritten per rit wat het meest voorkomt.</P>
    </>
  );
}

function Load() {
  const { extraKg, rows } = useMemo(() => loadRows(), []);
  const [city, hwy] = rows;
  return (
    <>
      <Lead>Elke kilo moet mee optrekken en rollen. Dat kost vooral in de stad.</Lead>
      <RangeBars
        rows={[
          { label: 'STAD · ALLEEN', band: city.empty },
          { label: `STAD · +${extraKg} KG`, band: city.loaded },
          { label: 'SNELWEG · ALLEEN', band: hwy.empty },
          { label: `SNELWEG · +${extraKg} KG`, band: hwy.loaded },
        ]}
        caption={`4 PASSAGIERS + 4 STUKS BAGAGE · ${BASE.tempC} °C · VLAK · BEREKEND MET HET MODEL`}
      />
      <P>
        Met een volle wagen kom je in de stad ongeveer {Math.round(city.lossPct)} % minder ver, op de snelweg ongeveer {Math.round(hwy.lossPct)} %.
        In de stad trek je vaak op, en dat kost meer met meer gewicht. Op de snelweg weegt de luchtweerstand zwaarder door dan het gewicht.
      </P>
      <Note>
        Een passagier telt voor {KG_PER_PASSENGER} kg, de standaardmassa die ook voor de bestuurder geldt (Verordening (EU) 1230/2012). Een stuk bagage
        telt voor {KG_PER_BAG} kg: eigen aanname. De bestuurder zit altijd al in de berekening.
      </Note>
    </>
  );
}

function Terrain() {
  const rows = useMemo(() => terrainRows(), []);
  const label = (t) => TERRAIN[t].label.toUpperCase();
  return (
    <>
      <Lead>Bergop kost energie, bergaf win je een deel terug. In een vlak land als Vlaanderen speelt terrein daardoor meestal weinig mee.</Lead>
      <RangeBars rows={rows.map((r) => ({ label: `SNELWEG · ${label(r.terrain)}`, band: r.snelweg }))} caption={`110 KM/H · ${BASE.tempC} °C · ZONDER LADING · BEREKEND MET HET MODEL`} />
      <RangeBars rows={rows.map((r) => ({ label: `STAD · ${label(r.terrain)}`, band: r.stad }))} caption={`${BASE.tempC} °C · ZONDER LADING · BEREKEND MET HET MODEL`} />
      <P>
        Rangy rekent met evenveel kilometer bergop als bergaf. Bergaf wint de wagen ongeveer 85 % terug. Je verliest dus alleen het deel dat je
        niet terugwint, en dat wordt meer naarmate de hellingen steiler zijn.
      </P>
      <Note>
        Glooiend = afwisselend {TERRAIN.glooiend.gradePct} % bergop en bergaf, heuvelachtig = {TERRAIN.heuvelachtig.gradePct} %: eigen aanname.
        Een rit die netto stijgt, bijvoorbeeld naar de Ardennen, kost meer dan Rangy toont.
      </Note>
    </>
  );
}

/* ---------- Over deze schatting ---------- */

const SOURCES = [
  ['Tesla (z.d.)', 'rijklaar gewicht'],
  ['EV Database (z.d.)', 'bruikbare batterij, een variant van de verwarming, referentietemperatuur'],
  ['Verordening (EU) 1230/2012', 'standaardmassa bestuurder en passagier'],
  ['DOE & EPA (z.d.)', 'rendement van batterij tot wiel'],
  ['Armenta-Déu & Cortés (2023)', 'terugwinning bergaf en bij remmen'],
  ['Carlson (2015)', 'basisverbruik elektronica'],
  ['Argue (2023)', 'wanneer verwarming en airco aanspringen'],
  ['Li et al. (2021)', 'verbruik van de airco'],
  ['Zhao et al. (2022)', 'capaciteit en rendement bij kou'],
  ['WLTC klasse 3b', 'testcyclus voor de stadsrit'],
  ['API Ninjas', 'temperatuur van vandaag'],
];

function Disclaimer() {
  return (
    <>
      <Lead>Rangy geeft een eerlijke schatting, geen belofte.</Lead>
      <P>
        Alle cijfers gelden voor de referentiewagen, met een volle batterij en zonder reserve. Jouw wagen, je rijstijl, de wind, het verkeer en de
        staat van de batterij kunnen het echte bereik doen afwijken. Gebruik Rangy om te zien wat een EV ongeveer aankan, niet om een rit tot op
        de kilometer te plannen.
      </P>
      <P>Je ritten blijven op dit toestel. Rangy vraagt geen account en stuurt je ritten nergens naartoe.</P>
      <H>BRONNEN</H>
      <ul className="flex flex-col">
        {SOURCES.map(([src, use]) => (
          <li key={src} className="flex flex-col gap-0.5 py-2.5 border-b border-line last:border-b-0">
            <span className="font-mono text-[12px] font-semibold tracking-[0.04em]">{src}</span>
            <span className="text-[13.5px] leading-[19px] text-muted">{use}</span>
          </li>
        ))}
      </ul>
      <Note>Waarden die niet uit een bron komen, zijn eigen berekeningen of aannames en staan zo vermeld bij het onderwerp.</Note>
    </>
  );
}
