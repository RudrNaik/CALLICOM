/**
 * Equipment Engine
 * Centralizes all weapon and gadget ammo logic.
 */

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

export const EXPENDABLE_GADGETS = [
  "shock-sticks",
  "claymores",
  "ankle-busters",
  "lil-mac",
  "c4",
  "m5-slam",
  "thermtex",
  "9bangs",
  "snapshot",
  "rocket-launcher",
  "wire-launcher",
  "guided-launcher",
  "amr",
  "semenov-railgun",
  "m26-mass",
  "PMGL",
  "LMD",
  "mp-aps",
  "zipline",
  "grappling-hook",
  "hydraulic-hook",
];

export const EX_KEY = "__uses";
export const MAG_KEY = "__mag";
export const RES_KEY = "__res";

export const isMixedGadget = (gadgetId) => MIXED_GADGETS.includes(gadgetId);
export const isExpendableGadget = (gadgetId) => EXPENDABLE_GADGETS.includes(gadgetId);

export const clamp0 = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Calculates effective ammo pool, accounts for Combat Engineers having 2x ammo.
 */
export const getEffectiveMax = (gadgetId, charClass, config) => {
  let base = config?.max ?? 0;
  if (
    isExpendableGadget(gadgetId) &&
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
  return { title: "Consumables", max: 0 };
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
