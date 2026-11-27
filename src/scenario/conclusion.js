/**
 * Conclusie in gewone taal bij de baan (gsm): wat haal je, en waar moet je laden?
 * Na de gebruikerstest: gebruikers wisten niet wat ze met de baan moesten doen na het invullen van hun ritten.
 *
 * Regels (eigen keuze):
 *  - eerst de drukste dag: "haal je zeker", "hangt ervan af" of "moet je onderweg laden"
 *  - daarna alleen de ritten die af en toe terugkomen en niet zeker lukken; bij meer dan één: "2 ritten"
 *  - lukt alles: "Al je ritten haal je zeker."
 *  - geen ritten met een afstand: een oproep om ritten toe te voegen
 * De drukste dag rekent met een volle batterij, net als de baan.
 *
 * @param {{ busiest: { km: number, status: string } | null, occasional: { name: string, distanceKm: number, status: string }[] }} plan
 * @returns {string}
 */
export function conclusion(plan) {
  const busiest = plan.busiest && plan.busiest.km > 0 ? plan.busiest : null;
  const occ = plan.occasional.filter((o) => o.distanceKm > 0);
  if (!busiest && !occ.length) return 'Voeg je ritten toe om te zien wat je haalt.';

  const marge = occ.filter((o) => o.status === 'marge');
  const laden = occ.filter((o) => o.status === 'laadstop');
  const busiestOk = !busiest || busiest.status === 'haalbaar';
  if (busiestOk && !marge.length && !laden.length) return 'Al je ritten haal je zeker.';

  const sentences = [];
  if (busiest) {
    sentences.push(
      {
        haalbaar: 'Je drukste dag haal je zeker.',
        marge: 'Je drukste dag hangt ervan af.',
        laadstop: 'Op je drukste dag moet je onderweg laden.',
      }[busiest.status],
    );
  }

  const parts = [];
  if (marge.length === 1) parts.push(`${marge[0].name} hangt ervan af`);
  if (marge.length > 1) parts.push(`${marge.length} ritten hangen ervan af`);
  if (laden.length === 1) parts.push(`voor ${laden[0].name} moet je onderweg laden`);
  if (laden.length > 1) parts.push(`voor ${laden.length} ritten moet je onderweg laden`);
  if (parts.length) {
    const s = parts.join(', ');
    sentences.push(`${s[0].toUpperCase()}${s.slice(1)}.`);
  } else if (occ.length) {
    sentences.push(occ.length === 1 ? `${occ[0].name} haal je zeker.` : 'Je andere ritten haal je zeker.');
  }
  return sentences.join(' ');
}
