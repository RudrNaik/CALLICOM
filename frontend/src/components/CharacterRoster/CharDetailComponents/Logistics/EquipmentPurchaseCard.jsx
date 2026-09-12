import { useState } from "react";
import equipmentData from "../../../../data/Equipment.json";
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
} from "../../../../engine/logisticsEngine";
import { getPurchasedGadgetIds } from "../../../../engine/equipmentEngine";
import { getMoneyTotal } from "../../../../engine/logsEngine";
import PurchasedList from "./PurchasedList";

const buttonClass = (enabled) =>
  `px-3 py-1 rounded-xs text-xs cursor-pointer ${
    enabled
      ? "bg-orange-600 hover:bg-orange-700"
      : "bg-neutral-700 cursor-not-allowed"
  }`;

const selectClass =
  "w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-sm";

const tabClass = (active) =>
  `px-2 py-1 rounded-xs text-xs cursor-pointer ${
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

const EQUIPMENT_TYPES = [
  { key: "gadget", label: "Gadget" },
  { key: "primaryWeapon", label: "Primary Weapon" },
  { key: "secondaryWeapon", label: "Secondary Weapon" },
  { key: "grenade", label: "Grenade" },
];

/**
 * Single shopping card for gadgets/weapons/grenades: pick a type via the
 * tabs, then narrow down to an item — one set of controls and one preview
 * pane instead of four separate cards (which used to stack and clip into
 * whatever section followed once their inline previews grew tall).
 */
function EquipmentPurchaseCard({
  character,
  logs,
  refreshCharacter,
  gadgetEntries,
  submunitionEntries,
  weaponEntries,
  grenadeEntries,
  onSell,
}) {
  const [type, setType] = useState("gadget");
  const [weaponName, setWeaponName] = useState("");
  const [category, setCategory] = useState("");
  const [family, setFamily] = useState("");
  const [gadgetId, setGadgetId] = useState("");
  const [grenadeId, setGrenadeId] = useState("");

  const money = getMoneyTotal(character, equipmentData);
  const isWeapon = type === "primaryWeapon" || type === "secondaryWeapon";

  const resetSelectors = () => {
    setWeaponName("");
    setCategory("");
    setFamily("");
    setGadgetId("");
    setGrenadeId("");
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    resetSelectors();
  };

  // Weapon selection
  const categories = isWeapon
    ? getWeaponCategoryOptions(equipmentData, type, character)
    : {};
  const categoryData = categories[category];
  const weaponCost = category ? getWeaponCost(categoryData, family) : 0;

  // Gadget selection — see GadgetPurchaseSection's old comment: submunitions
  // share the gadget dropdown, grouped under their parent, gated on the
  // parent being owned already.
  const unlocked = getPurchasedGadgetIds(logs);
  const gadgets = getGadgetOptions(character, equipmentData);
  const gadgetGroups = gadgets
    .map((gadget) => {
      const gadgetOwned = unlocked.includes(gadget.id);
      const submunitions = gadgetOwned
        ? getGadgetSubmunitionOptions(gadget, equipmentData).filter(
            (sub) => !unlocked.includes(sub.id),
          )
        : [];
      return { gadget, gadgetOwned, submunitions };
    })
    .filter(
      ({ gadgetOwned, submunitions }) =>
        !gadgetOwned || submunitions.length > 0,
    );
  const gadgetOptions = gadgetGroups.flatMap(
    ({ gadget, gadgetOwned, submunitions }) => [
      ...(gadgetOwned ? [] : [gadget]),
      ...submunitions,
    ],
  );
  const selectedGadget = gadgetOptions.find((g) => g.id === gadgetId);

  // Grenade selection
  const grenadeOptions = getGrenadeOptions(equipmentData);
  const selectedGrenade = grenadeOptions.find((g) => g.id === grenadeId);

  let cost = 0;
  let canBuy = false;
  let preview = null;

  if (type === "gadget") {
    cost = selectedGadget?.cost || 0;
    canBuy = Boolean(gadgetId) && money >= cost;
    preview = selectedGadget && {
      title: selectedGadget.title,
      description: selectedGadget.description,
      rulesText: selectedGadget.rulesText,
    };
  } else if (isWeapon) {
    cost = weaponCost;
    canBuy = Boolean(category) && money >= cost;
    preview = category && {
      title: category,
      description: categoryData?.description,
      effect: categoryData?.families?.find((f) => f.family === family)?.effect,
    };
  } else {
    cost = selectedGrenade?.cost || 0;
    canBuy = Boolean(grenadeId) && money >= cost;
    preview = selectedGrenade && {
      title: selectedGrenade.title,
      description: selectedGrenade.description,
      rulesText: selectedGrenade.rulesText,
    };
  }

  const handlePurchase = () => {
    let purchase;
    if (type === "gadget") {
      purchase = selectedGadget?.SubMunition
        ? createSubmunitionPurchase({
            submunitionId: gadgetId,
            label: selectedGadget?.title,
            cost,
          })
        : createGadgetPurchase({
            gadgetId,
            label: selectedGadget?.title,
            cost,
          });
    } else if (isWeapon) {
      purchase = createWeaponPurchase({
        slot: type,
        name: weaponName,
        category,
        family,
        cost,
      });
    } else {
      purchase = createGrenadePurchase({
        grenadeId,
        label: selectedGrenade?.title,
        cost,
      });
    }
    const result = applyPurchase(character, logs, purchase, equipmentData);
    if (!result) {
      alert("Not enough money for that purchase.");
      return;
    }
    refreshCharacter(result);
    resetSelectors();
  };

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h2 className="text-xl font-bold text-orange-400 mb-3">Equipment</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {EQUIPMENT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTypeChange(t.key)}
                className={tabClass(type === t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isWeapon && (
            <>
              <input
                type="text"
                placeholder="Weapon name"
                className={selectClass}
                value={weaponName}
                onChange={(e) => setWeaponName(e.target.value)}
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
            </>
          )}

          {type === "gadget" && (
            <select
              className={selectClass}
              value={gadgetId}
              onChange={(e) => setGadgetId(e.target.value)}
            >
              <option value="">Select Gadget</option>
              {gadgetGroups.map(({ gadget, gadgetOwned, submunitions }) => (
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
          )}

          {type === "grenade" && (
            <select
              className={selectClass}
              value={grenadeId}
              onChange={(e) => setGrenadeId(e.target.value)}
            >
              <option value="">Select Grenade</option>
              {grenadeOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.cost})
                </option>
              ))}
            </select>
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
          <div>
            <SelectionPreview
              title={preview?.title}
              cost={cost}
              description={preview?.description}
              effect={preview?.effect}
              rulesText={preview?.rulesText}
            />
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <PurchasedList
            title="Purchased Gadgets"
            items={[...gadgetEntries, ...submunitionEntries]}
            onSell={onSell}
          />
          <PurchasedList
            title="Purchased Weapons"
            items={weaponEntries}
            onSell={onSell}
          />
          <PurchasedList
            title="Purchased Grenade Types"
            items={grenadeEntries}
            onSell={onSell}
          />
        </div>
      </div>
    </div>
  );
}

export default EquipmentPurchaseCard;
