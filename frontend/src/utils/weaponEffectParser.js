
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
