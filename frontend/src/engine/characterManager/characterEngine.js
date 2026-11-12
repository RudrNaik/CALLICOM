import classData from "../../data/classSkills.json";
import skills from  "../../data/skills.json"
import * as logEngine from "./logsEngine"

export const EXP_COST = [0, 1, 5, 15, 30];
export const ATTR_EXP_COST = 25;
export const SPEC_EXP_COST = 5;
export const MULTICLASS_EXP_COST = 15;
export const BASE_CLASS_EXP = 25;
export const BASE_ATTR_POINTS = 5;

export const CREATION_XP_BUDGET = 15;
export const BASELINE_EMERGENCY_DICE = 4;

export const BASE_STARTING_XP = (BASE_ATTR_POINTS*ATTR_EXP_COST)+(BASE_CLASS_EXP)+(CREATION_XP_BUDGET);

/**
 * Gets the total wound penalty (2*DW + FW)
 * @param {number} fleshWounds the amount of fleshwounds a character has
 * @param {number} deepWounds the amount of deep wounds a character has
 * @returns {number} the wound modifier.
 */
export function getWoundPenalty(fleshWounds, deepWounds) {
  return (fleshWounds || 0) + (deepWounds || 0) * 2;
}

/**
 * Checks if a character is unskilled in that specific test. (Has a 0 in a skill or the total dice is reduced to less than zero)
 * @param {number} skillLevel the level of the skill being tested
 * @returns {number} returns 2 if unskilled, otherwise, returns the skill level.
 */
export function checkUnskilledTest(skillLevel) {
  return skillLevel <= 0 ? 2 : skillLevel;
}

/**
 * Gets the total dice for the test accounting for if the character is making an unskilled test or not.
 * @param {number} skillLevel 
 * @param {number} diceDelta 
 * @returns {number} the total dice to be rolled.
 */
export function getTotalTestDice(skillLevel, diceDelta) {
  const min = skillLevel <= 0 ? 2 : 0;
  return Math.max(min, checkUnskilledTest(skillLevel) + diceDelta);
}

/**
 * Calculates all of the derived stats of a character using their attributes and skills.
 * @param {*} character the character in question
 * @returns {JSON} an object with a characters defense, combatSense, health, stamina, systemShock, fleshThreshold, deepThreshold, instantDeath, unarmedDamage, armedDamage, woundMod
 */
export function calculateDerivedStats(character) {
  const attrs = character?.attributes ?? {};
  const skills = character?.skills ?? {};
  const equip = character?.equipment ?? {};
  const fleshWounds = character?.fleshWounds ?? 0;
  const deepWounds = character?.deepWounds ?? 0;

  const Alertness = attrs.Alertness || 0;
  const Body = attrs.Body || 0;
  const Intelligence = attrs.Intelligence || 0;
  const Spirit = attrs.Spirit || 0;
  const CQC = skills.CQC || 0;
  const Melee = skills.Melee || 0;

  const defense = 1 + Alertness + Body;
  const combatSense = 1 + Intelligence + Spirit;
  const health = Math.ceil((Body + Spirit) / 2);
  const stamina = 5 + Body + Spirit;
  const systemShock = 5 + health;

  const fleshThreshold = Math.ceil(stamina / 2) + (equip.armorClass ?? 0);
  const deepThreshold = stamina + (equip.armorClass ?? 0);
  const instantDeath = stamina * 2;
  const unarmedDamage = Math.ceil((3 + Body + CQC) / 1.5);
  const armedDamage = Math.ceil((3 + Body + Melee) / 1.5);
  const woundMod = getWoundPenalty(fleshWounds, deepWounds);

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
    woundMod
  };
}

/**
 * Gets the XP breakdown for a character.
 * @param {*} character the character in question
 * @returns {JSON} an object with the total exp spent (totalSpent), skill xp (skillXp), attribute xp (attrXP), specialization xp (specXp), multiclass xp (multiclassXp), any purchased attribute points (purchasedAttrPoints), e-dice spent (emergencyDiceXPSpent), and the base class xp (baseClassXp)
 */
export function getXPBreakdown(character) {
  const skills = character?.skills ?? {};
  const attrs = character?.attributes ?? {};
  const specializations = character?.specializations ?? [];
  const hasMulticlass = Boolean(character?.multiClass);
  const emergencyDiceXPSpent = character?.emergencyDiceXPSpent ?? 0;

  const totalSkillXP = Object.values(skills).reduce(
    (sum, lvl) => sum + (EXP_COST[Math.min(Math.max(lvl, 0), 4)] ?? 0),
    0
  );

  const totalAttrPoints = Object.values(attrs).reduce((a, b) => a + b, 0);
  const purchasedAttrPoints = Math.max(0, totalAttrPoints - BASE_ATTR_POINTS);
  const attrXP = purchasedAttrPoints * ATTR_EXP_COST;

  const specXP = specializations.length * SPEC_EXP_COST;
  const multiclassXP = hasMulticlass ? MULTICLASS_EXP_COST : 0;

  const totalSpent = totalSkillXP + attrXP + specXP + multiclassXP + emergencyDiceXPSpent;

  const baseClassXP = BASE_CLASS_EXP;
  const skillsXp = Math.max(
    0,
    totalSpent - baseClassXP - multiclassXP - specXP - attrXP - emergencyDiceXPSpent,
  );

  return {
    totalSpent,
    skillsXp,
    attrXP,
    specXP,
    multiclassXP,
    purchasedAttrPoints,
    emergencyDiceXPSpent,
    baseClassXP,
  };
}

/**
 * Gets the total amount of xp available to spend for that character.
 * @param {*} character the character in question
 * @returns {number} the available XP for that character.
 */
export function getAvailableXP(character) {
  const missionXPTotal = logEngine.getLogTotals(character?.logs).totalMissionXP || 0;
  const { totalSpent, baseClassXP } = getXPBreakdown(character);
  return baseClassXP + (character?.XP || 0) + missionXPTotal - totalSpent;
}

/**
 * Gets the cost of upgrading to the next level
 * @param {number} currentLevel 
 * @returns {number} the cost needed to get to the next level of a skill.
 */
export function getSkillUpgradeCost(currentLevel) {
  if (currentLevel >= 4) return 99; // To ensure a character cannot get past level 4 reasonably.
  const currentTotal = EXP_COST[currentLevel] || 0;
  const nextTotal = EXP_COST[currentLevel + 1] || 0;
  return nextTotal - currentTotal;
}

/**
 * Returns the total xp needed to get to a specific xp level.
 * @param {number} level the level a character is at.
 * @returns {number} the xp required to reach that level.
 */
export function getSkillXpInvestment(level) {
  return EXP_COST[Math.min(Math.max(level, 0), 4)] ?? 0;
}

/**
 * Initializes the base class skills of a character during character creation. Initially sets them all to zero, and then uses the class data to assign which ones are level 1 and 2
 * @param {string} characterClass the class of the character
 * @returns 
 */
export function initCharSkills(characterClass) {
  const base = {};
  const config = classData[characterClass];
  if (!config) return base;

  const allSkills = Object.values(skills).flat();
  allSkills.forEach((skill) => {
    base[skill] = 0;
  });

  config.level2.forEach((skill) => (base[skill] = 2));
  config.level1.forEach((skill) => (base[skill] = 1));

  return base;
}

/**
 * Determines what classes someone can multiclass into. You cannot multiclass into your current main class.
 * @param {*} currentClass the current class of the character.
 * @returns {string[]} an array of available classes to spec into.
 */
export function getAvailableMulticlassOptions(currentClass) {
  return Object.keys(classData).filter((spec) => spec != currentClass);
}

/**
 * Upgrades a characters skill using their current skills, the available xp.
 * @param {*} currSkills a character's current skills
 * @param {*} availableXP the available xp for that character
 * @param {*} skill 
 * @returns {JSON | null} the character's skill block with the levels changed. Null if unavailable.
 */
export function upgradeSkill(currSkills, availableXP, skill) {
  const level = currSkills[skill] || 0;
  if (level >= 4) return null;

  const cost = getSkillUpgradeCost(level);
  if (availableXP < cost) return null;

  return {
    skills: { ...currSkills, [skill]: level + 1 },
  };
}

/**
 * Downgrades a characters skill using their current skills, the available xp.
 * @param {*} currSkills a character's current skills
 * @param {*} availableXP the available xp for that character
 * @param {*} skill the specific skill being changed.
 * @returns {JSON | null} the character's skill block with the levels changed. Null if unavailable.
 */
export function downgradeSkill(skills, skill, originalSkills) {
  const current = skills[skill] || 0;
  const original = originalSkills?.[skill] || 0;

  if (current <= original) return null;

  return {
    skills: { ...skills, [skill]: current - 1 },
  };
}

/**
 * Upgrades an attribute
 * @param {string} character le character
 * @param {string} attribute the attribute
 * @returns 
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
 * Downgrades an attribute
 * @param {string} character le character
 * @param {string} attribute the attribute
 * @returns 
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

/**
 * Upgrades a characters attribute using their current skills and the available xp.
 * @param {*} attributes a character's current attributes
 * @param {*} availableXP the available xp for that character
 * @param {*} attrKey the key of the attribute being changed. 
 * @returns {JSON | null} the character's attribute block being changed, null if the adjustment cannot be done.
 */
export function applyAttributeIncrease(attributes, availableXP, attrKey) {
  if (availableXP < ATTR_EXP_COST) return null;

  return {
    attributes: {
      ...attributes,
      [attrKey]: (attributes?.[attrKey] ?? 0) + 1,
    },
  };
}

/**
 * Downgrades a characters attribute using their current skills and the available xp. Cannot be reduced more than when the editing first started.
 * @param {*} attributes a character's current attributes
 * @param {*} availableXP the available xp for that character
 * @param {*} attrKey the key of the attribute being changed. 
 * @returns {JSON | null} the character's attribute block being changed, null if the adjustment cannot be done.
 */
export function applyAttributeDecrease(attributes, attrKey, originalAttributes) {
  const current = attributes?.[attrKey] ?? 0;
  const original = originalAttributes?.[attrKey] ?? 0;

  if (current <= original) return null;

  return {
    attributes: { ...attributes, [attrKey]: current - 1 },
  };
}

/**
 * Removes a specialization from the character.
 * @param {string[]} specializations the specializations of the character
 * @param {number} index the index of the specialization
 * @param {*} isEditing determines if the UI is in editing mode.
 * @returns {JSON} an array of updated specialiazations within the 'specializations' attribute.
 */
export function removeSpec(
  specializations,
  index,
  isEditing,
) {
  if (index < specializations.length && !isEditing) return null;

  const updated = [...specializations];
  updated.splice(index, 1);

  return {
    specializations: updated,
  };
}

/**
 * Adds a multiclass to the character.
 * @param {*} availableXP the available xp the character has.
 * @param {*} currentMultiClass if they have a multiclass currently.
 * @param {*} secClass the chosen secondary class.
 * @returns {JSON} the multiclass attribute assigned to the new secondary class.
 */
export function addMultiClass(availableXP, currentMultiClass, secClass) {
  if (!secClass || currentMultiClass) return null;
  if (availableXP < MULTICLASS_EXP_COST) return null;

  return {
    multiClass: secClass,
  };
}

/**
 * Adds an E-dice to the character, to a maximum of 4 while increasing the amount of E-diceXp spent in the JSON for that buy period.
 * @param {*} emergencyDice a character's current listed E-dice
 * @param {*} emergencyDiceXPSpent the tracked amount of E-dice spent.
 * @param {*} availableXP the available xp of the character.
 * @returns {JSON} the emergency dice and emergendyDiceXPSpent attributes increased by 1.
 */
export function applyEmergencyDiceIncrease(emergencyDice, emergencyDiceXPSpent, availableXP) {
  if (emergencyDice >= 4 || availableXP < 1) return null;

  return {
    emergencyDice: emergencyDice + 1,
    emergencyDiceXPSpent: emergencyDiceXPSpent + 1,
  };
}

/**
 * Reduces the amount of E-dice a character has by one, specific for editing mode where its not intended to be a permanent change if you're still deciding.
 * @param {*} emergencyDice a character's current listed E-dice
 * @param {*} emergencyDiceXPSpent the tracked amount of E-dice spent.
 * @param {*} isEditing flag for if the UI is in edit mode.
 * @returns {JSON} the emergency dice and emergendyDiceXPSpent attributes decreased by 1.
 */
export function applyEmergencyDiceDecrease(emergencyDice, emergencyDiceXPSpent, isEditing) {
  if (emergencyDice <= 0) return null;

  return {
    emergencyDice: emergencyDice - 1,
    emergencyDiceXPSpent: isEditing
      ? Math.max(0, emergencyDiceXPSpent - 1)
      : emergencyDiceXPSpent,
  };
}
