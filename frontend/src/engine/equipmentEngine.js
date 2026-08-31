/**
 * Equipment Engine
 * Centralizes all weapon and gadget ammo logic.
 */

/**
 * Transforms the equipment list into a lookup object for weapon categories using IDs.
 * @param {Array} equipmentData - The equipment data array
 * @returns {object} Mapping of category IDs to their data
 */
export const getWeaponCategoriesByIdLookup = (equipmentData) => {
  const lookup = {};
  equipmentData.forEach(item => {
    if (item.categoryName) {
      lookup[item.id] = item;
    }
  });
  return lookup;
};

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
 * Retrieves weapon category data from the equipment list by category name.
 * @param {string} categoryName - Name of the category (e.g., "Light Pistols")
 * @param {Array} equipmentData - The equipment data array
 * @returns {object|null} Category data
 */
export const getWeaponCategoryData = (categoryName, equipmentData) => {
  return equipmentData.find(item => item.categoryName === categoryName) || null;
};

/**
 * Transforms the equipment list into a lookup object for weapon categories.
 * @param {Array} equipmentData - The equipment data array
 * @returns {object} Mapping of category names to their data
 */
export const getWeaponCategoriesLookup = (equipmentData) => {
  const lookup = {};
  equipmentData.forEach(item => {
    if (item.categoryName) {
      lookup[item.categoryName] = item;
    }
  });
  return lookup;
};

// --- Weapon Logic ---

/**
 * Parse range string into an object
 * @param {string} rangeString - Range string like "+1 C | -2 L | -3 ELR"
 * @returns {object} Range object like { C: 1, L: -2, ELR: -3 }
 */
export const parseRangeString = (rangeString) => {
  const rangeObj = {};
  if (!rangeString) return rangeObj;

  rangeString.split("|").forEach((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/([+-]?\d+)\s*(C|M|L|ELR|EELR)/i);
    if (match) {
      const [, value, band] = match;
      rangeObj[band.toUpperCase()] = parseInt(value, 10);
    }
  });

  return rangeObj;
};

/**
 * Convert range object back to string format
 * @param {object} rangeObj - Range object like { C: 1, L: -2, ELR: -3 }
 * @returns {string} Range string like "+1 C | -2 L | -3 ELR"
 */
export const rangeObjectToString = (rangeObj) => {
  const bands = ["C", "M", "L", "ELR", "EELR"];
  const parts = [];

  bands.forEach((band) => {
    if (rangeObj[band] !== undefined && rangeObj[band] !== 0) {
      const sign = rangeObj[band] >= 0 ? "+" : "";
      parts.push(`${sign}${rangeObj[band]} ${band}`);
    }
  });

  return parts.join(" | ");
};

/**
 * Apply family modifiers to base weapon stats
 * @param {object} baseStats - Original weapon stats
 * @param {object} modifiers - Modifier object from family definition
 * @returns {object} Modified stats
 */
export const applyModifiers = (baseStats, modifiers) => {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return baseStats;
  }

  const modified = { ...baseStats };

  // Calculate original magazine count from base stats
  const baselineMagazineCount = Math.floor((baseStats.totalTurns || 0) / (baseStats.magazineSize || 1));

  if (modifiers.damage) {
    modified.damage = (modified.damage || 0) + modifiers.damage;
  }
  if (modifiers.penetration) {
    modified.penetration = (modified.penetration || 0) + modifiers.penetration;
  }

  // Handle range band modifiers
  const rangeModKeys = ["C", "M", "L", "ELR", "EELR"];
  const hasRangeModifiers = rangeModKeys.some(band => modifiers[band] !== undefined);

  if (hasRangeModifiers && baseStats.range) {
    const baseParsedRange = parseRangeString(baseStats.range);
    rangeModKeys.forEach(band => {
      if (modifiers[band] !== undefined) {
        baseParsedRange[band] = (baseParsedRange[band] || 0) + modifiers[band];
      }
    });
    modified.range = rangeObjectToString(baseParsedRange);
  }

  if (modifiers.magazineSize) {
    modified.magazineSize = (modified.magazineSize || 0) + modifiers.magazineSize;
  }

  // Recalculate totalTurns with original magazine count and new magazineSize
  modified.totalTurns = baselineMagazineCount * (modified.magazineSize || 1);

  // Apply totalTurns modifier
  if (modifiers.totalTurns) {
    modified.totalTurns = (modified.totalTurns || 0) + modifiers.totalTurns;
  }

  // Apply additional magazine count modifiers using new magazineSize
  if (modifiers.magazines) {
    modified.totalTurns = (modified.totalTurns || 0) + (modifiers.magazines * (modified.magazineSize || 1));
  }

  return modified;
};

/**
 * Get the complete modified stats for a weapon with family selected
 * @param {object} weapon - Weapon object with category
 * @param {object} weaponCategories - All weapon category definitions
 * @param {string} selectedFamilyName - Name of selected family
 * @returns {object} Complete modified stats
 */
export const getModifiedWeaponStats = (
  weapon,
  weaponCategories,
  selectedFamilyName
) => {
  const baseStats = weaponCategories[weapon?.category];

  if (!baseStats || !selectedFamilyName) {
    return baseStats;
  }

  const selectedFamily = baseStats.families?.find(
    (f) => f.family === selectedFamilyName
  );

  if (!selectedFamily) {
    return baseStats;
  }

  return applyModifiers(baseStats, selectedFamily.modifiers);
};

/**
 * Get abilities from a weapon family
 * @param {object} family - Family object from weaponCategories
 * @returns {array} Array of ability names
 */
export const getAbilitiesFromFamily = (family) => {
  return family?.modifiers?.abilities || [];
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
 * Determines the initial ammo state for a gadget.
 * @param {string} gadgetId - ID of the gadget
 * @param {string} charClass - Character class
 * @param {object} config - Gadget configuration
 * @param {any} parsedStorage - Data loaded from storage (if any)
 * @param {object} currentAmmo - Current ammo state (if any)
 * @returns {object} The initial ammo object
 */
export const getInitialGadgetAmmo = (gadgetId, charClass, config, parsedStorage = null, currentAmmo = {}) => {
  const isMixed = isMixedGadget(gadgetId);
  const isExpendable = isExpendableGadget(gadgetId, config);
  const effectiveMax = getEffectiveMax(gadgetId, charClass, config);
  const options = config?.options || [];
  const optionIds = new Set(options.map((o) => o.id));

  if (parsedStorage !== null) {
    if (isExpendable && typeof parsedStorage === "number") {
      return { [EX_KEY]: Math.max(0, Math.min(parsedStorage, effectiveMax)) };
    }
    return sanitizeGadgetAmmo(parsedStorage, isMixed, isExpendable, optionIds, effectiveMax);
  }

  if (isExpendable) {
    return {};
  } else if (isMixed) {
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
