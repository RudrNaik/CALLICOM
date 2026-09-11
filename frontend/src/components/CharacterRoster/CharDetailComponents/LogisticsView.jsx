import { useEffect, useState } from "react";
import equipmentData from "../../../data/Equipment.json";
import {
  getWeaponCategoryOptions,
  getWeaponCost,
  getGadgetOptions,
  getGrenadeOptions,
  getGadgetSubmunitionOptions,
  createWeaponPurchase,
  createGadgetPurchase,
  createGrenadePurchase,
  createSubmunitionPurchase,
  applyPurchase,
  undoLastPurchase,
} from "../../../engine/logisticsEngine";
import {
  getPurchasedGadgetIds,
  getPurchasedWeapons,
  getPurchasedGrenadeIds,
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
  const money = getMoneyTotal(character);
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
    const result = applyPurchase(character, logs, purchase);
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
  const gadgets = getGadgetOptions(character, equipmentData);
  const groups = gadgets.map((gadget) => ({
    gadget,
    submunitions: getGadgetSubmunitionOptions(gadget, equipmentData),
  }));
  const options = groups.flatMap(({ gadget, submunitions }) => [
    gadget,
    ...submunitions,
  ]);
  const selected = options.find((g) => g.id === gadgetId);
  const cost = selected?.cost || 0;
  const money = getMoneyTotal(character);
  const canBuy = Boolean(gadgetId) && money >= cost;

  const currentId = character?.equipment?.gadget;
  const current = equipmentData.find((g) => g.id === currentId);
  const unlocked = getPurchasedGadgetIds(logs);

  const handlePurchase = () => {
    const purchase = selected?.SubMunition
      ? createSubmunitionPurchase({
          submunitionId: gadgetId,
          label: selected?.title,
          cost,
        })
      : createGadgetPurchase({ gadgetId, label: selected?.title, cost });
    const result = applyPurchase(character, logs, purchase);
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
        {groups.map(({ gadget, submunitions }) => (
          <optgroup key={gadget.id} label={gadget.title}>
            <option value={gadget.id}>
              {gadget.title} ({gadget.cost})
              {unlocked.includes(gadget.id) ? " — Owned" : ""}
            </option>
            {submunitions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {`   ${sub.title} (${sub.cost})${unlocked.includes(sub.id) ? " — Owned" : ""}`}
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
  const money = getMoneyTotal(character);
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
    const result = applyPurchase(character, logs, purchase);
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

function PurchasedList({ title, items }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded p-3">
      <div className="text-xs text-orange-400 mb-1">{title}</div>
      <ul className="text-xs text-neutral-300 space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const GEAR_SLOT_LABELS = ["Headgear", "Vest", "Equipment", "Gloves"];

function LogisticsView({ character, refreshCharacter }) {
  const money = getMoneyTotal(character);
  const logs = ensureStartingLog(character, character?.logs ?? []);

  // Guarantees the starting log exists even if this tab is opened before the
  // Logs tab ever is (see LogsView's matching effect / createStartingLog).
  useEffect(() => {
    if (!character?.logs || character.logs.length === 0) {
      refreshCharacter({ logs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.logs?.length]);

  // Nothing here is stored on the character — all derived fresh from
  // `logs` each render (see equipmentEngine.getPurchased*), so removing a
  // mission or undoing a purchase updates these for free.
  const purchasedGadgetIds = getPurchasedGadgetIds(logs);
  const ownedGadgetTitles = purchasedGadgetIds
    .map((id) => equipmentData.find((g) => g.id === id))
    .filter((gadget) => !gadget?.SubMunition)
    .map((gadget) => {
      const submunitions = getGadgetSubmunitionOptions(gadget, equipmentData);
      const unlockedCount = submunitions.filter(
        (sub) => !sub.cost || purchasedGadgetIds.includes(sub.id),
      ).length;
      const submunitionNote =
        submunitions.length > 0
          ? ` — ${unlockedCount}/${submunitions.length} submunitions unlocked`
          : "";
      return `${gadget.title}${submunitionNote}`;
    });

  const ownedWeaponLabels = getPurchasedWeapons(logs).map(
    (w) =>
      `${w.name || "Unnamed Weapon"} (${w.category}${w.family ? ` / ${w.family}` : ""})`,
  );

  const ownedGrenadeTitles = getPurchasedGrenadeIds(logs).map(
    (id) => equipmentData.find((g) => g.id === id)?.title || id,
  );

  const latestReceipt = logs[logs.length - 1]?.receipt;
  const latestPurchases = latestReceipt?.purchases ?? [];
  const lastPurchase = latestPurchases[latestPurchases.length - 1];

  const handleUndoLastPurchase = () => {
    const result = undoLastPurchase(character, logs);
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

        {lastPurchase && (
          <div className="bg-neutral-900 border border-neutral-700 rounded p-2 flex items-center gap-3">
            <div className="text-xs text-neutral-400">
              Last purchase:{" "}
              <span className="text-neutral-200">{lastPurchase.label}</span> (
              -${lastPurchase.cost})
            </div>
            <button
              onClick={handleUndoLastPurchase}
              className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer"
              title="Undo this purchase — only available until the next mission is logged"
            >
              Undo
            </button>
          </div>
        )}
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
        <div className="mt-2 grid md:grid-cols-4 gap-2 ">
          <PurchasedList title="Purchased Gadgets" items={ownedGadgetTitles} />
          <div className="md:col-span-2">
          <PurchasedList title="Purchased Weapons" items={ownedWeaponLabels} />
          </div>
          <PurchasedList title="Purchased Grenade Types" items={ownedGrenadeTitles}/>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-orange-400 mb-2">Gear Slots</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {GEAR_SLOT_LABELS.map((label) => (
            <div
              key={label}
              className="bg-neutral-900 border border-neutral-700 rounded p-3 text-xs text-neutral-500 italic"
            >
              {label}: Coming soon.
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LogisticsView;
