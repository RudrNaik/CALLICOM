import classStartingSkills from "../data/classSkills.json";

export const EXP_COST = [0, 1, 5, 15, 30];
export const ATTR_EXP_COST = 30;
export const SPEC_EXP_COST = 5;
export const MULTICLASS_EXP_COST = 20;
export const BASE_ATTR_POINTS = 5;

// Character creation (SkillCreator.jsx): the shared XP budget for buying
// extra skills/specializations beyond the free class package, and the free
// starting/maximum emergency dice count — trading dice away during creation
// frees up more of that budget (1 die = 1 XP), and trading back up spends it
// again, capped at this baseline.
export const CREATION_XP_BUDGET = 15;
export const BASELINE_EMERGENCY_DICE = 4;

/**
 * The XP value of a class's free starting skill package (its level1/level2
 * skills, per classSkills.json, costed via EXP_COST). Computed per-class
 * rather than a flat constant, since it must exactly match whatever free
 * skills a class actually grants for the derived available-XP formula to
 * balance to zero on a freshly created character.
 */
export function getBaseClassXP(characterClass) {
  const config = classStartingSkills[characterClass];
  if (!config) return 0;

  return (
    config.level2.length * EXP_COST[2] + config.level1.length * EXP_COST[1]
  );
}

/**
 * Computes the wound penalty from flesh/deep wound counts.
 */
export function getWoundPenalty(fleshWounds, deepWounds) {
  return (fleshWounds || 0) + (deepWounds || 0) * 2;
}

/**
 * Sums the roll calculator's ad-hoc dice modifiers into a single delta.
 */
export function getTotalDiceChange(diceModifiers) {
  return diceModifiers.reduce((sum, m) => sum + Number(m.value), 0);
}

/**
 * Base dice pool for a given skill level: unskilled (<=0) rolls 2 dice and
 * takes the lower, otherwise rolls `skillLevel` dice and keeps the highest.
 */
export function getBaseDiceCount(skillLevel) {
  return skillLevel <= 0 ? 2 : skillLevel;
}

/**
 * Effective dice pool after applying ad-hoc dice modifiers, floored so an
 * unskilled roll can never drop below 2 dice (skilled rolls can drop to 0).
 */
export function getEffectiveDiceCount(skillLevel, totalDiceChange) {
  const min = skillLevel <= 0 ? 2 : 0;
  return Math.max(min, getBaseDiceCount(skillLevel) + totalDiceChange);
}

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
  const unarmedDamage = Math.max(4, Math.ceil((3 + Body + CQC) / 1.5));
  const armedDamage = Math.max(4, Math.ceil((3 + Body + Melee) / 1.5));
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
    woundMod,
  };
}

/**
 * Computes the full XP breakdown for a character (total spent + sub-totals).
 * Ported from expAddedCalc.jsx
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

  // Matches expAddedCalc.jsx's original display math: the base class package
  // is shown as its own line item, so it's carved back out of the raw
  // skill-level XP total here.
  const baseClassXP = getBaseClassXP(character?.class);
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
 * Calculates the total XP spent by a character.
 * Ported from expAddedCalc.jsx
 */
export function calculateTotalSpentXP(character) {
  return getXPBreakdown(character).totalSpent;
}

/**
 * The character's current spendable XP, derived rather than stored directly:
 * the base class package + the character's `XP` stat (a bonus/misc pool that
 * is only ever added to, never spent from directly) + all XP earned from
 * logged missions, minus everything actually spent building the character
 * (skills/attributes/specializations/multiclass/emergency dice, per
 * `getXPBreakdown`).
 */
export function getAvailableXP(character, missionXPTotal = 0) {
  const { totalSpent, baseClassXP } = getXPBreakdown(character);
  return baseClassXP + (character?.XP || 0) + missionXPTotal - totalSpent;
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
 * Returns the list of classes a character may multiclass into (every class
 * except their current primary class).
 */
export function getAvailableMulticlassOptions(classData, currentClass) {
  return Object.keys(classData).filter((spec) => spec != currentClass);
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

/**
 * Pure variant of upgradeSkill that operates on CharacterDetail.jsx's edited
 * skills draft, checking cost against the character's derived available XP
 * (`getAvailableXP`) rather than a stored/mutable pool.
 * @returns {{skills: object}|null} null if blocked
 */
export function applySkillIncrease(skills, availableXP, skill) {
  const level = skills[skill] || 0;
  if (level >= 4) return null;

  const cost = getSkillUpgradeCost(level);
  if (availableXP < cost) return null;

  return {
    skills: { ...skills, [skill]: level + 1 },
  };
}

/**
 * Pure variant of downgradeSkill for CharacterDetail.jsx's edited skills
 * draft. No XP bookkeeping needed here: reducing a skill level automatically
 * frees up available XP since it's derived from current levels.
 * @returns {{skills: object}|null} null if blocked
 */
export function applySkillDecrease(skills, skill, originalSkills) {
  const current = skills[skill] || 0;
  const original = originalSkills?.[skill] || 0;

  if (current <= original) return null;

  return {
    skills: { ...skills, [skill]: current - 1 },
  };
}

/**
 * Pure variant of upgradeAttribute for CharacterDetail.jsx's attributes
 * draft, checked against derived available XP.
 * @returns {{attributes: object}|null} null if blocked
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
 * Undoes an attribute increase made this editing session. Blocked at or
 * below the attribute's already-saved value — like skills, an attribute
 * can't be sold back below what was true before this edit session started.
 * No XP bookkeeping needed: reducing a point automatically frees up
 * available XP since it's derived from the current point total.
 * @returns {{attributes: object}|null} null if blocked
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
 * Removes a specialization at `index`. Removal is blocked for a base
 * (already-saved) specialization unless currently editing. No XP bookkeeping
 * needed: removing a specialization automatically frees up available XP.
 * @returns {{specializations: array}|null} null if blocked
 */
export function applySpecializationRemoval(
  specializations,
  index,
  baseSpecializationsLength,
  isEditing,
) {
  if (index < baseSpecializationsLength && !isEditing) return null;

  const updated = [...specializations];
  updated.splice(index, 1);

  return {
    specializations: updated,
  };
}

/**
 * Applies a multiclass selection. Blocked if there's no selection, a
 * multiclass is already set, or there isn't enough available XP.
 * @returns {{multiClass: string}|null} null if blocked
 */
export function applyMulticlassSelection(availableXP, currentMultiClass, secClass) {
  if (!secClass || currentMultiClass) return null;
  if (availableXP < MULTICLASS_EXP_COST) return null;

  return {
    multiClass: secClass,
  };
}

/**
 * Adds an emergency die, permanently recording its 1 XP cost in
 * `emergencyDiceXPSpent` (a lifetime counter, separate from the `XP` bonus
 * stat, that never decreases from in-play die usage — only from undoing a
 * same-session purchase, see `applyEmergencyDiceDecrease`). Blocked at the
 * 4-die cap or with no available XP to spend.
 * @returns {{emergencyDice: number, emergencyDiceXPSpent: number}|null} null if blocked
 */
export function applyEmergencyDiceIncrease(emergencyDice, emergencyDiceXPSpent, availableXP) {
  if (emergencyDice >= 4 || availableXP < 1) return null;

  return {
    emergencyDice: emergencyDice + 1,
    emergencyDiceXPSpent: emergencyDiceXPSpent + 1,
  };
}

/**
 * Removes an emergency die. Refunds its 1 XP cost (decrementing
 * `emergencyDiceXPSpent`) only while editing — undoing a purchase made this
 * session. Removal during play instead just spends the die (the caller
 * patches that straight to storage) without touching XP, since dice used up
 * in a mission were already paid for. The "can't remove more than you
 * started with" guard/alert stays in the caller.
 * @returns {{emergencyDice: number, emergencyDiceXPSpent: number}|null} null if blocked
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
