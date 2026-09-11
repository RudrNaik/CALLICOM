/**
 * Logistics Engine
 *
 * Pure functions for buying gear with a character's money (see
 * logsEngine.getMoneyTotal), between missions. Every purchase is recorded
 * onto the most recently logged mission's receipt (logsEngine.
 * recordPurchaseOnLatestMission) — that's the only place a purchase lives;
 * see rebuildEquipmentFromLogs for how "currently equipped" is rebuilt from
 * it, and sellPurchase for removing one again later.
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
 *
 * Cost itself is never trusted from a stored value either: a purchase
 * record keeps whatever `cost` it was made at (mostly for the gear-slot
 * placeholder, which has no real catalog yet), but every money calculation
 * re-prices it from the live Equipment.json via getPurchaseCost. That means
 * changing an item's cost in the catalog immediately changes what every
 * character who ever bought it is considered to have paid, everywhere
 * (getMoneyTotal, sellPurchase refunds, receipt display) — nothing needs a
 * migration when a price changes.
 *
 * Selling (sellPurchase) is scoped to the current "buy period": only
 * purchases recorded on the most recently logged mission's receipt can be
 * sold, and any of them can be — not just the last one made, unlike a strict
 * undo stack. Once a newer mission gets logged, that receipt locks and its
 * purchases are committed for good; you bought it three missions ago, you
 * can't just sell it back now. Whatever's currently equipped in each slot is
 * rebuilt from scratch by replaying every remaining purchase across every
 * mission in order (rebuildEquipmentFromLogs), so a slot just reverts to
 * whichever purchase is now the most recent for it (or empty, if none are
 * left) — correct for gadgets/grenades (each id can only be bought once, so
 * selling one always removes it entirely) and for weapons (which can be
 * bought many times over, so selling one specific purchased instance leaves
 * the others untouched).
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

/**
 * A purchase's current cost, re-priced live from Equipment.json rather than
 * trusted from whatever was stored on the purchase when it was made — so
 * editing an item's cost in the catalog retroactively changes what every
 * character is considered to have paid for it. Weapons re-derive from their
 * category + family (the same catalog lookup the buy form uses); gadgets,
 * grenades and submunitions re-derive from their catalog id. Gear-slot
 * purchases have no real catalog yet, so they fall back to their stored
 * `cost`.
 */
export function getPurchaseCost(purchase, equipmentData) {
  switch (purchase?.type) {
    case "weapon": {
      const lookup = getWeaponCategoriesLookup(equipmentData ?? []);
      return getWeaponCost(lookup[purchase.value?.category], purchase.value?.family);
    }
    case "gadget":
    case "grenade":
    case "submunition": {
      const item = (equipmentData ?? []).find((i) => i.id === purchase.value);
      return item?.cost || 0;
    }
    default:
      return purchase?.cost || 0;
  }
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
 * purchase never bumps something already equipped out of its slot — it
 * only fills that slot if it was empty, same as grenades already did (each
 * purchase fills the first empty grenade slot, or just unlocks the type if
 * both are full). Buying a second gadget/weapon while one's already
 * equipped just adds it to what's owned; switching what's equipped is a
 * deliberate choice made in the Gameplay tab (see EquipmentView.jsx), not a
 * side effect of buying. A submunition purchase has no equipped field of
 * its own (it just needs to show up in the receipt for ownership to derive
 * it later), so it's a no-op here.
 */
function applyPurchaseToEquipment(equipment, purchase) {
  const base = equipment ?? {};

  switch (purchase.type) {
    case "weapon":
      if (base[purchase.slot]?.category) return base;
      return { ...base, [purchase.slot]: purchase.value };
    case "gadget":
      if (base.gadget) return base;
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
    case "gearSlot": {
      if (base.gearSlots?.[purchase.slot]) return base;
      return {
        ...base,
        gearSlots: { ...(base.gearSlots ?? {}), [purchase.slot]: purchase.value },
      };
    }
    case "submunition":
    default:
      return base;
  }
}

/**
 * Rebuilds "what's currently equipped" from nothing but `logs`, by replaying
 * every purchase from every mission's receipt, in order, from an empty
 * equipment object. This is the single source of truth for equipped
 * gear/weapons/grenades — there's no snapshot to keep in sync, so selling or
 * removing a purchase from anywhere in a character's history (not just the
 * latest mission) always leaves equipment consistent: a slot just reverts to
 * whichever remaining purchase for it is now the most recent, or empty if
 * none are left.
 */
export function rebuildEquipmentFromLogs(logs) {
  return (logs ?? []).reduce((equipment, mission) => {
    const purchases = mission?.receipt?.purchases ?? [];
    return purchases.reduce(applyPurchaseToEquipment, equipment);
  }, {});
}

/**
 * Every purchase ever made, across every mission, in receipt order, paired
 * with the (missionIndex, purchaseIndex) location sellPurchase needs to
 * remove one — optionally filtered to a single purchase `type`.
 */
export function getPurchaseEntries(logs, type) {
  const entries = [];
  (logs ?? []).forEach((log, missionIndex) => {
    (log?.receipt?.purchases ?? []).forEach((purchase, purchaseIndex) => {
      if (!type || purchase.type === type) {
        entries.push({ missionIndex, purchaseIndex, purchase });
      }
    });
  });
  return entries;
}

/**
 * Spends money on a purchase, updating equipment and recording it onto the
 * latest mission's receipt. Blocked if the character can't afford it.
 * @returns {{equipment: object, logs: array}|null} null if blocked
 */
export function applyPurchase(character, logs, purchase, equipmentData) {
  const cost = getPurchaseCost(purchase, equipmentData);
  const money = getMoneyTotal(character, equipmentData) - cost;
  if (money < 0) return null;

  const equipment = applyPurchaseToEquipment(character?.equipment, purchase);
  const nextLogs = recordPurchaseOnLatestMission(logs, { ...purchase, cost });

  return { equipment, logs: nextLogs };
}

/**
 * Sells (removes) a purchase recorded on the most recently logged mission's
 * receipt — this mission is the open "buy period", and any purchase made
 * during it can be sold, not just the last one (unlike a strict undo stack).
 * Blocked for any purchase on an older mission: once a newer mission gets
 * logged, that receipt locks and its purchases are committed for good.
 * Refunds the purchase's current cost (see getPurchaseCost) and rebuilds
 * every equip slot from scratch (see rebuildEquipmentFromLogs).
 * @returns {{logs: array, equipment: object}|null} null if the purchase can't be found or isn't in the current buy period
 */
export function sellPurchase(character, logs, missionIndex, purchaseIndex, equipmentData) {
  if (!logs || missionIndex !== logs.length - 1) return null;

  const mission = logs[missionIndex];
  const purchases = mission?.receipt?.purchases ?? [];
  const purchase = purchases[purchaseIndex];
  if (!purchase) return null;

  const nextPurchases = purchases.filter((_, i) => i !== purchaseIndex);

  const nextLogs = [...logs];
  nextLogs[missionIndex] = {
    ...mission,
    receipt: { ...mission.receipt, purchases: nextPurchases },
  };

  return {
    logs: nextLogs,
    equipment: sanitizeEquipmentOwnership(rebuildEquipmentFromLogs(nextLogs), nextLogs),
  };
}

/**
 * Undoes the most recently made logistics purchase — a convenience wrapper
 * over sellPurchase targeting the current buy period's last purchase.
 * @returns {{logs: array, equipment: object}|null} null if there's nothing to undo
 */
export function undoLastPurchase(character, logs, equipmentData) {
  if (!logs || logs.length === 0) return null;

  const lastIndex = logs.length - 1;
  const purchases = logs[lastIndex]?.receipt?.purchases ?? [];
  if (purchases.length === 0) return null;

  return sellPurchase(character, logs, lastIndex, purchases.length - 1, equipmentData);
}
