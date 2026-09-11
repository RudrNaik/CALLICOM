/**
 * Mission Logs Engine
 *
 * Pure functions for tracking a character's mission history. Each mission
 * log entry records the XP and money a character earned on a mission (dated
 * to the in-character day the mission happened, not when it was logged), and
 * carries a `receipt` of exactly what that XP was spent on afterward: skill
 * levels and attribute points gained, specializations purchased, and the
 * character's emergency dice as they stood right before the mission. That
 * receipt is what lets a mission be un-logged cleanly later — reversing
 * precisely what its XP paid for, rather than just refusing to remove it.
 *
 * Because a receipt only makes sense relative to the missions logged after
 * it, only the most recently logged mission (the end of the `logs` array)
 * can be removed or edited this way.
 *
 * A mission can also carry `achievements`: extra XP/money awards (bonus
 * objectives, etc.) logged after the fact. Loot-granting achievements aren't
 * modeled yet. Adding one is always safe (it only ever grows the character's
 * totals); removing one is guarded the same way spending is, since an
 * achievement logged on any past mission may already have been spent.
 *
 * Logistics purchases (weapons/gadgets/gear bought with money, see
 * logisticsEngine.js) are recorded onto the same receipt for display
 * (`purchases`). Equipment (what's currently equipped) is never snapshotted
 * or reversed by hand — it's rebuilt from scratch from `logs` any time it
 * might have changed (see logisticsEngine.rebuildEquipmentFromLogs), so
 * removing a mission just means replaying one fewer receipt's worth of
 * purchases.
 *
 * Money follows the same rule: nothing stores a running total. getMoneyTotal
 * re-sums every mission's earnings minus every purchase's *current* cost
 * (re-priced live from Equipment.json, see logisticsEngine.getPurchaseCost)
 * each time it's called, so a price change in the catalog is reflected
 * everywhere immediately, and every mutation below only needs to change
 * `logs` — money is just however that comes out.
 */
import { getAvailableXP } from "./characterEngine";
import { sanitizeEquipmentOwnership } from "./equipmentEngine";
import { getPurchaseCost, rebuildEquipmentFromLogs } from "./logisticsEngine";

/**
 * Empty receipt for a freshly logged mission: nothing's been bought against
 * its XP/money yet, and the character's emergency dice are snapshotted so a
 * later removal can restore exactly the pre-mission state.
 */
function emptyReceipt(character) {
  return {
    skills: {},
    attributes: {},
    specializations: [],
    xpSpent: 0,
    emergencyDiceBefore: character?.emergencyDice ?? 0,
    emergencyDiceXPSpentBefore: character?.emergencyDiceXPSpent ?? 0,
    purchases: [],
  };
}

/**
 * The character's current money total: starting cash plus every logged
 * mission/achievement's cash earnings, minus every logistics purchase ever
 * made — re-priced live from `equipmentData` rather than trusted from
 * whatever a purchase was recorded at (see logisticsEngine.getPurchaseCost),
 * so an item's cost changing in the catalog changes this immediately for
 * every character who ever bought it. Falls back to starting cash alone if
 * no missions have been logged yet.
 */
export function getMoneyTotal(character, equipmentData) {
  const logs = character?.logs ?? [];
  if (logs.length === 0) return character?.metadata?.starting_cash ?? 0;

  return logs.reduce((total, log) => {
    const earnings = getMissionEarnings(log);
    const spent = (log?.receipt?.purchases ?? []).reduce(
      (sum, purchase) => sum + getPurchaseCost(purchase, equipmentData),
      0,
    );
    return total + earnings.cash - spent;
  }, 0);
}

/**
 * A mission's total XP/cash, including whatever its logged achievements add
 * on top of the base mission reward.
 */
export function getMissionEarnings(log) {
  const achievements = log?.achievements ?? [];
  return {
    xp:
      (log?.missionXP || 0) +
      achievements.reduce((sum, a) => sum + (a.xpPayout || 0), 0),
    cash:
      (log?.payout || 0) +
      achievements.reduce((sum, a) => sum + (a.cashPayout || 0), 0),
  };
}

/**
 * Sums the XP and money earned across all logged missions, achievements
 * included.
 */
export function getLogTotals(logs) {
  const list = logs ?? [];
  return list.reduce(
    (totals, log) => {
      const earnings = getMissionEarnings(log);
      return {
        totalMissionXP: totals.totalMissionXP + earnings.xp,
        totalPayout: totals.totalPayout + earnings.cash,
      };
    },
    { totalMissionXP: 0, totalPayout: 0 },
  );
}

/**
 * Builds a new mission log entry from form input. `date` is the in-character
 * date the mission took place (a "YYYY-MM-DD" string from a date input), not
 * necessarily today — it's supplied by the caller, defaulting to today only
 * if omitted. `character` is the current (pre-mission) character, used only
 * to snapshot the receipt's starting emergency dice.
 */
export function createMissionLog({ name, missionXP, payout, notes, date }, character) {
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || "Untitled Mission",
    missionXP: Number(missionXP) || 0,
    payout: Number(payout) || 0,
    notes: notes?.trim() || "",
    date: date || new Date().toISOString().slice(0, 10),
    achievements: [],
    receipt: emptyReceipt(character),
  };
}

/**
 * Every character needs a first log entry to attach spending receipts to —
 * without one, purchases/skill buys made before any real mission is logged
 * (funded by starting cash) aren't tracked anywhere and can't be reversed.
 * This builds that entry, crediting the character's starting cash as its
 * payout so it flows through the same money total as any other mission
 * (see getMoneyTotal) instead of a separate special case. That same amount
 * is also recorded in `metadata.starting_cash`, so the Logs tab can display
 * it distinctly from a mission's earned payout.
 */
export function createStartingLog(character) {
  const startingCash = character.metadata.starting_cash || 0;

  return {
    ...createMissionLog(
      {
        name: "Orientation",
        missionXP: 0,
        payout: startingCash,
        notes: "Starting cash and other bonuses from character creation.",
        date: character?.createdAt?.slice(0, 10),
      },
      character,
    )
  };
}

/**
 * Returns `logs` unchanged if it already has entries, otherwise a new array
 * containing just the starting log (see createStartingLog). Callers should
 * use this instead of reading `character.logs` directly wherever a receipt
 * needs to exist to attach to — the caller is responsible for actually
 * persisting the result the first time something gets attached to it.
 */
export function ensureStartingLog(character, logs) {
  if (logs && logs.length > 0) return logs;
  return [createStartingLog(character)];
}

/**
 * Builds a new achievement entry from form input.
 */
export function createAchievement({ name, criteria, xpPayout, cashPayout }) {
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || "Unnamed Achievement",
    criteria: criteria?.trim() || "",
    xpPayout: Number(xpPayout) || 0,
    cashPayout: Number(cashPayout) || 0,
  };
}

/**
 * Diffs two {key: count} maps (skill levels, attribute points) into a
 * {key: delta} map of only the keys that changed.
 */
export function diffCounts(before, after) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const deltas = {};
  keys.forEach((key) => {
    const delta = (after?.[key] || 0) - (before?.[key] || 0);
    if (delta !== 0) deltas[key] = delta;
  });
  return deltas;
}

/**
 * Records XP spent on skills/attributes/specializations onto the most
 * recently logged mission's receipt, so removing that mission later can
 * reverse exactly what was bought with its XP. No-op if no mission has been
 * logged yet (there's nothing to attribute the spend to).
 */
export function recordSpendOnLatestMission(
  logs,
  { skillDeltas, attributeDeltas, newSpecializations, xpSpentDelta = 0 } = {},
) {
  if (!logs || logs.length === 0) return logs;

  const lastIndex = logs.length - 1;
  const last = logs[lastIndex];
  const receipt = last.receipt ?? emptyReceipt();

  const skills = { ...receipt.skills };
  Object.entries(skillDeltas ?? {}).forEach(([skill, delta]) => {
    skills[skill] = (skills[skill] || 0) + delta;
  });

  const attributes = { ...receipt.attributes };
  Object.entries(attributeDeltas ?? {}).forEach(([attr, delta]) => {
    attributes[attr] = (attributes[attr] || 0) + delta;
  });

  const specializations = [
    ...(receipt.specializations ?? []),
    ...(newSpecializations ?? []),
  ];

  const xpSpent = (receipt.xpSpent ?? 0) + xpSpentDelta;

  const nextLogs = [...logs];
  nextLogs[lastIndex] = {
    ...last,
    receipt: { ...receipt, skills, attributes, specializations, xpSpent },
  };
  return nextLogs;
}

/**
 * Records a logistics purchase (see logisticsEngine.js) onto the most
 * recently logged mission's receipt, for display purposes only — the actual
 * money spend and equipment change are applied by the caller
 * (logisticsEngine.applyPurchase). No-op if no mission has been logged yet.
 */
export function recordPurchaseOnLatestMission(logs, purchase) {
  if (!logs || logs.length === 0) return logs;

  const lastIndex = logs.length - 1;
  const last = logs[lastIndex];
  const receipt = last.receipt ?? emptyReceipt();

  const nextLogs = [...logs];
  nextLogs[lastIndex] = {
    ...last,
    receipt: { ...receipt, purchases: [...(receipt.purchases ?? []), purchase] },
  };
  return nextLogs;
}

/**
 * Turns a mission's receipt into small display-ready summary lines (skill
 * levels bought, attribute points bought, specializations purchased, the
 * emergency dice count at the time the mission was logged, and any
 * logistics purchases) for the Logs tab. Returns an empty summary for a
 * mission with no receipt (e.g. legacy data).
 */
export function describeReceipt(receipt, equipmentData) {
  const skills = Object.entries(receipt?.skills ?? {})
    .filter(([, delta]) => delta !== 0)
    .map(([skill, delta]) => `${skill} ${delta > 0 ? "+" : ""}${delta}`);

  const attributes = Object.entries(receipt?.attributes ?? {})
    .filter(([, delta]) => delta !== 0)
    .map(([attr, delta]) => `${attr} ${delta > 0 ? "+" : ""}${delta}`);

  const specializations = (receipt?.specializations ?? []).map(
    (spec) => spec.label || spec.skill,
  );

  const purchases = (receipt?.purchases ?? []).map((purchase) => ({
    label: purchase.label,
    cost: getPurchaseCost(purchase, equipmentData),
  }));

  return {
    skills,
    attributes,
    specializations,
    xpSpent: receipt?.xpSpent ?? 0,
    emergencyDiceBefore: receipt?.emergencyDiceBefore,
    purchases,
  };
}

/**
 * How much emergency-dice XP was spent during a given mission's window
 * (between it being logged and whatever was logged next, or now if it's the
 * most recent). Computed from the emergency-dice-XP-spent snapshots taken at
 * each mission's logging time, rather than stored directly on the receipt,
 * since only the boundary snapshots are needed.
 */
export function getEmergencyDiceXPDuring(logs, index, character) {
  const list = logs ?? [];
  const entry = list[index];
  if (!entry) return 0;

  const before = entry.receipt?.emergencyDiceXPSpentBefore ?? 0;
  const after =
    index < list.length - 1
      ? list[index + 1].receipt?.emergencyDiceXPSpentBefore ?? before
      : character?.emergencyDiceXPSpent ?? before;

  return after - before;
}

/**
 * Adds a mission log entry. Money isn't stored — it's picked up automatically
 * from `logs` wherever getMoneyTotal is called, same as XP.
 * @returns {{logs: array}}
 */
export function applyMissionLogAdd(character, logs, entry) {
  return { logs: [...logs, entry] };
}

/**
 * Removes the most recently logged mission, reversing exactly what its
 * receipt says was bought with its XP: skill levels and attribute points are
 * rolled back by the recorded deltas, the specializations purchased since are
 * stripped back off, and emergency dice (count + lifetime XP spent) are reset
 * to their pre-mission snapshot. Equipment and money both just fall out of
 * the shortened `logs` (see rebuildEquipmentFromLogs / getMoneyTotal) —
 * removing the mission also removes whatever purchases were recorded on its
 * receipt, refunding them for free. Blocked if `index` isn't the last entry
 * (an older receipt can't be safely unwound once later missions/spending
 * have layered on top of it), or if doing so would leave the character's
 * money negative.
 * @returns {{logs, skills, attributes, specializations, emergencyDice, emergencyDiceXPSpent, equipment}|null} null if blocked
 */
export function applyMissionLogRemove(character, logs, index, equipmentData) {
  const entry = logs[index];
  if (!entry) return null;
  if (index !== logs.length - 1) return null;

  const receipt = entry.receipt ?? {};
  const nextLogs = logs.slice(0, -1);

  const nextMoney = getMoneyTotal({ ...character, logs: nextLogs }, equipmentData);
  if (nextMoney < 0) return null;

  const skills = { ...(character.skills ?? {}) };
  Object.entries(receipt.skills ?? {}).forEach(([skill, delta]) => {
    skills[skill] = Math.max(0, (skills[skill] || 0) - delta);
  });

  const attributes = { ...(character.attributes ?? {}) };
  Object.entries(receipt.attributes ?? {}).forEach(([attr, delta]) => {
    attributes[attr] = Math.max(0, (attributes[attr] || 0) - delta);
  });

  // Specializations are only ever appended, so the ones this receipt
  // recorded as purchased are necessarily the trailing entries.
  const specCount = receipt.specializations?.length ?? 0;
  const specializations =
    specCount > 0
      ? (character.specializations ?? []).slice(0, -specCount)
      : [...(character.specializations ?? [])];

  return {
    logs: nextLogs,
    skills,
    attributes,
    specializations,
    emergencyDice: receipt.emergencyDiceBefore ?? character.emergencyDice ?? 0,
    emergencyDiceXPSpent:
      receipt.emergencyDiceXPSpentBefore ?? character.emergencyDiceXPSpent ?? 0,
    equipment: sanitizeEquipmentOwnership(rebuildEquipmentFromLogs(nextLogs), nextLogs),
  };
}

/**
 * Edits the most recently logged mission's own fields (name/date/notes/
 * missionXP/payout) in place, instead of having to remove and re-add it.
 * Only the last entry is editable, matching the removal restriction — its
 * receipt-based spending assumes its XP/money contribution to the totals,
 * so an older entry could invalidate spending already layered on top of it.
 * Blocked if the new missionXP/payout would take the character's derived
 * available XP or money negative.
 * @returns {{logs: array}|null} null if blocked
 */
export function applyMissionLogEdit(character, logs, index, updates, equipmentData) {
  const entry = logs[index];
  if (!entry) return null;
  if (index !== logs.length - 1) return null;

  const nextEntry = {
    ...entry,
    name: updates.name?.trim() || entry.name,
    date: updates.date || entry.date,
    notes: updates.notes?.trim() ?? entry.notes,
    missionXP: Number(updates.missionXP) || 0,
    payout: Number(updates.payout) || 0,
  };

  const nextLogs = [...logs];
  nextLogs[index] = nextEntry;

  const nextMoney = getMoneyTotal({ ...character, logs: nextLogs }, equipmentData);
  if (nextMoney < 0) return null;

  const xpDelta = getMissionEarnings(nextEntry).xp - getMissionEarnings(entry).xp;
  const nextMissionXPTotal = getLogTotals(logs).totalMissionXP + xpDelta;
  if (getAvailableXP(character, nextMissionXPTotal) < 0) return null;

  return { logs: nextLogs };
}

/**
 * Adds an achievement to a mission. Always safe regardless of which mission
 * (even an old one) — it only ever grows the character's XP/money totals.
 * @returns {{logs: array}}
 */
export function applyAchievementAdd(character, logs, missionIndex, achievement) {
  const entry = logs[missionIndex];
  const nextLogs = [...logs];
  nextLogs[missionIndex] = {
    ...entry,
    achievements: [...(entry.achievements ?? []), achievement],
  };

  return { logs: nextLogs };
}

/**
 * Removes an achievement from a mission, refunding its cash/XP contribution.
 * Blocked if doing so would take the character's money or derived available
 * XP negative (i.e. it's already been spent).
 * @returns {{logs: array}|null} null if blocked
 */
export function applyAchievementRemove(character, logs, missionIndex, achievementIndex, equipmentData) {
  const entry = logs[missionIndex];
  const achievement = entry?.achievements?.[achievementIndex];
  if (!achievement) return null;

  const nextMoney = getMoneyTotal(character, equipmentData) - achievement.cashPayout;
  if (nextMoney < 0) return null;

  const nextMissionXPTotal = getLogTotals(logs).totalMissionXP - achievement.xpPayout;
  if (getAvailableXP(character, nextMissionXPTotal) < 0) return null;

  const nextAchievements = [...entry.achievements];
  nextAchievements.splice(achievementIndex, 1);

  const nextLogs = [...logs];
  nextLogs[missionIndex] = { ...entry, achievements: nextAchievements };

  return { logs: nextLogs };
}
