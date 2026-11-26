/**
 * Inhoud van de Uitleg-pagina.
 * Elk onderwerp heeft een korte tekst voor de "?"-knop (`short`) en een volledige pagina (`Body`).
 * Cijfers komen altijd uit het rekenmodel (scenario/explain.js of het plan), nooit vast in de tekst.
 * `Body` krijgt het plan mee (buildPlan), voor onderwerpen die de keuzes van de gebruiker tonen.
 *
 * Video bij een "?": zet `video` op het pad van de clip in /public, bv. '/videos/temperatuur.mp4'.
 * Zonder video toont de "?" alleen de tekst.
 */
import { useMemo } from 'react';
import WinterPanel from '../WinterPanel.jsx';
import { speedRows, speedVariation, roadRows, loadRows, terrainRows, carFacts, windRows, warmupRows, BASE } from '../../scenario/explain.js';
import { TERRAIN, KG_PER_PASSENGER, KG_PER_BAG } from '../../scenario/vehicle.js';
import { RESERVE, EXPRES_LIMIT_KMH, SPEED_TOLERANCE_KMH } from '../../scenario/roads.js';
import { CHARGE_FROM, CHARGE_TO } from '../../scenario/plan.js';
import { DEFAULT_MIX } from '../../scenario/trips.js';
import { STATUS_LABEL } from '../../scene/shared/theme.js';
import { P, Lead, H, Note, RangeBars, Facts, Table, Status, span, r10, pct1, degC } from './parts.jsx';

const RES = Math.round(RESERVE * 100);
const FROM = Math.round(CHARGE_FROM * 100);
const TO = Math.round(CHARGE_TO * 100);
const nl1 = (x) => x.toLocaleString('nl-BE', { maximumFractionDigits: 1 });

const AT_20 = `${BASE.tempC} °C · VLAK · ZONDER LADING · ZONDER WIND · BEREKEND MET HET MODEL`;

/**
 * Waarom precies deze wagen? Eigen motivatie, met bron. Zolang dit leeg is,
 * wordt het blok op de pagina Referentiewagen niet getoond.
 */
const WHY_THIS_CAR =
  'De Model Y was in 2024 de meest ingeschreven elektrische wagen in België: 13.223 nieuwe inschrijvingen, waarvan 9.017 door bedrijven ' +
  '(Febiac, 2025a). Het is dus een wagen die in België veel rondrijdt, vaak als bedrijfswagen. Bovendien is er veel data over beschikbaar, ' +
  'zowel uit primaire bronnen (zoals Tesla zelf en onafhankelijke rijtests) als uit secundaire bronnen (zoals EV Database).';

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
    sub: 'Zeker en mogelijk bereik, de baan en je week',
    Body: HowItWorks,
  },
  {
    id: 'laden',
    group: 'basis',
    title: 'Laden en voorverwarmen',
    sub: 'Laaddagen, koude start en de lader',
    short:
      'Zonder thuislader kies je zelf je laaddagen. Rangy toont of dat volstaat. In de kou kost elke koude start extra; met een thuislader kan je voorverwarmen aan de lader.',
    video: null,
    Body: Charging,
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
    short:
      'Met de slider kies je je snelheid op de snelweg. Hoe sneller je rijdt, hoe harder de wagen tegen de lucht in moet duwen. Die luchtweerstand groeit met het kwadraat van de snelheid.',
    video: null,
    Body: Speed,
  },
  {
    id: 'temperatuur',
    group: 'factoren',
    title: 'Temperatuur',
    sub: 'Koude batterij en verwarming',
    short:
      'Een koude batterij levert iets minder energie en de verwarming moet aan. In de stad rij je traag, dus draait de verwarming lang voor elke kilometer.',
    video: null,
    Body: Temperature,
  },
  {
    id: 'wind',
    group: 'factoren',
    title: 'Wind',
    sub: 'Tegenwind kost meer dan rugwind oplevert',
    short:
      'Tegenwind kost extra, rugwind helpt minder dan je zou denken, en ook zijwind kost iets. Rangy neemt de wind van vandaag uit het weerbericht en rekent per stuk van je route.',
    video: null,
    Body: Wind,
  },
  {
    id: 'soort-weg',
    group: 'factoren',
    title: 'Soort weg',
    sub: 'Bebouwde kom, expresweg en snelweg',
    short:
      'Rangy deelt elke rit op in bebouwde kom, expresweg en snelweg. Met een bestemming komt die verdeling uit de route. Zo telt elke soort weg mee voor wat hij echt kost.',
    video: null,
    Body: RoadTypes,
  },
  {
    id: 'lading',
    group: 'factoren',
    title: 'Lading',
    sub: 'Passagiers en bagage, per rit',
    short: `Per rit stel je passagiers en bagage in. Elke passagier telt voor ${KG_PER_PASSENGER} kg, elk stuk bagage voor ${KG_PER_BAG} kg. Extra gewicht kost vooral bij optrekken, dus meer in de stad dan op de snelweg.`,
    video: null,
    Body: Load,
  },
  {
    id: 'terrein',
    group: 'factoren',
    title: 'Terrein',
    sub: 'Waarom Rangy vlak rekent',
    short:
      'Rangy rekent elke rit als vlak. Op een rit heen en terug rij je evenveel bergop als bergaf, en bergaf wint de wagen een deel terug.',
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

function HowItWorks({ plan }) {
  const b = plan.rangeKm;
  const own = plan.days.some((d) => d.trips.length);
  const busy = plan.busiest;
  return (
    <>
      <Lead>
        Rangy berekent hoe ver de referentiewagen komt met jouw ritten en de omstandigheden van vandaag, en zet je ritten langs de baan.
      </Lead>
      <H>EEN BEREIK, GEEN GETAL</H>
      <P>
        Met de huidige keuzes kom je tussen {r10(b.low)} en {r10(b.high)} km ver; het grote getal is het midden. Studies en metingen verschillen,
        onder meer in hoe zuinig de verwarming werkt. Rangy rekent daarom met twee varianten en toont wat ertussen ligt.
      </P>
      <P>
        {own
          ? 'Het bereik geldt voor jouw mix van wegen: de soorten weg van je vaste ritten, gewogen naar hoeveel kilometer je er per week op rijdt.'
          : `Zolang je geen vaste ritten hebt, rekent Rangy met een standaardmix: ${Math.round(DEFAULT_MIX.kom * 100)} % bebouwde kom, ${Math.round(
              DEFAULT_MIX.expres * 100,
            )} % expresweg en ${Math.round(DEFAULT_MIX.snel * 100)} % snelweg.`}
      </P>
      <H>DE BAAN</H>
      <ul className="flex flex-col gap-2.5">
        <li className="flex flex-col gap-1">
          <Status status="haalbaar">ZEKER BEREIK · {r10(b.safe)} KM</Status>
          <P>Zo ver kom je volgens beide varianten, met nog {RES} % in de batterij bij aankomst.</P>
        </li>
        <li className="flex flex-col gap-1">
          <span className="self-start font-mono text-[12px] font-semibold tracking-[0.06em]">RESERVE {RES} %</span>
          <P>
            Het gearceerde stuk. Die laatste {RES} % houdt Rangy achter de hand, bijvoorbeeld voor een omweg of een file.
          </P>
        </li>
        <li className="flex flex-col gap-1">
          <Status status="marge">MOGELIJK BEREIK · {r10(b.high)} KM</Status>
          <P>Zo ver kom je volgens de zuinigste variant, tot de batterij leeg is.</P>
        </li>
      </ul>
      <H>DE MARKERINGEN</H>
      <P>
        Op de baan staan je drukste dag (alle vaste ritten van die dag samen) en de ritten die af en toe terugkomen. Elke rit rekent met zijn eigen
        wegen en lading.
        {busy && busy.km > 0 && ` Je drukste dag telt nu ${Math.round(busy.km)} km en vraagt tot ${Math.round(busy.share.worst * 100)} % van een volle batterij.`}
      </P>
      <ul className="flex flex-col gap-2.5">
        <li className="flex flex-col gap-1">
          <Status status="haalbaar">{STATUS_LABEL.haalbaar.toUpperCase()}</Status>
          <P>Binnen het zekere bereik: je komt aan met minstens {RES} % in de batterij.</P>
        </li>
        <li className="flex flex-col gap-1">
          <Status status="marge">{STATUS_LABEL.marge.toUpperCase()}</Status>
          <P>Binnen het mogelijke bereik, maar niet zeker met {RES} % reserve: het hangt af van de wagen en hoe je rijdt.</P>
        </li>
        <li className="flex flex-col gap-1">
          <Status status="laadstop">{STATUS_LABEL.laadstop.toUpperCase()}</Status>
          <P>Langer dan het mogelijke bereik: je moet onderweg laden.</P>
        </li>
      </ul>
      <H>JE WEEK</H>
      <P>
        Bij Week zie je wat je ritten over een hele week betekenen. Laad je thuis of op het werk, dan begint elke dag vol en zie je per dag hoeveel
        van de batterij je gebruikt. Laad je niet thuis, dan zie je hoe vol de batterij elke dag nog is en op welke dagen je laadt.
      </P>
      <Note>De week rekent met de minst zuinige variant, zodat je niet tekortkomt. Meer bij Laden en voorverwarmen.</Note>
    </>
  );
}

function Charging() {
  const rows = useMemo(() => warmupRows(), []);
  const cold = rows[rows.length - 1];
  return (
    <>
      <Lead>Hoe vaak je moet laden, hangt af van je week. In de kou kost elke koude start bovendien extra.</Lead>
      <H>ZONDER THUISLADER</H>
      <P>
        Bij Jouw situatie kies je zelf je laaddagen. Op een laaddag vertrek je met {TO} %: je laadt vóór de ritten van die dag, bijvoorbeeld
        &apos;s nachts of &apos;s ochtends aan een publieke laadpaal. Zakt de batterij vóór een rit toch onder {FROM} %, dan toont Rangy een extra
        laadbeurt op die dag.
      </P>
      <P>
        Kies je geen dagen, dan stelt Rangy ze voor: zo weinig mogelijk laaddagen per week, en bij een gelijk aantal de dagen waarop de batterij het
        minst diep zakt. Rangy rekent daarvoor elke combinatie van weekdagen door, twee weken na elkaar, en toont de tweede week. Zo hangt het niet
        af van hoe vol de batterij op de eerste maandag was.
      </P>
      <H>MET THUISLADER</H>
      <P>
        Laad je thuis of op het werk, dan begint elke dag met een volle batterij. Een dag is zeker haalbaar als hij niet meer dan {100 - RES} % van
        de batterij vraagt.
      </P>
      <H>KOUDE START</H>
      <P>
        Na een tijd stilstaan in de kou moeten het interieur en de batterij eerst opwarmen. Dat kost extra, bovenop de verwarming tijdens het rijden.
        Rangy telt elke rit als een koude start, en bij heen en terug ook de terugrit: de wagen stond stil op de bestemming.
      </P>
      <Table
        head={['', 'WARME WAGEN', 'KOUDE START', 'VOORVERWARMD']}
        rows={rows.map((r) => [degC(r.tempC), pct1(r.zonder.worst), pct1(r.opwarmen.worst), pct1(r.voorverwarmd.worst)])}
        caption="RIT VAN 4 KM IN DE BEBOUWDE KOM, HEEN EN TERUG · DEEL VAN EEN VOLLE BATTERIJ · MINST ZUINIGE VARIANT · BEREKEND MET HET MODEL"
      />
      <P>
        Op korte ritten weegt dat zwaar: bij {degC(cold.tempC)} kost deze rit met een koude start {nl1(cold.opwarmen.worst / cold.zonder.worst)} keer
        zoveel als met een warme wagen. Op een lange rit valt het opwarmen weg tegen het rijden zelf.
      </P>
      <H>VOORVERWARMEN</H>
      <P>
        Met een thuislader kan je de wagen opwarmen terwijl hij nog aan de lader hangt. Die energie komt dan grotendeels van het net. Zet je
        Voorverwarmen aan bij Jouw situatie, dan haalt Rangy een deel van het opwarmen weg bij de heenrit. De terugrit blijft een koude start.
      </P>
      <Note>
        Laden van {FROM} tot {TO} % en laden vóór de ritten van die dag: eigen aanname. Opwarmen: tot ± 860 Wh per koude start bij −1 °C en geen
        meetbaar verschil vanaf 21 °C (Salisbury, 2016); daartussen rechtlijnig: eigen aanname. Zuinigste variant: 38 % minder met een warmtepomp
        (Walsh et al., 2024). Voorverwarmen spaarde 9 tot 20 % op een stadsrit van 12 km bij −7 °C (Walsh et al., 2024); daarop is het deel
        afgesteld dat voorverwarmen wegneemt: eigen berekening.
      </Note>
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
        Gewicht: Tesla (z.d.). Bruikbare batterij: geschat door EV Database (z.d.). Bereik: berekend met het rekenmodel, vlak, zonder lading en
        zonder wind, tot de batterij leeg is.
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
        <li>luchtweerstand, die groeit met het kwadraat van de snelheid, en meer of minder wordt met de wind</li>
        <li>rolweerstand van de banden, die groeit met het gewicht</li>
        <li>verwarming onder 20 °C en airco boven 22 °C</li>
        <li>opwarmen na een koude start</li>
        <li>elektronica die altijd aanstaat</li>
      </ul>
      <P>Dat alles wordt gedeeld door het rendement van de aandrijving: niet alle energie uit de batterij komt bij de wielen.</P>
      <H>SOORTEN WEG</H>
      <P>
        Op de snelweg rekent het model met een constante snelheid. Voor de bebouwde kom rijdt het seconde per seconde de lage en middelste fase van
        de WLTC-testcyclus (klasse 3b), met optrekken en remmen. Voor de expresweg rijdt het de snelle fase, geschaald naar de limiet. Bij het
        remmen wint de wagen ongeveer 60 % terug.
      </P>
      <H>KOU</H>
      <P>Bij kou levert de batterij minder capaciteit en werkt de aandrijving iets minder efficiënt. Daarbovenop moet de verwarming aan.</P>
      <H>AFGESTEMD OP METINGEN</H>
      <P>
        Luchtweerstand, rolweerstand en verwarming zijn afgestemd op meetpunten. Voor de verwarming bestaan twee varianten: één op basis van
        onderzoek en één op basis van EV Database. Het verschil tussen beide bepaalt de marge die je in Rangy ziet. Het effect van wind is afgestemd
        op rijdata van A Better Routeplanner, het opwarmen op metingen van Idaho National Laboratory en het Amerikaanse Department of Energy.
      </P>
      <Note>Alle parameters en hun bron staan bij Disclaimer &amp; bronnen.</Note>
    </>
  );
}

/* ---------- Factoren ---------- */

function Speed() {
  const rows = useMemo(() => speedRows(), []);
  const v = useMemo(() => speedVariation(), []);
  return (
    <>
      <Lead>Met de slider stel je in hoe snel je op de snelweg rijdt. Hoe sneller, hoe meer energie elke kilometer kost.</Lead>
      <RangeBars rows={rows.map((r) => ({ label: `${r.speedKmh} KM/H`, band: r }))} caption={`SNELWEG · ${AT_20}`} />
      <P>
        De wagen moet de lucht voor zich uit duwen. Die luchtweerstand groeit met het kwadraat van de snelheid: dubbel zo snel is vier keer zoveel
        weerstand. Rolweerstand en elektronica veranderen veel minder.
      </P>
      <P>
        Op de andere wegen speelt de slider geen rol. In de bebouwde kom volgt Rangy een testcyclus, op de expresweg de limiet ± {SPEED_TOLERANCE_KMH}{' '}
        km/u. Kent de route een limiet op de snelweg, dan rijdt Rangy daar nooit sneller dan die limiet + {SPEED_TOLERANCE_KMH} km/u.
      </P>
      <H>CONSTANT OF WISSELEND</H>
      <P>
        De slider is je kruissnelheid: de snelheid die je meestal aanhoudt. Rangy rekent alsof je die constant rijdt. Rij je afwisselend trager en
        sneller, dan kost dat meer, ook al is het gemiddelde hetzelfde. De snelle stukken kosten meer extra dan de trage sparen, omdat de
        luchtweerstand met het kwadraat stijgt.
      </P>
      <RangeBars
        rows={[
          { label: `CONSTANT ${v.avg} KM/H`, band: v.constant },
          { label: `AFWISSELEND ${v.slowKmh} EN ${v.fastKmh} KM/H`, band: v.varied },
        ]}
        caption={`SNELWEG · ELK DE HELFT VAN DE AFSTAND · ${AT_20}`}
      />
      <P>
        Dat scheelt ongeveer {nl1(v.lossPct)} %. Daarbovenop kost elke keer optrekken energie, en bij het remmen win je maar een deel terug. Dat
        rekent Rangy niet mee: wie vaak versnelt en remt, komt minder ver dan Rangy toont.
      </P>
      <Note>
        De afwijking van ± {SPEED_TOLERANCE_KMH} km/u rond de limiet: eigen aanname. Constant tegenover afwisselend: eigen berekening met het model.
        Bij het remmen wint de wagen ongeveer 60 % terug (Armenta-Déu &amp; Cortés, 2023).
      </Note>
    </>
  );
}

function Temperature() {
  return (
    <>
      <WinterPanel />
      <Note>
        <strong className="font-mono text-[12px] text-ink tracking-[0.08em]">WAAROM EEN MARGE? </strong>
        Studies en metingen verschillen in hoe zuinig de verwarming werkt. Rangy toont daarom een bereik. Wat een koude start extra kost, staat bij
        Laden en voorverwarmen.
      </Note>
    </>
  );
}

function Wind() {
  const [w] = useMemo(() => windRows([10]), []);
  return (
    <>
      <Lead>Tegenwind kost extra, rugwind helpt minder dan je zou denken. Op een rit heen en terug verlies je daardoor netto iets.</Lead>
      <RangeBars
        rows={[
          { label: 'ZONDER WIND', band: w.zonder },
          { label: `TEGENWIND ${Math.round(w.kmh)} KM/U`, band: w.tegen },
          { label: `RUGWIND ${Math.round(w.kmh)} KM/U`, band: w.mee },
          { label: `ZIJWIND ${Math.round(w.kmh)} KM/U`, band: w.zij },
          { label: 'HEEN EN TERUG', band: w.heenTerug },
        ]}
        caption={`SNELWEG 110 KM/H · ${BASE.tempC} °C · ZONDER LADING · BEREKEND MET HET MODEL`}
      />
      <P>
        De luchtweerstand hangt af van hoe snel de lucht langs de wagen stroomt: je eigen snelheid plus de tegenwind. Komt de wind schuin, dan
        stijgt de weerstand ook. Rangy neemt de wind van vandaag uit het weerbericht en rekent per stuk van je route, heen en terug apart.
        Zonder route rekent Rangy met het gemiddelde over alle windrichtingen.
      </P>
      <Note>
        Afgesteld op rijdata van Tesla Model 3&apos;s bij 100–120 km/u: 10 m/s tegenwind kost 19 %, zijwind 8 %, rugwind spaart 6 % (Bäcker, 2021).
        Wind op 10 m hoogte is bij de grond zwakker: eigen berekening.
      </Note>
    </>
  );
}

function RoadTypes() {
  const rows = useMemo(() => roadRows(), []);
  const [warm, cold] = rows;
  const max = Math.max(...rows.flatMap((r) => [r.kom.high, r.expres.high, r.snel.high]));
  return (
    <>
      <Lead>Hoe ver je komt, hangt sterk af van de soort weg. Rangy kent er drie.</Lead>
      {rows.map((r) => (
        <RangeBars
          key={r.tempC}
          rows={[
            { label: 'BEBOUWDE KOM', band: r.kom },
            { label: `EXPRESWEG ${EXPRES_LIMIT_KMH} KM/H`, band: r.expres },
            { label: `SNELWEG ${BASE.speedKmh} KM/H`, band: r.snel },
          ]}
          max={max}
          caption={`${degC(r.tempC)} · VLAK · ZONDER LADING · ZONDER WIND · BEREKEND MET HET MODEL`}
        />
      ))}
      <ul className="flex flex-col gap-1.5 list-disc pl-5 text-[15px] leading-[22px]">
        <li>
          <strong>Bebouwde kom:</strong> traag, met veel optrekken en remmen. Bij het remmen win je energie terug.
        </li>
        <li>
          <strong>Expresweg:</strong> wegen buiten de bebouwde kom met een limiet van 70 tot 90 km/u. Rangy rijdt de limiet ± {SPEED_TOLERANCE_KMH}{' '}
          km/u, met af en toe vertragen en optrekken.
        </li>
        <li>
          <strong>Snelweg:</strong> snel en constant. De luchtweerstand bepaalt het verbruik.
        </li>
      </ul>
      <P>
        Bij kou draait de verwarming. Hoe trager je rijdt, hoe langer elke kilometer duurt, en hoe meer verwarming per kilometer. Daardoor zakt het
        bereik in de bebouwde kom het sterkst: van {span(warm.kom)} naar {span(cold.kom)} km, op de snelweg van {span(warm.snel)} naar{' '}
        {span(cold.snel)} km.
      </P>
      <H>JE ROUTE</H>
      <P>
        Kies je bij een rit een bestemming, dan vraagt Rangy de route op bij GraphHopper, van het centrum van je thuisgemeente naar het centrum van
        de bestemming. Elk stuk route krijgt een soort weg op basis van de wegklasse en de snelheidslimiet uit OpenStreetMap: snelwegen en wegen
        vanaf 100 km/u tellen als snelweg, wegen met een limiet van 70 tot 90 km/u als expresweg, de rest als bebouwde kom. Hoofdwegen zonder gekende
        limiet tellen als expresweg.
      </P>
      <P>
        Geef je de afstand zelf in, dan rekent Rangy met de verdeling van de voorbeeldrit, of anders met {Math.round(DEFAULT_MIX.kom * 100)} %
        bebouwde kom, {Math.round(DEFAULT_MIX.expres * 100)} % expresweg en {Math.round(DEFAULT_MIX.snel * 100)} % snelweg.
      </P>
      <Note>
        Indeling in drie soorten weg, standaardverdeling en het midden van een gemeente (gewogen naar waar de adressen liggen): eigen keuze. Adressen:
        BeST Address (FOD BOSA). Expresweg in een rit zonder route: {EXPRES_LIMIT_KMH} km/u, eigen aanname. In Vlaanderen is 70 km/u de
        standaard buiten de bebouwde kom; 90 km/u mag alleen onder voorwaarden, zoals een afgescheiden fietspad (ETSC, 2017).
      </Note>
    </>
  );
}

function Load() {
  const { extraKg, rows } = useMemo(() => loadRows(), []);
  const [city, hwy] = rows;
  return (
    <>
      <Lead>Elke kilo moet mee optrekken en rollen. Dat kost vooral in de bebouwde kom.</Lead>
      <RangeBars
        rows={[
          { label: 'BEBOUWDE KOM · ALLEEN', band: city.empty },
          { label: `BEBOUWDE KOM · +${extraKg} KG`, band: city.loaded },
          { label: 'SNELWEG · ALLEEN', band: hwy.empty },
          { label: `SNELWEG · +${extraKg} KG`, band: hwy.loaded },
        ]}
        caption={`4 PASSAGIERS + 4 STUKS BAGAGE · ${BASE.tempC} °C · VLAK · ZONDER WIND · BEREKEND MET HET MODEL`}
      />
      <P>
        Met een volle wagen kom je in de bebouwde kom ongeveer {Math.round(city.lossPct)} % minder ver, op de snelweg ongeveer{' '}
        {Math.round(hwy.lossPct)} %. In de stad trek je vaak op, en dat kost meer met meer gewicht. Op de snelweg weegt de luchtweerstand zwaarder
        door dan het gewicht.
      </P>
      <P>
        Passagiers en bagage stel je per rit in, bij Mijn ritten. Elke rit op de baan en in je week rekent met zijn eigen lading. Het grote getal
        bovenaan geldt zonder lading.
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
      <Lead>Rangy rekent elke rit als vlak. Je kan het terrein daarom niet instellen.</Lead>
      <P>
        In Vlaanderen zijn de meeste ritten vlak of licht glooiend. Bovendien rij je bij heen en terug evenveel bergop als bergaf, en bergaf wint de
        wagen een deel terug. Je verliest dus alleen het deel dat je niet terugwint. Zo zou het bereik veranderen met afwisselend bergop en bergaf:
      </P>
      <RangeBars
        rows={rows.map((r) => ({ label: `SNELWEG · ${label(r.terrain)}`, band: r.snelweg }))}
        caption={`110 KM/H · ${BASE.tempC} °C · ZONDER LADING · BEREKEND MET HET MODEL`}
      />
      <RangeBars
        rows={rows.map((r) => ({ label: `STAD · ${label(r.terrain)}`, band: r.stad }))}
        caption={`${BASE.tempC} °C · ZONDER LADING · BEREKEND MET HET MODEL`}
      />
      <P>Een rit die netto stijgt, bijvoorbeeld naar de Ardennen, kost wel meer dan Rangy toont.</P>
      <Note>
        Vlak rekenen: eigen keuze. Glooiend = afwisselend {TERRAIN.glooiend.gradePct} % bergop en bergaf, heuvelachtig ={' '}
        {TERRAIN.heuvelachtig.gradePct} %: eigen aanname. Bergaf wint de wagen ongeveer 85 % terug (Armenta-Déu &amp; Cortés, 2023).
      </Note>
    </>
  );
}

/* ---------- Over deze schatting ---------- */

/**
 * Bronnenlijst in APA, gelijk aan de bundel. `use`: waarvoor Rangy de bron gebruikt.
 * Titels die in APA cursief staan, staan tussen <i>.
 */
const SOURCES = [
  { use: 'temperatuur en wind van vandaag', ref: <>API Ninjas. (z.d.). <i>Weather API</i>.</>, url: 'https://api-ninjas.com/api/weather' },
  {
    use: 'wanneer verwarming en airco aanspringen',
    ref: <>Argue, C. (2023, 17 augustus). <i>To what degree does temperature impact EV range?</i> Geotab. Oorspronkelijk gepubliceerd op 25 mei 2020.</>,
    url: 'https://www.geotab.com/uk/blog/ev-range/',
  },
  {
    use: 'terugwinning bergaf en bij remmen',
    ref: <>Armenta-Déu, C., &amp; Cortés, H. (2023). Analysis of kinetic energy recovery systems in electric vehicles. <i>Vehicles, 5</i>(2), 387–403.</>,
    url: 'https://doi.org/10.3390/vehicles5020022',
  },
  {
    use: 'luchtweerstand bij schuine wind',
    ref: (
      <>
        Askerdal, M., Fredriksson, J., &amp; Laine, L. (2024). Development of simplified air drag models including crosswinds for commercial heavy vehicle
        combinations. <i>Vehicle System Dynamics, 62</i>(5), 1085–1102.
      </>
    ),
    url: 'https://research.chalmers.se/publication/535965/file/535965_Fulltext.pdf',
  },
  {
    use: 'effect van tegen-, zij- en rugwind',
    ref: <>Bäcker, J. (2021, 17 juni). <i>Wind influence on Tesla Model 3</i>. A Better Routeplanner.</>,
    url: 'https://abetterrouteplanner.com/resources/article/2021-06-17_wind-influence',
  },
  {
    use: 'basisverbruik elektronica',
    ref: (
      <>
        Carlson, B. (2015, 10 juni). <i>12 volt auxiliary load on-road analysis</i> [Presentatie, 2015 DOE Vehicle Technologies Program Annual Merit
        Review, Project ID VSS168]. Idaho National Laboratory.
      </>
    ),
    url: 'https://www.energy.gov/sites/prod/files/2015/07/f24/vss168carlson2015_o.pdf',
  },
  {
    use: 'snelheidslimieten buiten de bebouwde kom in Vlaanderen',
    ref: <>European Transport Safety Council. (2017, 5 januari). <i>Flanders reduces out of town speed limits</i>.</>,
    url: 'https://etsc.eu/flanders-reduces-out-of-town-speed-limits/',
  },
  {
    use: 'bruikbare batterij, een variant van de verwarming, referentietemperatuur',
    ref: <>EV Database. (z.d.). <i>Tesla Model Y RWD (Juniper)</i>. Geraadpleegd op 2 november 2026, van</>,
    url: 'https://ev-database.org/car/3741/Tesla-Model-Y-RWD',
  },
  {
    use: 'inschrijvingen in België in 2024 (waarom deze wagen)',
    ref: <>Febiac. (2025a). <i>Persbericht: inschrijvingen 2024</i>.</>,
    url: 'https://www.febiac.be/sites/default/files/media/file/2025-01/Persbericht%202024%20NL.pdf',
  },
  {
    use: 'adressen voor het midden van elke gemeente',
    ref: (
      <>
        FOD BOSA. (z.d.). <i>BeST Address</i> [Open data, CC BY 4.0]. Verwerkt door LeKoala (2026), <i>belgian-geography</i> (snapshot 2026-11-05).
      </>
    ),
    url: 'https://opendata.bosa.be/',
  },
  {
    use: 'routes (vermelding: graphhopper.com/attribution)',
    ref: <>GraphHopper. (z.d.). <i>GraphHopper Directions API: Routing API</i> [API-documentatie].</>,
    url: 'https://docs.graphhopper.com/openapi/routing',
  },
  {
    use: 'WLTC klasse 3b als data (snelheid per seconde)',
    ref: <>Joint Research Centre. (2019). <i>wltp</i> (versie 0.1.2a0) [Software, EUPL-licentie]. Europese Commissie.</>,
    url: 'https://pypi.org/project/wltp/',
  },
  {
    use: 'verbruik van de airco',
    ref: (
      <>
        Li, K., Luo, S., Fan, L., Hu, S., Zhou, X., Tu, R., Zhang, H., Jin, X., Zhao, X., &amp; Su, L. (2021). Investigation on the performance and
        characteristics of a heat pump system for electric vehicles under extreme temperature conditions. <i>Case Studies in Thermal Engineering, 27</i>,
        101308.
      </>
    ),
    url: 'https://doi.org/10.1016/j.csite.2021.101308',
  },
  {
    use: 'wegen, wegklassen en snelheidslimieten in de routes',
    ref: <>© OpenStreetMap-bijdragers. (z.d.). <i>OpenStreetMap</i> [Open data, ODbL].</>,
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    use: 'extra verbruik bij een koude start',
    ref: <>Salisbury, S. (2016). <i>Cold weather on-road testing of a 2015 Nissan Leaf</i> (INL/EXT-16-39028). Idaho National Laboratory.</>,
    url: 'https://avt.inl.gov/sites/default/files/pdf/fsev/2015LeafColdWeatherTestJune2016.pdf',
  },
  {
    use: 'rijklaar gewicht',
    ref: <>Tesla. (z.d.). <i>Model Y</i>. Geraadpleegd op 2 november 2026, van</>,
    url: 'https://www.tesla.com/nl_be/modely',
  },
  {
    use: 'testcyclus voor de bebouwde kom en de expresweg (WLTC klasse 3b)',
    ref: (
      <>
        United Nations Economic Commission for Europe. (2014). <i>Global technical regulation No. 15: Worldwide harmonized Light vehicles Test
        Procedure</i> (ECE/TRANS/180/Add.15).
      </>
    ),
    url: 'https://unece.org/transport/standards/transport/vehicle-regulations-wp29/global-technical-regulations-gtrs',
  },
  {
    use: 'rendement van batterij tot wiel',
    ref: <>U.S. Department of Energy &amp; U.S. Environmental Protection Agency. (z.d.). <i>Where the energy goes: Electric cars</i>.</>,
    url: 'https://fueleconomy.gov/feg/atv-ev.shtml',
  },
  {
    use: 'standaardmassa bestuurder en passagier',
    ref: <>Verordening (EU) nr. 1230/2012 van de Commissie van 12 december 2012.</>,
    url: 'https://eur-lex.europa.eu/eli/reg/2012/1230/2019-12-02',
  },
  {
    use: 'warmtepomp en voorverwarmen bij kou',
    ref: (
      <>
        Walsh, P., Isaac, R., Vijayagopal, R., Rousseau, A., Seo, J., &amp; Kim, N. (2024). <i>Impact of cold ambient temperature and extreme
        conditions on electric vehicles</i> (Program Record). U.S. Department of Energy, Vehicle Technologies Office.
      </>
    ),
    url: 'https://www.energy.gov/sites/default/files/2024-10/Impact_of_Cold_Ambient_Temperature_on_BEV_Performance_v15_TechEditFinal_12Sep2024__0.pdf',
  },
  {
    use: 'capaciteit en rendement bij kou',
    ref: (
      <>
        Zhao, C., Li, Y., Yang, Y., Wan, S., Yu, F., Yu, C., Deng, C., Zhou, A., &amp; Shen, X. (2022). Research on electric vehicle range under cold
        condition. <i>Advances in Mechanical Engineering, 14</i>(3), 1–11.
      </>
    ),
    url: 'https://doi.org/10.1177/16878132221087083',
  },
];

function Disclaimer() {
  return (
    <>
      <Lead>Rangy geeft een eerlijke schatting, geen belofte.</Lead>
      <P>
        Alle cijfers gelden voor de referentiewagen. Zeker haalbaar betekent dat je aankomt met nog {RES} % in de batterij; het mogelijke bereik
        gaat tot een lege batterij. Jouw wagen, je rijstijl, het verkeer, wind die anders waait dan voorspeld, hellingen en de staat van de batterij
        kunnen het echte bereik doen afwijken. Gebruik Rangy om te zien wat een EV ongeveer aankan, niet om een rit tot op de kilometer te plannen.
      </P>
      <P>
        Je ritten en je situatie blijven op dit toestel. Rangy vraagt geen account. Voor een route stuurt Rangy alleen het midden van twee gemeenten
        naar GraphHopper, nooit een adres. Voor het weer stuurt Rangy een ruwe locatie (op ± 1 km) of de stad die je kiest naar API Ninjas.
      </P>
      <H>BRONNEN</H>
      <ul className="flex flex-col">
        {SOURCES.map(({ ref, url, use }) => (
          <li key={url} className="flex flex-col gap-1 py-3 border-b border-line last:border-b-0">
            <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">{use}</span>
            <p className="text-[13.5px] leading-[19px]">
              {ref}{' '}
              <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-3 break-all">
                {url}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <Note>Waarden die niet uit een bron komen, zijn eigen berekeningen of aannames en staan zo vermeld bij het onderwerp.</Note>
    </>
  );
}
