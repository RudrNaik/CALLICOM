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
 * can be removed this way.
 */

/**
 * Empty receipt for a freshly logged mission: nothing's been bought against
 * its XP yet, and the character's emergency dice are snapshotted so a later
 * removal can restore exactly that pre-mission count.
 */
function emptyReceipt(character) {
  return {
    skills: {},
    attributes: {},
    specializations: [],
    xpSpent: 0,
    emergencyDiceBefore: character?.emergencyDice ?? 0,
    emergencyDiceXPSpentBefore: character?.emergencyDiceXPSpent ?? 0,
  };
}

/**
 * The character's current money total. Falls back to their starting cash
 * (from character creation) if no missions have been logged yet.
 */
export function getMoneyTotal(character) {
  if (typeof character?.money === "number") return character.money;
  return character?.metadata?.starting_cash ?? 0;
}

/**
 * Sums the XP and money earned across all logged missions.
 */
export function getLogTotals(logs) {
  const list = logs ?? [];
  return {
    totalMissionXP: list.reduce((sum, log) => sum + (log.missionXP || 0), 0),
    totalPayout: list.reduce((sum, log) => sum + (log.payout || 0), 0),
  };
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
    receipt: emptyReceipt(character),
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
 * Turns a mission's receipt into small display-ready summary lines (skill
 * levels bought, attribute points bought, specializations purchased, and the
 * emergency dice count at the time the mission was logged) for the Logs tab.
 * Returns an empty summary for a mission with no receipt (e.g. legacy data).
 */
export function describeReceipt(receipt) {
  const skills = Object.entries(receipt?.skills ?? {})
    .filter(([, delta]) => delta !== 0)
    .map(([skill, delta]) => `${skill} ${delta > 0 ? "+" : ""}${delta}`);

  const attributes = Object.entries(receipt?.attributes ?? {})
    .filter(([, delta]) => delta !== 0)
    .map(([attr, delta]) => `${attr} ${delta > 0 ? "+" : ""}${delta}`);

  const specializations = (receipt?.specializations ?? []).map(
    (spec) => spec.label || spec.skill,
  );

  return {
    skills,
    attributes,
    specializations,
    xpSpent: receipt?.xpSpent ?? 0,
    emergencyDiceBefore: receipt?.emergencyDiceBefore,
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
 * Adds a mission log entry, crediting its payout to the character's running
 * money total. Its XP isn't stored separately — it's picked up automatically
 * from `logs` wherever available XP is derived.
 * @returns {{logs: array, money: number}}
 */
export function applyMissionLogAdd(character, logs, entry) {
  return {
    logs: [...logs, entry],
    money: getMoneyTotal(character) + entry.payout,
  };
}

/**
 * Removes the most recently logged mission, reversing exactly what its
 * receipt says was bought with its XP: skill levels and attribute points are
 * rolled back by the recorded deltas, the specializations purchased since
 * are stripped back off, and emergency dice (count + lifetime XP spent) are
 * reset to their pre-mission snapshot — discarding any dice bought or used
 * since. Blocked if `index` isn't the last entry (an older receipt can't be
 * safely unwound once later missions/spending have layered on top of it), or
 * if refunding the payout would take the character's money negative.
 * @returns {{logs, money, skills, attributes, specializations, emergencyDice, emergencyDiceXPSpent}|null} null if blocked
 */
export function applyMissionLogRemove(character, logs, index) {
  const entry = logs[index];
  if (!entry) return null;
  if (index !== logs.length - 1) return null;

  const nextMoney = getMoneyTotal(character) - entry.payout;
  if (nextMoney < 0) return null;

  const receipt = entry.receipt ?? {};

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
    logs: logs.slice(0, -1),
    money: nextMoney,
    skills,
    attributes,
    specializations,
    emergencyDice: receipt.emergencyDiceBefore ?? character.emergencyDice ?? 0,
    emergencyDiceXPSpent:
      receipt.emergencyDiceXPSpentBefore ?? character.emergencyDiceXPSpent ?? 0,
  };
}
