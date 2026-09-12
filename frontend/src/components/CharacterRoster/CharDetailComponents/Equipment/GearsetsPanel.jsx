import { useMemo } from "react";
import {
  getGearPieceById,
  getOwnedGearPiecesBySlot,
  getActiveGearsetPatch,
  GEAR_SLOT_KEYS,
} from "../../../../engine/equipmentEngine";

const GEAR_SLOT_LABELS = {
  headgear: "Headgear",
  vest: "Vest",
  gloves: "Gloves",
  equipment: "Equipment",
};

const GearsetsPanel = ({
  gearsets,
  gearSlots,
  logs,
  isEditing,
  onGearSlotChange,
}) => {
  // Restricted to what's actually been bought in Logistics, same as
  // classGadgets/grenades elsewhere in the Gameplay tab.
  const gearOptionsBySlot = useMemo(() => {
    const options = {};
    GEAR_SLOT_KEYS.forEach((slotKey) => {
      options[slotKey] = getOwnedGearPiecesBySlot(gearsets, slotKey, logs);
    });
    return options;
  }, [gearsets, logs]);

  const activePatch = useMemo(
    () => getActiveGearsetPatch(gearsets, gearSlots),
    [gearsets, gearSlots],
  );

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h3 className="font-semibold text-orange-300 mb-1">Gear</h3>
      {/* Patch — only surfaces once all 4 slots share the same gearset. */}
      {activePatch && (
        <div className="flex flex-col border-orange-400/30 border bg-orange-900/20 p-2 mt-4 rounded-xs mb-2">
          <span className="text-xs text-neutral-300 mb-1">Patch</span>
          <p className="font-semibold text-white text-sm">
            {activePatch.name}
            <br />
            <span className="text-orange-400 text-xs italic font-light">
              {activePatch.gearsetName} | {activePatch.manufacturer}
            </span>
          </p>
          <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded whitespace-pre-line flex flex-grow mt-2">
            {activePatch.effect}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {GEAR_SLOT_KEYS.map((slotKey) => {
          const equippedId = gearSlots[slotKey] || "";
          const equippedPiece = getGearPieceById(gearsets, equippedId);
          const options = gearOptionsBySlot[slotKey] || [];
          return (
            <div key={slotKey} className="flex flex-col">
              <span className="text-xs text-neutral-300 mb-1">
                {GEAR_SLOT_LABELS[slotKey]}
              </span>
              {isEditing ? (
                <select
                  className="w-full text-sm bg-neutral-900 text-white border-1 border-orange-400/60 py-2 px-2 rounded"
                  value={equippedId}
                  onChange={(e) => onGearSlotChange(slotKey, e.target.value)}
                >
                  <option value="">None</option>
                  {options.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.gearsetName} — {piece.name}
                      {Number.isFinite(piece.tier) ? ` (T${piece.tier})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-white text-sm">
                  {equippedPiece ? (
                    <span>
                      {equippedPiece.name} <br></br>{" "}
                      <span className="text-orange-400 text-xs italic font-light">
                        {equippedPiece.gearsetName} |{" "}
                        {equippedPiece.manufacturer}
                      </span>
                    </span>
                  ) : (
                    "None Selected"
                  )}
                </p>
              )}

              {equippedPiece && (
                <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded whitespace-pre-line flex flex-grow">
                  {equippedPiece.effect}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GearsetsPanel;
