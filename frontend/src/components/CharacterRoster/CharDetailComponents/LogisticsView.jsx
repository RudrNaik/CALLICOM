import { Fragment, useEffect, useState } from "react";
import equipmentData from "../../../data/Equipment.json";
import gearSetsData from "../../../data/geasrSets.json";
import {
  getWeaponCategoryOptions,
  getWeaponCost,
  getGadgetOptions,
  getGrenadeOptions,
  getGadgetSubmunitionOptions,
  getGearSlotBuyOptions,
  createWeaponPurchase,
  createGadgetPurchase,
  createGrenadePurchase,
  createSubmunitionPurchase,
  createGearSlotPurchase,
  applyPurchase,
  undoLastPurchase,
  sellPurchase,
  getPurchaseEntries,
  getPurchaseCost,
} from "../../../engine/logisticsEngine";
import {
  getPurchasedGadgetIds,
  getGearPieceCost,
  getGearPieceByIdAnyClass,
  GEAR_SLOT_KEYS,
} from "../../../engine/equipmentEngine";
import { getMoneyTotal, ensureStartingLog } from "../../../engine/logsEngine";

const buttonClass = (enabled) =>
  `px-3 py-1 rounded text-xs cursor-pointer ${
    enabled
      ? "bg-orange-600 hover:bg-orange-700"
      : "bg-neutral-700 cursor-not-allowed"
  }`;

const selectClass =
  "w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs";

function WeaponPurchaseForm({
  slot,
  label,
  character,
  logs,
  refreshCharacter,
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [family, setFamily] = useState("");

  const categories = getWeaponCategoryOptions(equipmentData, slot, character);
  const categoryData = categories[category];
  const cost = category ? getWeaponCost(categoryData, family) : 0;
  const money = getMoneyTotal(character, equipmentData);
  const canBuy = Boolean(category) && money >= cost;
  const current = character?.equipment?.[slot];

  const handlePurchase = () => {
    const purchase = createWeaponPurchase({
      slot,
      name,
      category,
      family,
      cost,
    });
    const result = applyPurchase(character, logs, purchase, equipmentData);
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    setName("");
    setCategory("");
    setFamily("");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 border-l-4 border-l-orange-500 rounded-xs p-3 space-y-2">
      <div className="font-semibold text-orange-400">{label}</div>

      <input
        type="text"
        placeholder="Weapon name"
        className={selectClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex gap-2">
        <select
          className={selectClass}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setFamily("");
          }}
        >
          <option value="">Select Category</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {categoryData?.families && (
          <select
            className={selectClass}
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          >
            <option value="">Default</option>
            {categoryData.families.map((f) => (
              <option key={f.family} value={f.family}>
                {f.family}
              </option>
            ))}
          </select>
        )}
      </div>

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
    </div>
  );
}

function GadgetPurchaseSection({ character, logs, refreshCharacter }) {
  const [gadgetId, setGadgetId] = useState("");

  // Gadgets and their submunitions (e.g. UGL 40mm variants) share one
  // dropdown — a submunition is bought individually, same as a gadget, so
  // it's just another option here rather than a separate card. Grouped per
  // gadget (rather than one flat "Submunitions" bucket) so it stays clear
  // which gadget each submunition belongs to once there's more than one.
  //
  // Gated: a gadget already owned drops out of the list (nothing left to
  // buy from it besides its submunitions), and a gadget's submunitions
  // don't appear at all until the gadget itself is owned — you have to buy
  // the thinkpad before its hacks show up. An already-owned submunition
  // drops out the same way its parent gadget does. A gadget with nothing
  // left to offer (owned, and every submunition owned too, or none exist)
  // disappears from the list entirely.
  const unlocked = getPurchasedGadgetIds(logs);
  const gadgets = getGadgetOptions(character, equipmentData);
  const groups = gadgets
    .map((gadget) => {
      const gadgetOwned = unlocked.includes(gadget.id);
      const submunitions = gadgetOwned
        ? getGadgetSubmunitionOptions(gadget, equipmentData).filter(
            (sub) => !unlocked.includes(sub.id),
          )
        : [];
      return { gadget, gadgetOwned, submunitions };
    })
    .filter(({ gadgetOwned, submunitions }) => !gadgetOwned || submunitions.length > 0);
  const options = groups.flatMap(({ gadget, gadgetOwned, submunitions }) => [
    ...(gadgetOwned ? [] : [gadget]),
    ...submunitions,
  ]);
  const selected = options.find((g) => g.id === gadgetId);
  const cost = selected?.cost || 0;
  const money = getMoneyTotal(character, equipmentData);
  const canBuy = Boolean(gadgetId) && money >= cost;

  const currentId = character?.equipment?.gadget;
  const current = equipmentData.find((g) => g.id === currentId);

  const handlePurchase = () => {
    const purchase = selected?.SubMunition
      ? createSubmunitionPurchase({
          submunitionId: gadgetId,
          label: selected?.title,
          cost,
        })
      : createGadgetPurchase({ gadgetId, label: selected?.title, cost });
    const result = applyPurchase(character, logs, purchase, equipmentData);
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    setGadgetId("");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 border-l-4 border-l-orange-500 rounded-xs p-3 space-y-2">
      <div className="font-semibold text-orange-400">Gadgets</div>
      <div className="text-xs text-neutral-400">
        Current: {current?.title || "None equipped"}
      </div>

      <select
        className={selectClass}
        value={gadgetId}
        onChange={(e) => setGadgetId(e.target.value)}
      >
        <option value="">Select Gadget</option>
        {groups.map(({ gadget, gadgetOwned, submunitions }) => (
          <optgroup key={gadget.id} label={gadget.title}>
            {!gadgetOwned && (
              <option value={gadget.id}>
                {gadget.title} ({gadget.cost})
              </option>
            )}
            {submunitions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {`   ${sub.title} (${sub.cost})`}
              </option>
            ))}
          </optgroup>
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
    </div>
  );
}

function GrenadePurchaseForm({ character, logs, refreshCharacter }) {
  const [grenadeId, setGrenadeId] = useState("");

  const options = getGrenadeOptions(equipmentData);
  const selected = options.find((g) => g.id === grenadeId);
  const cost = selected?.cost || 0;
  const money = getMoneyTotal(character, equipmentData);
  const canBuy = Boolean(grenadeId) && money >= cost;

  const grenades = character?.equipment?.grenades ?? [];
  const currentTitles = grenades
    .map((id) => options.find((g) => g.id === id)?.title)
    .filter(Boolean);

  const handlePurchase = () => {
    const purchase = createGrenadePurchase({
      grenadeId,
      label: selected?.title,
      cost,
    });
    const result = applyPurchase(character, logs, purchase, equipmentData);
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    setGrenadeId("");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 border-l-4 border-l-orange-500 rounded-xs p-3 space-y-2">
      <div className="font-semibold text-orange-400">Grenades</div>
      <select
        className={selectClass}
        value={grenadeId}
        onChange={(e) => setGrenadeId(e.target.value)}
      >
        <option value="">Select Grenade</option>
        {options.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title} ({g.cost})
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
    </div>
  );
}

const GEAR_SLOT_LABELS = {
  headgear: "Headgear",
  vest: "Vest",
  gloves: "Gloves",
  equipment: "Equipment",
};

function GearSlotPurchaseForm({ slotKey, character, logs, refreshCharacter }) {
  const [pieceId, setPieceId] = useState("");

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
    const result = applyPurchase(character, logs, purchase, equipmentData, gearSetsData);
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    setPieceId("");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 border-l-4 border-l-orange-500 rounded-xs p-3 space-y-2">
      <div className="font-semibold text-orange-400">
        {GEAR_SLOT_LABELS[slotKey]}
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

      {selected && (
        <div className="text-[10px] text-neutral-400 bg-neutral-800 p-2 rounded whitespace-pre-line">
          {selected.effect}
        </div>
      )}

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
    </div>
  );
}

/**
 * Renders a sold/owned list. Items may carry an optional `group` label (e.g.
 * a gearset's name) — when any do, a divider + header is inserted wherever
 * the group changes between adjacent items, so callers that want grouping
 * just need to sort `items` so same-group entries are adjacent first (see
 * gearSlotEntries below). Callers with no `group` field render exactly as
 * before: one flat list.
 */
function PurchasedList({ title, items, onSell }) {
  if (items.length === 0) return null;
  const hasGroups = items.some((item) => typeof item !== "string" && item.group);

  return (
    <div className="h-full bg-neutral-900 border border-neutral-700 rounded p-3">
      <div className="text-xs text-orange-400 mb-1">{title}</div>
      <ul className="text-xs text-neutral-300 space-y-1">
        {items.map((item, index) => {
          const group = typeof item === "string" ? null : item.group;
          const prevGroup =
            index > 0 && typeof items[index - 1] !== "string"
              ? items[index - 1].group
              : null;
          const isNewGroup = hasGroups && group !== prevGroup;

          return (
            <Fragment key={index}>
              {isNewGroup && (
                <li
                  className={`text-[10px] uppercase tracking-wide text-neutral-500 pt-1 ${
                    index > 0 ? "mt-1 border-t border-neutral-700" : ""
                  }`}
                >
                  {group || "Other"}
                </li>
              )}
              <li className="flex items-center justify-between gap-2">
                <span>{typeof item === "string" ? item : item.label}</span>
                {onSell &&
                  typeof item !== "string" &&
                  (item.sellable ? (
                    <button
                      onClick={() => onSell(item)}
                      className="text-neutral-500 hover:text-red-400 shrink-0 cursor-pointer"
                    >
                      Sell
                    </button>
                  ) : (
                    <span className="text-neutral-700 shrink-0">N/A</span>
                  ))}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}

function LogisticsView({ character, refreshCharacter }) {
  const money = getMoneyTotal(character, equipmentData);
  const logs = ensureStartingLog(character, character?.logs ?? []);

  // Guarantees the starting log exists even if this tab is opened before the
  // Logs tab ever is (see LogsView's matching effect / createStartingLog).
  useEffect(() => {
    if (!character?.logs || character.logs.length === 0) {
      refreshCharacter({ logs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.logs?.length]);

  const handleSell = (entry) => {
    const result = sellPurchase(
      character,
      logs,
      entry.missionIndex,
      entry.purchaseIndex,
      equipmentData,
    );
    if (!result) return;
    refreshCharacter(result);
  };

  // Nothing here is stored on the character — all derived fresh from `logs`
  // each render (see logisticsEngine.getPurchaseEntries). Only purchases on
  // the current buy period (the most recently logged mission) are
  // `sellable` — anything from an older mission is committed for good (see
  // logisticsEngine.sellPurchase).
  const currentMissionIndex = logs.length - 1;
  const purchasedGadgetIds = getPurchasedGadgetIds(logs);
  const gadgetEntries = getPurchaseEntries(logs, "gadget")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const gadget = equipmentData.find((g) => g.id === purchase.value);
      if (!gadget) return null;
      const submunitions = getGadgetSubmunitionOptions(gadget, equipmentData);
      const unlockedCount = submunitions.filter(
        (sub) => !sub.cost || purchasedGadgetIds.includes(sub.id),
      ).length;
      const submunitionNote =
        submunitions.length > 0
          ? ` — ${unlockedCount}/${submunitions.length} submunitions unlocked`
          : "";
      return {
        label: `${gadget.title}${submunitionNote}`,
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .filter(Boolean);

  // Listed alongside their parent gadget rather than folded into just the
  // "X/Y unlocked" count on it, so each one can be sold on its own (see
  // logisticsEngine.sellPurchase — selling the parent gadget instead sells
  // these too, if they're still in the same buy period).
  const submunitionEntries = getPurchaseEntries(logs, "submunition")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const submunition = equipmentData.find((i) => i.id === purchase.value);
      if (!submunition) return null;
      const parentGadget = equipmentData.find((item) =>
        (item.options ?? []).some((option) => option.id === submunition.id),
      );
      return {
        label: parentGadget
          ? `${parentGadget.title}: ${submunition.title}`
          : submunition.title,
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .filter(Boolean);

  const weaponEntries = getPurchaseEntries(logs, "weapon").map(
    ({ missionIndex, purchaseIndex, purchase }) => ({
      label: `${purchase.value.name || "Unnamed Weapon"} (${purchase.value.category}${
        purchase.value.family ? ` / ${purchase.value.family}` : ""
      })`,
      missionIndex,
      purchaseIndex,
      sellable: missionIndex === currentMissionIndex,
    }),
  );

  const grenadeEntries = getPurchaseEntries(logs, "grenade").map(
    ({ missionIndex, purchaseIndex, purchase }) => ({
      label:
        equipmentData.find((g) => g.id === purchase.value)?.title ||
        purchase.value,
      missionIndex,
      purchaseIndex,
      sellable: missionIndex === currentMissionIndex,
    }),
  );

  // Grouped by gearset (see PurchasedList) so it's clear at a glance how
  // much of a set you actually own — the gearset name only needs to appear
  // once, as the group header, rather than repeated on every line. Sorted so
  // same-gearset entries end up adjacent for that grouping to work; "Other"
  // (a piece whose gearset can no longer be found in geasrSets.json) always
  // sorts last.
  const gearSlotEntries = getPurchaseEntries(logs, "gearSlot")
    .map(({ missionIndex, purchaseIndex, purchase }) => {
      const piece = getGearPieceByIdAnyClass(gearSetsData, purchase.value);
      const slotLabel = GEAR_SLOT_LABELS[purchase.slot] || purchase.slot;
      return {
        label: piece ? `${slotLabel}: ${piece.name}` : `${slotLabel}: ${purchase.label}`,
        group: piece?.gearsetName || "Other",
        missionIndex,
        purchaseIndex,
        sellable: missionIndex === currentMissionIndex,
      };
    })
    .sort((a, b) => {
      if (a.group === b.group) return 0;
      if (a.group === "Other") return 1;
      if (b.group === "Other") return -1;
      return a.group.localeCompare(b.group);
    });

  const latestReceipt = logs[logs.length - 1]?.receipt;
  const latestPurchases = latestReceipt?.purchases ?? [];
  const lastPurchase = latestPurchases[latestPurchases.length - 1];

  const handleUndoLastPurchase = () => {
    const result = undoLastPurchase(character, logs, equipmentData);
    if (!result) return;
    refreshCharacter(result);
  };

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-sm inline-block">
          <span className="block text-xs text-neutral-400">Current Cash</span>
          <span className="text-lg font-bold text-green-400">${money}</span>
        </div>
      </div>

      <div>
        <div className="grid md:grid-cols-4 gap-2">
          <GadgetPurchaseSection
            character={character}
            logs={logs}
            refreshCharacter={refreshCharacter}
          />

          <WeaponPurchaseForm
            slot="primaryWeapon"
            label="Primary Weapon"
            character={character}
            logs={logs}
            refreshCharacter={refreshCharacter}
          />
          <WeaponPurchaseForm
            slot="secondaryWeapon"
            label="Secondary Weapon"
            character={character}
            logs={logs}
            refreshCharacter={refreshCharacter}
          />
          <GrenadePurchaseForm
            character={character}
            logs={logs}
            refreshCharacter={refreshCharacter}
          />
        </div>
        <div className="mt-2 flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-1/4">
            <PurchasedList
              title="Purchased Gadgets"
              items={[...gadgetEntries, ...submunitionEntries]}
              onSell={handleSell}
            />
          </div>
          <div className="w-full md:w-2/4">
            <PurchasedList
              title="Purchased Weapons"
              items={weaponEntries}
              onSell={handleSell}
            />
          </div>
          <div className="w-full md:w-1/4">
            <PurchasedList
              title="Purchased Grenade Types"
              items={grenadeEntries}
              onSell={handleSell}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-orange-400 mb-2">Gear Slots</h2>
        <div className="grid md:grid-cols-4 gap-2">
          {GEAR_SLOT_KEYS.map((slotKey) => (
            <GearSlotPurchaseForm
              key={slotKey}
              slotKey={slotKey}
              character={character}
              logs={logs}
              refreshCharacter={refreshCharacter}
            />
          ))}
        </div>
        <div className="mt-2 grid md:grid-cols-4 gap-2">
          <div className="md:col-span-4">
            <PurchasedList
              title="Purchased Gear"
              items={gearSlotEntries}
              onSell={handleSell}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogisticsView;
