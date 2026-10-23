import { memo, useMemo } from "react";

const RuleCard = memo(({ rule, term }) => {
  return (
    <section
      id={rule.id}
      className="scroll-mt-[130px] bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-6 border-orange-500 p-4 rounded-sm"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">
          <Highlighter text={rule?.title} terms={[term]}/>
        </h2>
        <span className="text-xs text-orange-400 font-semibold">
          <Highlighter text={rule?.mechanic} terms={[term]}/>
        </span>
      </div>
      <p className="text-xs text-gray-200 whitespace-pre-line">
        <Highlighter text={rule?.description} terms={[term]}/>
      </p>
    </section>
  );
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlighter({ text, terms }) {
  const term = terms[0];
  const parts = useMemo(() => {
    if (!term || !text) return null;
    // Capture group => matches land on odd indices of the split result
    return String(text).split(new RegExp("(" + escapeRegex(term) + ")", "i"));
  }, [text, term]);

  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-orange-500/20 text-orange-300 rounded px-0.5"
          >
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

export default RuleCard;
