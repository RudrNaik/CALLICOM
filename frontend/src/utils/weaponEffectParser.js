
/**
 * Parse range string into an object
 * @param {string} rangeString - Range string like "+1 C | -2 L | -3 ELR"
 * @returns {object} Range object like { C: 1, L: -2, ELR: -3 }
 */
const parseRangeString = (rangeString) => {
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
const rangeObjectToString = (rangeObj) => {
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

export default {
  applyModifiers,
  getModifiedWeaponStats,
  getAbilitiesFromFamily,
};
