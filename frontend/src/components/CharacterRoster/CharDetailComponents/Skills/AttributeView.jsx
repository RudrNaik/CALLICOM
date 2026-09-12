import { ATTR_EXP_COST } from "../../../../engine/characterEngine";

function AttributeView({
  attributes,
  originalAttributes,
  xp,
  isEditing,
  onIncrease,
  onDecrease,
}) {
  const items = [
    { key: "Alertness", label: "Alertness" },
    { key: "Body", label: "Body" },
    { key: "Intelligence", label: "Intelligence" },
    { key: "Spirit", label: "Spirit" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      {items.map(({ key, label }) => {
        const val = attributes?.[key] ?? 0;
        function canBuy(attr){ 
           return isEditing && xp >= ATTR_EXP_COST && attr<4;
        }
        const canSell = isEditing && val > (originalAttributes?.[key] ?? 0);
        return (
          <div
            key={key}
            className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded"
          >
            <div className="font-semibold text-orange-300">{label}</div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onDecrease?.(key)}
                  disabled={!canSell}
                  title="Undo attribute increase (refund 40 XP)"
                  className={`px-2 py-0.5 rounded text-xs
                    ${canSell
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-neutral-700 cursor-not-allowed"}`}
                >
                  -
                </button>
              )}
              <span>{val}</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onIncrease?.(key)}
                  disabled={!canBuy(val)}
                  title="Increase attribute (40 XP)"
                  className={`px-2 py-0.5 rounded text-xs
                    ${canBuy(val)
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-neutral-700 cursor-not-allowed"}`}
                >
                  {ATTR_EXP_COST} XP
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AttributeView;
