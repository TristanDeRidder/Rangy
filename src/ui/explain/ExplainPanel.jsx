import { GROUPS, TOPICS, topicById } from './topics.jsx';

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Overzicht van alle onderwerpen, per groep. */
function Index({ onTopic }) {
  return (
    <>
      <p className="text-[15px] leading-[22px]">Hoe Rangy rekent, met welke wagen en wat het bereik verandert.</p>
      {GROUPS.map((g) => (
        <section key={g.id} className="flex flex-col mt-3" aria-labelledby={`groep-${g.id}`}>
          <h3 id={`groep-${g.id}`} className="font-mono text-[11px] text-muted tracking-[0.12em]">{g.label}</h3>
          <ul>
            {TOPICS.filter((t) => t.group === g.id).map((t) => (
              <li key={t.id} className="border-b border-line">
                <button type="button" className="w-full flex items-center gap-3 py-3 text-left" onClick={() => onTopic(t.id)}>
                  <span className="flex-1 flex flex-col gap-0.75">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold tracking-[0.08em]">{t.title.toUpperCase()}</span>
                      {t.video && (
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-ink text-white font-mono text-[9px] font-medium tracking-[0.06em]">▶ VIDEO</span>
                      )}
                    </span>
                    <span className="text-[13.5px] leading-[18px] text-muted">{t.sub}</span>
                  </span>
                  <Chevron />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/**
 * Inhoud van het Uitleg-paneel: het overzicht, of één onderwerp.
 * Titel, terugknop en sluiten regelt het Panel in App.jsx.
 */
export default function ExplainPanel({ topic, onTopic, scene }) {
  const t = topic && topicById(topic);
  if (!t) return <Index onTopic={onTopic} />;
  const { Body } = t;
  return <Body scene={scene} />;
}

export { topicById };
