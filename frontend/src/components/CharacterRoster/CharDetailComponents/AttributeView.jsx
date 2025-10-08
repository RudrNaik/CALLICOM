function AttributeView({ attributes, xp, isEditing, onBuy }) {
  const items = [
    { key: "Expertise", label: "Alertness" },
    { key: "Body", label: "Body" },
    { key: "Intelligence", label: "Intelligence" },
    { key: "Spirit", label: "Spirit" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      {items.map(({ key, label }) => {
        const val = attributes?.[key] ?? 0;
        const canBuy = isEditing && xp >= 40;
        return (
          <div
            key={key}
            className="bg-gradient-to-t from-neutral-800 to-neutral-850 p-2 rounded"
          >
            <div className="font-semibold text-orange-300">{label}</div>
            <div className="flex items-center gap-2">
              <span>{val}</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onBuy?.(key)}
                  disabled={!canBuy}
                  title="Increase attribute (40 XP)"
                  className={`px-2 py-0.5 rounded text-xs
                    ${canBuy
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-neutral-700 cursor-not-allowed"}`}
                >
                  40 XP
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
