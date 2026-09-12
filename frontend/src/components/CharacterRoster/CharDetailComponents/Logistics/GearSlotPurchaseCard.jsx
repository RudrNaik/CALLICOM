import { useState } from "react";
import equipmentData from "../../../../data/Equipment.json";
import gearSetsData from "../../../../data/geasrSets.json";
import {
  getGearSlotBuyOptions,
  createGearSlotPurchase,
  applyPurchase,
} from "../../../../engine/logisticsEngine";
import { getGearPieceCost, GEAR_SLOT_KEYS } from "../../../../engine/equipmentEngine";
import { getMoneyTotal } from "../../../../engine/logsEngine";
import PurchasedList from "./PurchasedList";

const buttonClass = (enabled) =>
  `px-3 py-1 rounded text-xs cursor-pointer ${
    enabled
      ? "bg-orange-600 hover:bg-orange-700"
      : "bg-neutral-700 cursor-not-allowed"
  }`;

const selectClass =
  "w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs";

const tabClass = (active) =>
  `px-2 py-1 rounded text-xs cursor-pointer ${
    active
      ? "bg-orange-600 text-white"
      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
  }`;

/**
 * Inline preview of whatever's currently selected in a picker — cost plus
 * any description/effect/rulesText the data has for it.
 */
function SelectionPreview({ title, cost, description, effect, rulesText }) {
  if (!title) {
    return (
      <div className="text-xs text-gray-400 bg-neutral-900 p-2 rounded">
        Select an item to see its details.
      </div>
    );
  }
  return (
    <div className="text-xs text-gray-400 bg-neutral-900 p-2 rounded">
      <div className="flex items-center justify-between text-neutral-200">
        <span className="font-semibold">{title}</span>
        <span className="text-green-400">${cost}</span>
      </div>
      {description && <div className="whitespace-pre-line">{description}</div>}
      <br></br>
      {effect && (
        <div className="whitespace-pre-line text-orange-300">{effect}</div>
      )}
      {rulesText && <div className="whitespace-pre-line">{rulesText}</div>}
    </div>
  );
}

export const GEAR_SLOT_LABELS = {
  headgear: "Headgear",
  vest: "Vest",
  gloves: "Gloves",
  equipment: "Equipment",
};

/**
 * Same shopping-card pattern as EquipmentPurchaseCard, but for the four
 * gear slots.
 */
function GearSlotPurchaseCard({
  character,
  logs,
  refreshCharacter,
  gearSlotEntries,
  onSell,
}) {
  const [slotKey, setSlotKey] = useState(GEAR_SLOT_KEYS[0]);
  const [pieceId, setPieceId] = useState("");

  const handleSlotChange = (newSlot) => {
    setSlotKey(newSlot);
    setPieceId("");
  };

  // Patch pieces are excluded by getGearSlotBuyOptions (it only ever looks
  // up this one slot, and Patch has its own slot), and already-purchased
  // pieces drop out once bought — each piece, like a gadget, is bought once.
  const options = getGearSlotBuyOptions(character, gearSetsData, slotKey, logs);
  const selected = options.find((piece) => piece.id === pieceId);
  const cost = selected ? getGearPieceCost(selected) : 0;
  const money = getMoneyTotal(character, equipmentData);
  const canBuy = Boolean(pieceId) && money >= cost;

  const handlePurchase = () => {
    const purchase = createGearSlotPurchase({
      slot: slotKey,
      pieceId,
      label: selected ? `${selected.gearsetName} — ${selected.name}` : "",
      cost,
    });
    const result = applyPurchase(
      character,
      logs,
      purchase,
      equipmentData,
      gearSetsData,
    );
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    setPieceId("");
  };

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h2 className="text-xl font-bold text-orange-400 mb-3">Gear Slots</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {GEAR_SLOT_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => handleSlotChange(key)}
                className={tabClass(slotKey === key)}
              >
                {GEAR_SLOT_LABELS[key]}
              </button>
            ))}
          </div>

          <select
            className={selectClass}
            value={pieceId}
            onChange={(e) => setPieceId(e.target.value)}
          >
            <option value="">Select {GEAR_SLOT_LABELS[slotKey]}</option>
            {options.map((piece) => (
              <option key={piece.id} value={piece.id}>
                {piece.gearsetName} — {piece.name} ({getGearPieceCost(piece)})
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Cost: {cost}</span>
            <button
              onClick={handlePurchase}
              disabled={!canBuy}
              className={buttonClass(canBuy)}
            >
              Purchase
            </button>
          </div>

          <div>
            <SelectionPreview
              title={
                selected ? `${selected.gearsetName} — ${selected.name}` : null
              }
              cost={cost}
              effect={selected?.effect}
              description={selected?.flavor}
            />
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-800">
          <PurchasedList
            title="Purchased Gear"
            items={gearSlotEntries}
            onSell={onSell}
          />
        </div>
      </div>
    </div>
  );
}

export default GearSlotPurchaseCard;
