import { getArmorClassDescription } from "../../../engine/equipmentEngine";

/**
 * Renders the armor-class flavor text; only shown for AC0/1/2/4+ to match
 * the original panel's blank-vs-text rendering at AC3 (n/a — see
 * equipmentEngine.getArmorClassDescription).
 */
const renderArmorClassDescription = (armorClass) => {
  if (armorClass == 0) {
    return (
      <span className="text-xs text-neutral-400">
        {getArmorClassDescription(armorClass)}
      </span>
    );
  }
  if (armorClass == 1 || armorClass == 2 || armorClass >= 4) {
    return (
      <p className="text-xs text-neutral-400">
        {getArmorClassDescription(armorClass)}
      </p>
    );
  }
  return null;
};

const ArmorMedicalPanel = ({
  armorClass,
  maxArmor,
  safeMedCounts,
  isEditing,
  charActive,
  onArmorChange,
  onMedCountsChange,
}) => {
  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h3 className="font-semibold text-orange-300 ">Armor/Medical</h3>
      {isEditing ? (
        <div>
          <div>
            <input
              type="number"
              min={0}
              max={maxArmor}
              className="w-full bg-neutral-900 border-1 border-orange-400/60 text-white p-2 rounded-xs"
              value={armorClass}
              onChange={(e) => {
                let val = parseInt(e.target.value, 10);
                if (Number.isNaN(val)) val = 0;
                if (maxArmor > 0 && val > maxArmor) return; // cap
                onArmorChange(val);
              }}
            />
          </div>
          <div className="text-xs">{renderArmorClassDescription(armorClass)}</div>
        </div>
      ) : (
        <div>
          <p>
            <span>AC{armorClass}</span>
          </p>
          <div className="text-xs whitespace-pre-line">
            {renderArmorClassDescription(armorClass)}
          </div>
        </div>
      )}

      {/* Medicine and meds. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        {["AFAK", "IFAK"].map((med, i) => (
          <div key={med} className="text-sm text-white space-y-1">
            <p>
              <span className="font-semibold text-neutral-300">{med}</span>
            </p>
            <p className="px-2 py-1 rounded-xs bg-neutral-900 mb-2">
              <span className="text-yellow-400">{safeMedCounts[i]}</span>{" "}
              <span className="text-gray-400 italic">remaining</span>
            </p>
            {charActive ? (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const updated = [...safeMedCounts];
                    updated[i] = Math.max(0, updated[i] - 1);
                    onMedCountsChange(updated);
                  }}
                  disabled={safeMedCounts[i] === 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                >
                  Use
                </button>
                <button
                  onClick={() => {
                    const updated = [...safeMedCounts];
                    updated[i] = i === 1 ? 2 : 1; // default: AFAK = 2, others = 1
                    onMedCountsChange(updated);
                  }}
                  className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                >
                  Resupply
                </button>
              </div>
            ) : (
              <></>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArmorMedicalPanel;
