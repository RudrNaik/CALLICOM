const RuleCard = ({ rule }) => {
  return (
    <section
      id={rule.id}
      className="scroll-mt-[130px] bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">{rule.title}</h2>
        <span className="text-xs text-orange-400 font-semibold">
          {rule.mechanic}
        </span>
      </div>
      <p className="text-sm text-gray-200 whitespace-pre-line">
        {rule.description}
      </p>
    </section>
  );
};

export default RuleCard;
