import {
  getXPBreakdown,
  getAvailableXP,
} from "../../../engine/characterEngine";
import { getLogTotals } from "../../../engine/logsEngine";

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
  const specializations = character?.specializations ?? [];
  const hasMulticlass = Boolean(character?.multiClass);

  const {
    totalSpent,
    skillsXp,
    attrXP,
    specXP,
    multiclassXP,
    purchasedAttrPoints,
    emergencyDiceXPSpent,
    baseClassXP,
  } = getXPBreakdown(character);

  const bonusXP = character?.XP ?? 0;
  const missionXPTotal = getLogTotals(character?.logs).totalMissionXP;
  const availableXP = getAvailableXP(character, missionXPTotal);

  return (
    <div className="text-white font-geist">
      <div className="rounded-xs bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-3 py-2">

        <LedgerRow label="Total XP Spent" value={totalSpent} total />

        <LedgerRow label="Base class" value={baseClassXP} />

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

        {emergencyDiceXPSpent > 0 && (
          <LedgerRow label="Emergency Dice" value={emergencyDiceXPSpent} />
        )}

        <LedgerRow label="Bonus XP" value={bonusXP} indent />
        <LedgerRow label="Mission XP" value={missionXPTotal} indent />

        <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between text-xs">
          <span className="text-neutral-500">Available XP</span>
          <span className="text-green-400 font-semibold">{availableXP}</span>
        </div>

      </div>
    </div>
  );
}

export default ExpBreakdown;