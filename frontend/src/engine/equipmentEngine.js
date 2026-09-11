/**
 * Equipment Engine
 * Centralizes gadget ammo logic and general equipment/gear rules.
 * Weapon-stat logic (category lookups, range/modifier math) lives in weaponEngine.js.
 */

/**
 * Retrieves gadget ammo configuration from the equipment list.
 * @param {string} gadgetId - ID of the gadget
 * @param {Array} equipmentData - The equipment data array
 * @returns {object|null} Configuration object
 */
export const getGadgetAmmoConfig = (gadgetId, equipmentData) => {
  return equipmentData.find(item => item.id === gadgetId) || null;
};

/**
 * Generic id-keyed lookup builder for an array of items with an `id` field.
 * @param {Array} items
 * @returns {object} Mapping of item id to item
 */
export const getItemByIdLookup = (items) => {
  const lookup = {};
  (items || []).forEach((it) => {
    lookup[it.id] = it;
  });
  return lookup;
};

/**
 * Derives every gadget/submunition id a character has ever purchased by
 * scanning their mission logs' receipts (see logisticsEngine.js) — nothing
 * is stored on Equipment itself for this, so removing a mission or undoing
 * a purchase updates what's "owned" for free, just by re-deriving from the
 * (now shorter) `logs`. A gadget's submunitions are always their own
 * individual purchases (see logisticsEngine.createSubmunitionPurchase),
 * never bundled with buying the gadget itself, but both fold into this same
 * id set — there's no separate "unlocked submunitions" concept; a
 * submunition is just another item that either shows up here or doesn't.
 * @param {Array} logs - character.logs
 * @returns {Array<string>}
 */
export const getPurchasedGadgetIds = (logs) => {
  const ids = new Set();
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "gadget" || purchase.type === "submunition") {
        ids.add(purchase.value);
      }
    });
  });
  return [...ids];
};

/**
 * Derives every weapon a character has ever purchased (one entry per
 * purchase, name included) from their mission logs' receipts.
 * @param {Array} logs - character.logs
 * @returns {Array<{name: string, category: string, family: string}>}
 */
export const getPurchasedWeapons = (logs) => {
  const weapons = [];
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "weapon") weapons.push(purchase.value);
    });
  });
  return weapons;
};

/**
 * Derives every grenade type id a character has ever purchased from their
 * mission logs' receipts.
 * @param {Array} logs - character.logs
 * @returns {Array<string>}
 */
export const getPurchasedGrenadeIds = (logs) => {
  const ids = new Set();
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "grenade") ids.add(purchase.value);
    });
  });
  return [...ids];
};

/**
 * Gadgets a character can currently select as their Class Gadget in the
 * Gameplay tab — restricted to what they've actually purchased in
 * Logistics, derived from `logs` (see getPurchasedGadgetIds). Excludes
 * SubMunition items (ammo variants like 40mm rounds): those are selected
 * via the gadget's own ammo UI (GadgetAmmo.jsx), not as a main gadget in
 * their own right. Availability used to be gated by a campaign-specific
 * equipment list (Siberia2022); that's been replaced entirely by this
 * purchase-based check, which applies uniformly regardless of campaign.
 * @param {Array} logs - character.logs
 * @param {Array} equipmentData - full equipment data list
 * @returns {Array}
 */
export const getAvailableClassGadgets = (logs, equipmentData) => {
  const owned = getPurchasedGadgetIds(logs);
  return equipmentData.filter((item) => owned.includes(item.id) && !item.SubMunition);
};

/**
 * Gadgets a character is eligible to buy in Logistics: their class's (and
 * multiclass's, if set) catalog entries. Ownership isn't required here —
 * it's the outcome of buying, not a prerequisite. Excludes SubMunition
 * items (ammo variants like 40mm rounds), which aren't standalone gadgets.
 * @param {object} character
 * @param {Array} equipmentData - full equipment data list
 * @returns {Array}
 */
export const getClassEligibleGadgets = (character, equipmentData) => {
  return equipmentData.filter(
    (item) =>
      (item.class === character.class || item.class === character.multiClass) &&
      !item?.SubMunition,
  );
};

/**
 * Grenade types a character can select in the Gameplay tab — restricted to
 * what they've actually purchased in Logistics, derived from `logs`.
 * @param {Array} logs - character.logs
 * @param {Array} equipmentData - full equipment data list
 * @returns {Array}
 */
export const getOwnedGrenades = (logs, equipmentData) => {
  const owned = getPurchasedGrenadeIds(logs);
  return equipmentData.filter(
    (item) => item?.parentId === "grenades" && owned.includes(item.id),
  );
};

/**
 * Clears any currently-equipped gadget/weapon/grenade that no longer has a
 * matching purchase in `logs` (see getPurchasedGadgetIds/Weapons/
 * GrenadeIds) — e.g. after a purchase undo (see logisticsEngine.js) or on
 * legacy data predating purchase tracking. Ownership itself is never
 * stored, so this only ever touches the equip pointers, not `logs`.
 * @param {object} equipment
 * @param {Array} logs - character.logs
 * @returns {object} a new equipment object with dangling equip pointers cleared
 */
export const sanitizeEquipmentOwnership = (equipment, logs) => {
  const base = equipment ?? {};
  const ownedGadgetIds = getPurchasedGadgetIds(logs);
  const ownedWeapons = getPurchasedWeapons(logs);
  const ownedGrenadeIds = getPurchasedGrenadeIds(logs);

  const sanitized = { ...base };

  if (sanitized.gadget && !ownedGadgetIds.includes(sanitized.gadget)) {
    sanitized.gadget = "";
    sanitized.gadgetAmmo = {};
  }

  ["primaryWeapon", "secondaryWeapon"].forEach((slot) => {
    const weapon = sanitized[slot];
    if (!weapon?.category) return;

    const stillOwned = ownedWeapons.some(
      (w) =>
        w.name === weapon.name &&
        w.category === weapon.category &&
        (w.family || "") === (weapon.family || ""),
    );
    if (!stillOwned) {
      sanitized[slot] = { name: "", category: "", family: "" };
    }
  });

  if (Array.isArray(sanitized.grenades)) {
    sanitized.grenades = sanitized.grenades.map((id) =>
      id && !ownedGrenadeIds.includes(id) ? "" : id,
    );
  }

  return sanitized;
};

/**
 * Returns the max armor class a character's class can equip.
 * Combat Engineer/Technical Engineer/Medic -> 2, Fire Support -> 3, else 1.
 * @param {object} character
 * @returns {number}
 */
export const getArmorClassCap = (character) => {
  if (
    character.class === "Combat Engineer" ||
    character.class === "Technical Engineer" ||
    character.class === "Medic"
  ) {
    return 2;
  }
  if (character.class === "Fire Support") {
    return 3;
  }
  return 1;
};

/**
 * Looks up a class's secondary (innate) gadget from the classSkills map.
 * @param {object} secondaryGadgetsMap - classSkills.json shape, keyed by class
 * @param {object} character
 * @returns {*} the classGadget entry, or null if the class has none
 */
export const getSecondaryGadgetForClass = (secondaryGadgetsMap, character) => {
  if (secondaryGadgetsMap[character.class]) {
    return secondaryGadgetsMap[character.class].classGadget;
  }
  return null;
};

/**
 * Returns the flavor-text description for a given armor class value.
 * @param {number} armorClass
 * @returns {string|null} null when armorClass is 1 (no bonuses) matches original blank-vs-text rendering? see below.
 */
export const getArmorClassDescription = (armorClass) => {
  if (armorClass == 0) {
    return "No maluses for sprinting and shooting, +1 to [Acrobatics][Jump][Climb][Endurance][Stealth]";
  }
  if (armorClass == 1) {
    return "No Bonuses";
  }
  if (armorClass == 2) {
    return "-1 to movement related checks [Acrobatics][Jump][Climb][Endurance]";
  }
  if (armorClass >= 3) {
    return "[N/A // Cannot have an AC past 2.]";
  }
  return "";
};

// --- Gadget Ammo Logic ---

export const MIXED_GADGETS = [
  "spec-ammo",
  "stim-pouch",
  "x89-ams",
  "ugl",
  "demo-dog",
  "ammo-bag",
];

export const EX_KEY = "__uses";
export const MAG_KEY = "__mag";
export const RES_KEY = "__res";

export const isMixedGadget = (gadgetId) => MIXED_GADGETS.includes(gadgetId);
export const isExpendableGadget = (gadgetId, config = null) => {
  if (!config || typeof config !== "object") return false;
  if (isMixedGadget(gadgetId)) return false;
  const max = getGadgetAmmoMax(config);
  return Number.isFinite(max) && max > 0;
};

export const clamp0 = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);

export const getGadgetAmmoMax = (config = {}) => {
  const directMax = [
    config.max,
    config.maxGrenades,
    config.maxRounds,
    config.maxStims,
    config.maxSpecAmmo,
    config.maxBatches,
    config.maxStowedAmmo,
  ].find((value) => Number.isFinite(value) && Number(value) > 0);

  if (Number.isFinite(directMax)) {
    return Number(directMax);
  }

  const rulesText = typeof config.rulesText === "string" ? config.rulesText : "";
  const match = rulesText.match(/(?:Ammo|Charges|Rounds?|Uses|Capacity)\s*:?\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
};

/**
 * Calculates effective ammo pool, accounts for Combat Engineers having 2x ammo.
 */
export const getEffectiveMax = (gadgetId, charClass, config) => {
  let base = getGadgetAmmoMax(config) || config?.max || 0;
  if (
    isExpendableGadget(gadgetId, config) &&
    charClass === "Combat Engineer" &&
    (gadgetId === "rocket-launcher" ||
      gadgetId === "wire-launcher" ||
      gadgetId === "guided-launcher")
  ) {
    base *= 2;
  }
  return base;
};

/**
 * Determines the title and max ammo for a gadget.
 */
export const getGadgetAmmoHeader = (gadgetId, config, isExpendable, effectiveMax) => {
  if (gadgetId === "stim-pouch")
    return { title: "Stimulants", max: config?.maxStims ?? 0 };
  if (gadgetId === "ugl")
    return { title: "40mm Rounds", max: config?.maxGrenades ?? 0 };
  if (gadgetId === "x89-ams")
    return { title: "Mortar Shells", max: config?.maxRounds ?? 0 };
  if (gadgetId === "spec-ammo")
    return { title: "Special Ammo", max: config?.maxSpecAmmo ?? 0 };
  if (gadgetId === "thinkpad") return { title: "Hacks", max: 0 };
  if (gadgetId === "demo-dog")
    return { title: "Variant", max: config?.maxStowedAmmo ?? 0 };
  if (gadgetId === "ammo-bag")
    return { title: "Type", max: config?.maxBatches ?? 0 };
  if (isExpendable) return { title: "Munitions", max: effectiveMax };
  return { title: "", max: 0 };
};

/** 
 * Checks if a gadget explicitly has an ammo count. Some gadgets dont have ammo and are instead function outside of this.
 */
export const hasExplicitGadgetAmmo = (gadgetId, config, isMixed, isExpendable) => {
  if (!config || typeof config !== "object") return false;
  if (isMixed || isExpendable) return true;

  if (Array.isArray(config.options) && config.options.length > 0) {
    return true;
  }

  if (Number.isFinite(getGadgetAmmoMax(config)) && getGadgetAmmoMax(config) > 0) {
    return true;
  }

  return false;
};

/**
 * Generates the header text description for a gadget.
 */
export const getGadgetAmmoText = (gadgetId, config, isExpendable, effectiveMax) => {
  if (!config) return null;
  if (gadgetId === "ugl" && config.maxGrenades != null)
    return `Max ${config.maxGrenades} rounds.`;
  if (gadgetId === "x89-ams" && config.maxRounds != null)
    return `Choose up to ${config.maxRounds} shells.`;
  if (gadgetId === "stim-pouch" && config.maxStims != null)
    return `Choose up to ${config.maxStims} stims. `;
  if (gadgetId === "spec-ammo" && config.maxSpecAmmo != null)
    return `Choose up to ${config.maxSpecAmmo} rounds `;
  if (gadgetId === "demo-dog")
    return `Select a variant. [increase to magazine size for selected variant.]`;
  if (gadgetId === "ammo-bag" && config.maxBatches != null)
    return `Choose up to ${config.maxBatches} charges`;
  if (isExpendable) return `Max: ${effectiveMax}x rounds/grenades/charges.`;
  return null;
};

/**
 * Sanitizes gadget ammo data for storage and state.
 */
export const sanitizeGadgetAmmo = (obj, isMixed, isExpendable, optionIds, effectiveMax) => {
  const out = {};
  if (!obj || typeof obj !== "object") return out;

  if (isMixed) {
    for (const [k, v] of Object.entries(obj)) {
      if (!optionIds.has(k)) continue;
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : -1;
    }
    return out;
  }

  if (isExpendable) {
    if (Object.prototype.hasOwnProperty.call(obj, EX_KEY)) {
      const n = Number(obj[EX_KEY]);
      out[EX_KEY] = Number.isFinite(n)
        ? clamp0(Math.min(n, effectiveMax))
        : 0;
      return out;
    }

    const hasLegacyMagRes =
      Object.prototype.hasOwnProperty.call(obj, MAG_KEY) ||
      Object.prototype.hasOwnProperty.call(obj, RES_KEY);
    if (!hasLegacyMagRes) {
      // No ammo state recorded at all — a gadget just selected, not one
      // that's been fired down — so it starts full. A real 0 is only ever
      // reached afterward, by using ammo down (see useExpendableGadget),
      // which always leaves EX_KEY set and is caught by the branch above.
      out[EX_KEY] = effectiveMax;
      return out;
    }

    const mag = clamp0(obj[MAG_KEY]);
    const res = clamp0(obj[RES_KEY]);
    const total = Math.min(mag + res, effectiveMax);
    out[EX_KEY] = total;
    return out;
  }

  return out;
};

/**
 * Sums non-negative values in an object.
 */
export const sumNonNeg = (obj) =>
  Object.values(obj || {}).reduce(
    (a, n) => a + Math.max(0, Number(n || 0)),
    0,
  );

/**
 * Determines the initial ammo state for a gadget, sanitized from whatever is
 * currently stored on the character's equipment.gadgetAmmo.
 * @param {string} gadgetId - ID of the gadget
 * @param {string} charClass - Character class
 * @param {object} config - Gadget configuration
 * @param {object} currentAmmo - Ammo state currently stored on the character
 * @returns {object} The initial ammo object
 */
export const getInitialGadgetAmmo = (gadgetId, charClass, config, currentAmmo = {}) => {
  const isMixed = isMixedGadget(gadgetId);
  const isExpendable = isExpendableGadget(gadgetId, config);
  const effectiveMax = getEffectiveMax(gadgetId, charClass, config);
  const options = config?.options || [];
  const optionIds = new Set(options.map((o) => o.id));

  if (isMixed || isExpendable) {
    return sanitizeGadgetAmmo(currentAmmo, isMixed, isExpendable, optionIds, effectiveMax);
  }
  return {};
};

/**
 * Updates the ammo value for a mixed gadget and enforces the pool cap.
 * @param {object} currentAmmo - Current ammo state
 * @param {string} id - Ammo type ID
 * @param {number} nextVal - New ammo count
 * @param {number} max - Total pool capacity
 * @returns {object|null} New ammo state or null if update exceeds pool cap
 */
export const updateMixedGadgetAmmo = (currentAmmo, id, nextVal, max) => {
  const next = { ...(currentAmmo || {}), [id]: nextVal };
  if (max > 0 && sumNonNeg(next) > max) return null;
  return next;
};

/**
 * Decrements the use count for an expendable gadget.
 * @param {object} currentAmmo - Current ammo state
 * @param {number} effectiveMax - The max allowed uses
 * @returns {object|null} New ammo state or null if ammo is 0
 */
export const useExpendableGadget = (currentAmmo, effectiveMax) => {
  const cur =
    Number.isFinite(currentAmmo?.[EX_KEY]) && currentAmmo[EX_KEY] >= 0
      ? currentAmmo[EX_KEY]
      : effectiveMax;
  if (cur <= 0) return null;
  return { ...(currentAmmo || {}), [EX_KEY]: cur - 1 };
};

/**
 * Resets the use count for an expendable gadget to max.
 * @param {object} currentAmmo - Current ammo state
 * @param {number} effectiveMax - The max allowed uses
 * @returns {object} New ammo state
 */
export const resupplyExpendableGadget = (currentAmmo, effectiveMax) => {
  return { ...(currentAmmo || {}), [EX_KEY]: effectiveMax };
};
