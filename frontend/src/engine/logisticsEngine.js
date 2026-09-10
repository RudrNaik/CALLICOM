/**
 * Logistics Engine
 *
 * Pure functions for buying gear with a character's money (see
 * logsEngine.getMoneyTotal), between missions. Every purchase is recorded
 * onto the most recently logged mission's receipt (logsEngine.
 * recordPurchaseOnLatestMission) purely for display — reversal, on removing
 * that mission, works by resetting the whole equipment object back to its
 * pre-mission snapshot (receipt.equipmentBefore), not by undoing purchases
 * one at a time.
 *
 * Purchase types: weapons (primary/secondary — name + category + family,
 * priced off the category/family catalog), gadgets (the character's
 * class/multiclass-eligible catalog, reusing
 * equipmentEngine.getClassEligibleGadgets), grenades (each purchase fills
 * the first empty grenade slot — the first purchase fills slot 1, the
 * second fills slot 2, and once both are full further purchases just
 * unlock the type without touching either slot), gear slots (headgear/
 * vest/equipment/gloves — a placeholder catalog for now, no real items
 * yet), and submunitions (a gadget's ammo variants, e.g. the UGL's 40mm
 * rounds — each one, even a $0 one, is its own individual purchase, not
 * bundled in with buying the parent gadget).
 *
 * Nothing about "ownership" is stored on Equipment — what a character can
 * select in the Gameplay tab (equipmentEngine.getAvailableClassGadgets /
 * weaponEngine.getOwnedWeaponCategories / equipmentEngine.getOwnedGrenades)
 * is derived fresh from `logs` every time, by scanning every receipt's
 * `purchases`. That's what replaces the old campaign-code (Siberia2022)
 * restriction, and it's also why removing a mission or undoing a purchase
 * needs no separate bookkeeping to stay consistent — there's nothing to go
 * stale.
 */
import {
  getWeaponCategoriesLookup,
  getExcludedPrimaryCategories,
  getExcludedSecondaryCategories,
} from "./weaponEngine";
import { getClassEligibleGadgets, sanitizeEquipmentOwnership } from "./equipmentEngine";
import { getMoneyTotal, recordPurchaseOnLatestMission } from "./logsEngine";

/**
 * Weapon categories a character may buy into the given slot, keyed by
 * category name — the same class-based exclusions used when equipping
 * weapons directly (see weaponEngine.js).
 */
export function getWeaponCategoryOptions(equipmentData, slot, character) {
  const lookup = getWeaponCategoriesLookup(equipmentData);
  const excluded =
    slot === "secondaryWeapon"
      ? getExcludedSecondaryCategories()
      : getExcludedPrimaryCategories(character);

  return Object.fromEntries(
    Object.entries(lookup).filter(([categoryName]) => !excluded.includes(categoryName)),
  );
}

/**
 * A weapon's total cost: its category's base cost plus the chosen family's
 * upcharge (families cost more for their extra abilities/modifiers).
 */
export function getWeaponCost(categoryData, familyName) {
  const family = categoryData?.families?.find((f) => f.family === familyName);
  return (categoryData?.cost || 0) + (family?.cost || 0);
}

/**
 * The gadgets a character can buy — their class's (and multiclass's, if
 * set) catalog entries. Ownership isn't required to buy, only to equip
 * (see equipmentEngine.getAvailableClassGadgets, used by the Gameplay tab).
 */
export function getGadgetOptions(character, equipmentData) {
  return getClassEligibleGadgets(character, equipmentData);
}

/**
 * The grenade types available to buy — each purchase fills the first empty
 * grenade slot (see applyPurchaseToEquipment), or just unlocks the type
 * without equipping it if both slots are already occupied.
 */
export function getGrenadeOptions(equipmentData) {
  return equipmentData.filter((item) => item?.parentId === "grenades");
}

/**
 * A gadget's ammo-variant submunitions (e.g. the UGL's 40mm rounds), resolved
 * from its `options` list to their full catalog entries (for `title`/`cost`).
 * Returns an empty array for gadgets with no variant options.
 */
export function getGadgetSubmunitionOptions(gadgetItem, equipmentData) {
  const options = gadgetItem?.options ?? [];
  return options
    .map((option) => equipmentData.find((item) => item.id === option.id))
    .filter(Boolean);
}

export function createWeaponPurchase({ slot, name, category, family, cost }) {
  return {
    type: "weapon",
    slot,
    label: `${name?.trim() || "Unnamed Weapon"} (${category}${family ? ` / ${family}` : ""})`,
    cost: Number(cost) || 0,
    value: {
      name: name?.trim() || "",
      category: category || "",
      family: family || "",
    },
  };
}

export function createGadgetPurchase({ gadgetId, label, cost }) {
  return {
    type: "gadget",
    slot: "gadget",
    label: label || gadgetId,
    cost: Number(cost) || 0,
    value: gadgetId,
  };
}

/**
 * Unlocks one submunition option for a gadget (e.g. a UGL 40mm variant) —
 * always its own individual purchase, even if it costs $0, never bundled in
 * with buying the parent gadget. Touches no equipment field itself — being
 * in the receipt's `purchases` is what makes it show up as owned (see
 * equipmentEngine.getPurchasedGadgetIds).
 */
export function createSubmunitionPurchase({ submunitionId, label, cost }) {
  return {
    type: "submunition",
    slot: "",
    label: label || submunitionId,
    cost: Number(cost) || 0,
    value: submunitionId,
  };
}

export function createGrenadePurchase({ grenadeId, label, cost }) {
  return {
    type: "grenade",
    slot: "grenades",
    label: label || grenadeId,
    cost: Number(cost) || 0,
    value: grenadeId,
  };
}

/**
 * Placeholder — gear slots (headgear/vest/equipment/gloves) have no real
 * catalog yet, so this just stores whatever label the caller passes.
 */
export function createGearSlotPurchase({ slot, label, cost }) {
  return {
    type: "gearSlot",
    slot,
    label: label || "",
    cost: Number(cost) || 0,
    value: label || "",
  };
}

/**
 * Applies a purchase's effect to the currently-equipped fields only —
 * ownership itself is never stored (see equipmentEngine.getPurchased*),
 * so this is purely "what's now equipped", not "what's now owned". A
 * submunition purchase has no equipped field of its own (it just needs to
 * show up in the receipt for ownership to derive it later), so it's a
 * no-op here.
 */
function applyPurchaseToEquipment(equipment, purchase) {
  const base = equipment ?? {};

  switch (purchase.type) {
    case "weapon":
      return { ...base, [purchase.slot]: purchase.value };
    case "gadget":
      return { ...base, gadget: purchase.value };
    case "grenade": {
      const grenades = Array.isArray(base.grenades) ? [...base.grenades] : ["", ""];
      const emptySlot = grenades.findIndex((id) => !id);
      // Both slots full: still a valid purchase (it unlocks the type via
      // the receipt), just doesn't change what's equipped.
      if (emptySlot !== -1) {
        grenades[emptySlot] = purchase.value;
      }
      return { ...base, grenades };
    }
    case "gearSlot":
      return {
        ...base,
        gearSlots: { ...(base.gearSlots ?? {}), [purchase.slot]: purchase.value },
      };
    case "submunition":
    default:
      return base;
  }
}

/**
 * Spends money on a purchase, updating equipment and recording it onto the
 * latest mission's receipt. Blocked if the character can't afford it.
 * @returns {{money: number, equipment: object, logs: array}|null} null if blocked
 */
export function applyPurchase(character, logs, purchase) {
  const money = getMoneyTotal(character) - purchase.cost;
  if (money < 0) return null;

  const equipment = applyPurchaseToEquipment(character?.equipment, purchase);
  const nextLogs = recordPurchaseOnLatestMission(logs, purchase);

  return { money, equipment, logs: nextLogs };
}

/**
 * Undoes the most recently made logistics purchase, as long as it's still
 * attributed to the most recently logged mission — that mission is a "buy
 * period" that stays open (and reversible one purchase at a time) until a
 * newer mission gets logged and locks it in. Refunds its cost, drops it from
 * the receipt (which is what ownership derives from — see
 * equipmentEngine.getPurchased*), and reconstructs the equipped fields by
 * replaying every remaining purchase in this mission's window from its
 * pre-mission snapshot, so equipment ends up exactly as if that purchase
 * had never happened. Sanitized afterward in case the undone purchase was
 * the only thing that had unlocked whatever's currently equipped.
 * @returns {{logs: array, money: number, equipment: object}|null} null if there's nothing to undo
 */
export function undoLastPurchase(character, logs) {
  if (!logs || logs.length === 0) return null;

  const lastIndex = logs.length - 1;
  const mission = logs[lastIndex];
  const receipt = mission.receipt ?? {};
  const purchases = receipt.purchases ?? [];
  if (purchases.length === 0) return null;

  const undonePurchase = purchases[purchases.length - 1];
  const remainingPurchases = purchases.slice(0, -1);

  const replayedEquipment = remainingPurchases.reduce(
    (acc, purchase) => applyPurchaseToEquipment(acc, purchase),
    receipt.equipmentBefore ?? {},
  );

  const nextLogs = [...logs];
  nextLogs[lastIndex] = {
    ...mission,
    receipt: { ...receipt, purchases: remainingPurchases },
  };

  return {
    logs: nextLogs,
    money: getMoneyTotal(character) + undonePurchase.cost,
    equipment: sanitizeEquipmentOwnership(replayedEquipment, nextLogs),
  };
}
