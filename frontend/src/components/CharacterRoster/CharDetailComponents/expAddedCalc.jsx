const EXP_COST = [0, 1, 5, 15, 30];

const BASE_CLASS_XP = 35;
const ATTR_EXP_COST = 40;
const SPEC_EXP_COST = 5;
const MULTICLASS_EXP_COST = 20;
const BASE_ATTR_POINTS = 5;

function skillExp(level) {
  return EXP_COST[Math.min(Math.max(level, 0), 4)] ?? 0;
}

function LedgerRow({ label, value, sub, total = false, indent = false }) {
  return (
    <div
      className={[
        "flex items-baseline justify-between py-1.5",
        total
          ? "border-t border-neutral-600 mt-1 pt-2"
          : "border-t border-neutral-800",
        indent ? "pl-4" : "",
      ].join(" ")}
    >
      <span
        className={
          total
            ? "text-sm font-semibold text-neutral-100"
            : indent
            ? "text-xs text-neutral-500"
            : "text-xs text-neutral-400"
        }
      >
        {label}
        {sub && (
          <span className="ml-2 text-[10px] text-neutral-600">{sub}</span>
        )}
      </span>
      <span
        className={
          total
            ? "text-sm font-bold text-orange-400"
            : indent
            ? "text-xs text-neutral-500"
            : "text-xs font-semibold text-neutral-200"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ExpBreakdown({ character }) {
  const skills = character?.skills ?? {};
  const attrs = character?.attributes ?? {};
  const specializations = character?.specializations ?? [];
  const hasMulticlass = Boolean(character?.multiClass);

  const totalSkillXP = Object.values(skills).reduce(
    (sum, lvl) => sum + skillExp(lvl),
    0
  );

  const totalAttrPoints = Object.values(attrs).reduce((a, b) => a + b, 0);
  const purchasedAttrPoints = Math.max(0, totalAttrPoints - BASE_ATTR_POINTS);
  const attrXP = purchasedAttrPoints * ATTR_EXP_COST;

  const specXP = specializations.length * SPEC_EXP_COST;
  const multiclassXP = hasMulticlass ? MULTICLASS_EXP_COST : 0;

  const totalSpent = totalSkillXP + attrXP + specXP + multiclassXP;
  const skillsXp = Math.max(0, totalSpent - BASE_CLASS_XP - multiclassXP - specXP - attrXP);
  const remainingXP = character?.XP ?? 0;

  return (
    <div className="text-white font-geist">
      <div className="rounded-md bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 px-4 py-3">

        <LedgerRow label="Total XP Spent" value={totalSpent} total />

        <LedgerRow label="Base class" value={BASE_CLASS_XP} />

        {hasMulticlass && (
          <LedgerRow
            label="Multiclass"
            value={multiclassXP}
            sub={character.multiClass}
          />
        )}

        <LedgerRow
          label="Attribute improvement"
          value={attrXP}
          sub={purchasedAttrPoints > 0 ? `${purchasedAttrPoints} × 40` : undefined}
        />

        <LedgerRow label="Skill Improvement" value={skillsXp} />

        <LedgerRow
          label="Specializations"
          value={specXP}
          sub={
            specializations.length > 0
              ? specializations.map((s) => s.label).join(", ")
              : undefined
          }
        />

        {remainingXP > 0 && (
          <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between text-xs">
            <span className="text-neutral-500">Unspent XP</span>
            <span className="text-green-400 font-semibold">{remainingXP}</span>
          </div>
        )}

      </div>
    </div>
  );
}

export default ExpBreakdown;