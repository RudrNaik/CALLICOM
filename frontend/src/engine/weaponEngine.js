/**
 * Weapon Engine
 * Centralizes weapon stat/category logic, ammo-capacity math, and roll-calculator helpers.
 */
import { getPurchasedWeapons } from "./equipmentEngine";

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

/**
 * Restricts a weapon-category lookup (as built by getWeaponCategoriesLookup)
 * to only the categories/families a character has actually purchased in
 * Logistics, derived from `logs` (see equipmentEngine.getPurchasedWeapons —
 * nothing is stored on Equipment for this), for the Gameplay tab's weapon
 * pickers — buying is what unlocks a category or family, not class
 * eligibility alone (that's still enforced upstream, at purchase time, via
 * getExcludedPrimaryCategories/getExcludedSecondaryCategories).
 * @param {Array} logs - character.logs
 * @param {object} weaponCatsLookup - category-name-keyed lookup
 * @returns {object} the same shape, filtered down to owned categories/families
 */
export const getOwnedWeaponCategories = (logs, weaponCatsLookup) => {
  const owned = getPurchasedWeapons(logs);
  const result = {};

  Object.entries(weaponCatsLookup).forEach(([categoryName, categoryData]) => {
    const ownedInCategory = owned.filter((w) => w.category === categoryName);
    if (ownedInCategory.length === 0) return;

    const ownedFamilies = new Set(ownedInCategory.map((w) => w.family || ""));
    result[categoryName] = {
      ...categoryData,
      families: (categoryData.families ?? []).filter((f) => ownedFamilies.has(f.family)),
    };
  });

  return result;
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

// --- WeaponCards ammo logic ---

/**
 * Static lookup of the "pseudo" (flavor/animated) magazine sizes shown to the
 * player per weapon category. Independent from the real magazineSize/totalTurns
 * turn-tracking math.
 */
export const pseudoMagSizes = {
  "Light Pistols": 12,
  "Heavy Pistols": 6,
  "SMGs": 20,
  "Carbines": 30,
  "Assault Rifles": 30,
  "Marksman Rifles": 10,
  "Shotguns": 8,
  "Sniper Rifles": 5,
  "Machine Guns": 100,
};

/**
 * Resolves the real (turn-based) ammo capacity for a weapon slot, accounting
 * for the family-modified stats and the SMG-as-secondary special case.
 * @param {object} weapon - weapon object with category/family
 * @param {object} categoryData - base category data for weapon.category
 * @param {object} weaponCategories - all weapon category definitions (unused directly, kept for parity/future use)
 * @param {string} selectedFamilyName - currently selected family name
 * @param {boolean} isSecondary - whether this weapon slot is the secondary slot
 * @returns {{ totalTurns: number, magazineSize: number }}
 */
export const getWeaponAmmoCapacity = (
  weapon,
  categoryData,
  weaponCategories,
  selectedFamilyName,
  isSecondary,
) => {
  const selectedFamilyData =
    selectedFamilyName && categoryData?.families
      ? categoryData.families.find((f) => f.family === selectedFamilyName)
      : null;

  const modifiedCategoryData = selectedFamilyData
    ? applyModifiers(categoryData, selectedFamilyData.modifiers)
    : categoryData;

  let reserveAmmo;
  let magSize;

  if (weapon?.category == "SMGs" && isSecondary) {
    reserveAmmo = 4;
    magSize = 2;
  } else {
    reserveAmmo = modifiedCategoryData?.totalTurns || 0;
    magSize = modifiedCategoryData?.magazineSize || 1;
  }

  return { totalTurns: reserveAmmo, magazineSize: magSize };
};

/**
 * Computes the next fire state (pseudo-ammo randomization + decrement math)
 * for a weapon slot's Fire button, without touching React state.
 * @returns {{ firedThisMag: number, totalFired: number, pseudoAmmo: number|null, fired: boolean }|null}
 *   null if firing isn't currently possible (out of ammo/animating handled by caller).
 */
export const computeFireResult = ({
  firedThisMag,
  totalFired,
  pseudoAmmo,
  magazineSize,
  totalTurns,
  category,
}) => {
  const turnsRemaining = totalTurns - totalFired;
  const magTurnsLeft = Math.max(0, magazineSize - firedThisMag);

  if (!(turnsRemaining > 0 && magTurnsLeft > 0)) {
    return null;
  }

  const nextFiredThisMag = firedThisMag + 1;
  const nextTotalFired = totalFired + 1;

  let nextPseudoAmmo = pseudoAmmo;
  if (pseudoAmmo !== null) {
    const fullRounds = pseudoMagSizes[category] || 1;
    let reduction = 1;
    if (fullRounds !== 5) {
      const expectedPerTurn = fullRounds / magazineSize;
      const variance = Math.max(1, Math.floor(expectedPerTurn * 0.5));
      reduction = Math.floor(
        expectedPerTurn + (Math.random() * variance - variance / 2),
      );
    }

    nextPseudoAmmo =
      nextFiredThisMag >= magazineSize
        ? 0
        : Math.max(0, pseudoAmmo - reduction);
  }

  return {
    firedThisMag: nextFiredThisMag,
    totalFired: nextTotalFired,
    pseudoAmmo: nextPseudoAmmo,
    fired: true,
  };
};

/**
 * Computes the reset ammo state for a weapon slot's Resupply button.
 * @param {string} category - weapon category
 * @returns {{ firedThisMag: number, totalFired: number, pseudoAmmo: number|null }}
 */
export const resupplyWeaponAmmo = (category) => {
  const nextPseudoAmmo = pseudoMagSizes[category] || null;
  return { firedThisMag: 0, totalFired: 0, pseudoAmmo: nextPseudoAmmo };
};

/**
 * Computes the randomized refill-estimate for a weapon slot's Reload button.
 * @returns {{ firedThisMag: number, pseudoAmmo: number }}
 */
export const computeReloadResult = ({
  // eslint-disable-next-line no-unused-vars -- accepted for API symmetry with the other weapon-ammo functions; the reload math only depends on turnsRemaining/magazineSize.
  firedThisMag,
  turnsRemaining,
  magazineSize,
  category,
}) => {
  const refillTurns = Math.min(magazineSize, turnsRemaining);
  const nextFiredThisMag = magazineSize - refillTurns;

  const fullRounds = pseudoMagSizes[category] || 0;
  let nextPseudoAmmo;
  if (refillTurns === magazineSize) {
    nextPseudoAmmo = fullRounds;
  } else {
    const ratio = refillTurns / magazineSize;
    const estimatedRounds = Math.floor(fullRounds * ratio);
    const variance = Math.floor(estimatedRounds * 0.1);
    nextPseudoAmmo = Math.max(
      0,
      estimatedRounds +
        Math.floor(Math.random() * (2 * variance + 1)) -
        variance,
    );
  }

  return { firedThisMag: nextFiredThisMag, pseudoAmmo: nextPseudoAmmo };
};

// --- EquipmentView weapon-eligibility rules ---

/**
 * Universal secondary-weapon category exclusion list.
 */
export const SECONDARY_EXCLUDED_CATEGORIES = [
  "Sniper Rifles",
  "Machine Guns",
  "Drum Shotguns",
  "Marksman Rifles",
  "Assault Rifles",
  "Shotguns",
  "Carbines",
];

/**
 * Returns the excluded primary-weapon category list for a character based on
 * class/multiClass.
 * @param {object} character
 * @returns {Array<string>}
 */
export const getExcludedPrimaryCategories = (character) => {
  if (
    character.class === "Sharpshooter" ||
    character.multiClass === "Sharpshooter"
  ) {
    return ["Machine Guns", "Light Pistols", "Heavy Pistols"];
  }
  if (
    character.class === "Fire Support" ||
    character.multiClass === "Fire Support"
  ) {
    return ["Sniper Rifles", "Light Pistols", "Heavy Pistols"];
  }
  return [
    "Sniper Rifles",
    "Machine Guns",
    "Drum Shotguns",
    "Light Pistols",
    "Heavy Pistols",
  ];
};

/**
 * Returns the (universal) excluded secondary-weapon category list.
 * @returns {Array<string>}
 */
export const getExcludedSecondaryCategories = () => SECONDARY_EXCLUDED_CATEGORIES;

// --- RollCalculator helpers ---

/**
 * Resolves the base (unmodified-by-family) weapon category data for a weapon slot.
 * @param {object} weapon - weapon object with category
 * @param {object} weaponCatsLookup - category-name-keyed lookup
 * @returns {object|null}
 */
export const getWeaponData = (weapon, weaponCatsLookup) => {
  if (!weapon?.category) return null;
  return weaponCatsLookup[weapon.category] || null;
};

/**
 * Computes the range-band modifier for the currently selected weapon/family/range.
 * @param {object} weapon - selected weapon
 * @param {object} weaponCatsLookup - category-name-keyed lookup
 * @param {string} selectedFamilyName - selected weapon family, if any
 * @param {string} selectedRange - selected range band (C/M/L/ELR/EELR)
 * @returns {number}
 */
export const getRangeModifier = (weapon, weaponCatsLookup, selectedFamilyName, selectedRange) => {
  if (!weapon) return 0;
  const weaponData = getWeaponData(weapon, weaponCatsLookup);
  if (!weaponData?.range) return 0;

  let rangeString = weaponData.range;

  if (selectedFamilyName) {
    const modifiedStats = getModifiedWeaponStats(weapon, weaponCatsLookup, selectedFamilyName);
    if (modifiedStats?.range) {
      rangeString = modifiedStats.range;
    }
  }

  const profile = parseRangeString(rangeString);
  if (selectedRange === "EELR") return profile.ELR ?? 0;
  return profile[selectedRange] ?? 0;
};

/**
 * EELR navigate-roll to modifier table lookup.
 * @param {number|string|null} navigateRoll
 * @returns {number}
 */
export const getNavigateModifier = (navigateRoll) => {
  if (navigateRoll === null || navigateRoll === "") return 0;
  const roll = Number(navigateRoll);
  if (roll <= 1) return -2;
  if (roll <= 3) return -1;
  if (roll <= 5) return 0;
  if (roll >= 6) return 1;
  return 0;
};

/**
 * Aggregates named modifiers + range mod + ping + navigate mod into a single total.
 */
export const totalModifierValue = ({
  modifiers,
  rollMode,
  rangeMod,
  pingEnabled,
  selectedRange,
  navigateMod,
}) => {
  const namedMods = modifiers.reduce((sum, m) => sum + Number(m.value), 0);
  const effectiveRangeMod = rollMode === "weapon" ? rangeMod : 0;
  const ping = pingEnabled ? 1 : 0;
  const navigate =
    rollMode === "weapon" &&
    (selectedRange === "ELR" || selectedRange === "EELR")
      ? navigateMod
      : 0;
  return namedMods + effectiveRangeMod + ping + navigate;
};

/**
 * Builds the final dice-roll expression string for the roll calculator.
 */
export const rollExpression = ({
  skillLevel,
  effectiveCount,
  rollMode,
  rangeMod,
  selectedRange,
  navigateMod,
  pingEnabled,
  modifiers,
  diceModifiers,
  woundPenalty,
}) => {
  // Unskilled = take-lower; skilled = keep-highest
  const dice =
    skillLevel <= 0 ? `.r ${effectiveCount}d6l` : `.r ${effectiveCount}d6k1`;

  let expr = dice;
  const comments = [];

  if (rollMode === "weapon") {
    if (rangeMod !== 0) {
      expr += rangeMod > 0 ? ` + ${rangeMod}` : ` - ${Math.abs(rangeMod)}`;
      comments.push(`RNG ${rangeMod > 0 ? "+" : ""}${rangeMod}`);
    }
  }

  if (
    rollMode === "weapon" &&
    (selectedRange === "ELR" || selectedRange === "EELR")
  ) {
    if (navigateMod !== 0) {
      expr += navigateMod > 0 ? ` + ${navigateMod}` : ` - ${Math.abs(navigateMod)}`;
      comments.push(`NAV ${navigateMod > 0 ? "+" : ""}${navigateMod}`);
    }
  }

  if (pingEnabled) {
    expr += " + 1";
    comments.push("PING +1");
  }

  modifiers.forEach((mod) => {
    expr += mod.value > 0 ? ` + ${mod.value}` : ` - ${Math.abs(mod.value)}`;
    comments.push(`${mod.label} ${mod.value > 0 ? "+" : ""}${mod.value}`);
  });

  diceModifiers.forEach((mod) => {
    comments.push(`${mod.label} ${mod.value > 0 ? "+" : ""}${mod.value}d`);
  });

  if (woundPenalty > 0) {
    expr += ` - ${woundPenalty}`;
    comments.push(`WND -${woundPenalty}`);
  }

  if (comments.length > 0) {
    expr += ` # ${comments.map((c) => `(${c})`).join(" ")}`;
  }

  return expr;
};
