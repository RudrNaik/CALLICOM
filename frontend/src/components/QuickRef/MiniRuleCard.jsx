import { memo } from "react";

const RuleCard = memo(({ rule }) => {
  return (
    <section
      id={rule.id}
      className="scroll-mt-[130px] bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-6 border-orange-500 p-4 rounded-sm"
      style={{ fontFamily: "Geist_Mono", contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2
          className="text-xl font-bold"
          dangerouslySetInnerHTML={{ __html: rule.titleHtml }}
        />
      </div>
      <div
        className="rule-body text-xs text-gray-200 whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: rule.bodyHtml }}
      />
    </section>
  );
});

export default RuleCard;
