export const EXP_COST = [0, 1, 5, 15, 30];
export const BASE_CLASS_XP = 35;
export const ATTR_EXP_COST = 40;
export const SPEC_EXP_COST = 5;
export const MULTICLASS_EXP_COST = 20;
export const BASE_ATTR_POINTS = 5;

/**
 * Calculates derived stats based on character attributes and skills.
 * Ported from DerivedStats.jsx
 */
export function calculateDerivedStats(character) {
  const attrs = character?.attributes ?? {};
  const skills = character?.skills ?? {};
  const equip = character?.equipment ?? {};
  const fleshWounds = character?.fleshWounds ?? 0;
  const deepWounds = character?.deepWounds ?? 0;

  const Alertness = attrs.Expertise || 0;
  const Body = attrs.Body || 0;
  const Intelligence = attrs.Intelligence || 0;
  const Spirit = attrs.Spirit || 0;
  const Brawl = skills.CQC || 0;
  const Melee = skills.Melee || 0;

  const defense = 1 + Alertness + Body;
  const combatSense = 1 + Intelligence + Spirit;
  const health = Math.ceil((Body + Spirit) / 2);
  const stamina = 5 + Body + Spirit;
  const systemShock = 5 + health;

  const fleshThreshold = Math.ceil(stamina / 2) + (equip.armorClass ?? 0);
  const deepThreshold = stamina + (equip.armorClass ?? 0);
  const instantDeath = stamina * 2;
  const unarmedDamage = Math.max(4, Math.ceil((3 + Body + Brawl) / 1.5));
  const armedDamage = Math.max(4, Math.ceil((3 + Body + Melee) / 1.5));
  const woundMod = fleshWounds + deepWounds * 2;

  return {
    defense,
    combatSense,
    health,
    stamina,
    systemShock,
    fleshThreshold,
    deepThreshold,
    instantDeath,
    unarmedDamage,
    armedDamage,
    woundMod,
  };
}

/**
 * Calculates the total XP spent by a character.
 * Ported from expAddedCalc.jsx
 */
export function calculateTotalSpentXP(character) {
  const skills = character?.skills ?? {};
  const attrs = character?.attributes ?? {};
  const specializations = character?.specializations ?? [];
  const hasMulticlass = Boolean(character?.multiClass);

  const totalSkillXP = Object.values(skills).reduce(
    (sum, lvl) => sum + (EXP_COST[Math.min(Math.max(lvl, 0), 4)] ?? 0),
    0
  );

  const totalAttrPoints = Object.values(attrs).reduce((a, b) => a + b, 0);
  const purchasedAttrPoints = Math.max(0, totalAttrPoints - BASE_ATTR_POINTS);
  const attrXP = purchasedAttrPoints * ATTR_EXP_COST;

  const specXP = specializations.length * SPEC_EXP_COST;
  const multiclassXP = hasMulticlass ? MULTICLASS_EXP_COST : 0;

  return totalSkillXP + attrXP + specXP + multiclassXP;
}

/**
 * Returns the cost to upgrade a skill to the next level.
 */
export function getSkillUpgradeCost(currentLevel) {
  if (currentLevel >= 4) return 0;
  const currentTotal = EXP_COST[currentLevel] || 0;
  const nextTotal = EXP_COST[currentLevel + 1] || 0;
  return nextTotal - currentTotal;
}

/**
 * Returns the total cumulative XP spent to reach a specific level.
 */
export function getTotalSkillXP(level) {
  return EXP_COST[Math.min(Math.max(level, 0), 4)] ?? 0;
}

/**
 * Initializes base skills for a character based on their class.
 * Ported from SkillCreator.jsx
 */
export function initializeCharacterSkills(characterClass, skillGroups, classStartingSkills) {
  const base = {};
  const config = classStartingSkills[characterClass];
  if (!config) return base;

  const allSkills = Object.values(skillGroups).flat();
  allSkills.forEach((skill) => {
    base[skill] = 0;
  });

  config.level2.forEach((skill) => (base[skill] = 2));
  config.level1.forEach((skill) => (base[skill] = 1));

  return base;
}

/**
 * Pure function to upgrade a skill.
 */
export function upgradeSkill(character, skill) {
  const currentLevel = character.skills[skill] || 0;
  if (currentLevel >= 4) return null;

  const cost = getSkillUpgradeCost(currentLevel);
  if (character.XP < cost) return null;

  return {
    newCharacter: {
      ...character,
      skills: { ...character.skills, [skill]: currentLevel + 1 },
      XP: character.XP - cost,
    },
    cost,
  };
}

/**
 * Pure function to downgrade a skill.
 */
export function downgradeSkill(character, skill, classStartingSkills) {
  const currentLevel = character.skills[skill] || 0;
  const config = classStartingSkills[character.class];
  if (!config) return null;

  const min = config.level2.includes(skill)
    ? 2
    : config.level1.includes(skill)
    ? 1
    : 0;

  if (currentLevel <= min) return null;

  const refund = getSkillUpgradeCost(currentLevel - 1);

  return {
    newCharacter: {
      ...character,
      skills: { ...character.skills, [skill]: currentLevel - 1 },
      XP: character.XP + refund,
    },
    refund,
  };
}

/**
 * Pure function to upgrade an attribute.
 */
export function upgradeAttribute(character, attribute) {
  const currentVal = character.attributes[attribute] || 0;
  if (currentVal >= 3) return null;

  const cost = ATTR_EXP_COST;
  if (character.XP < cost) return null;

  return {
    newCharacter: {
      ...character,
      attributes: { ...character.attributes, [attribute]: currentVal + 1 },
      XP: character.XP - cost,
    },
    cost,
  };
}

/**
 * Pure function to downgrade an attribute.
 */
export function downgradeAttribute(character, attribute) {
  const currentVal = character.attributes[attribute] || 0;
  if (currentVal <= 0) return null;

  const refund = ATTR_EXP_COST;

  return {
    newCharacter: {
      ...character,
      attributes: { ...character.attributes, [attribute]: currentVal - 1 },
      XP: character.XP + refund,
    },
    refund,
  };
}
