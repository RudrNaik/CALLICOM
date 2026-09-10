/**
 * Mission Logs Engine
 *
 * Pure functions for tracking a character's mission history. Each mission
 * log entry records the XP and money a character earned on a mission (dated
 * to the in-character day the mission happened, not when it was logged).
 * Mission XP isn't stored on the character directly — it's summed live from
 * `logs` as part of the character's derived available XP (see
 * `characterEngine.getAvailableXP`) — so adding an entry only needs to
 * append it here. A mission's payout, though, is added straight to the
 * character's running money total. Removing an entry reverses the payout,
 * and is blocked if doing so would take the money total or the derived
 * available XP below zero (e.g. the mission's XP or money has already been
 * spent).
 */
import { getAvailableXP } from "./characterEngine";

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
 * if omitted.
 */
export function createMissionLog({ name, missionXP, payout, notes, date }) {
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || "Untitled Mission",
    missionXP: Number(missionXP) || 0,
    payout: Number(payout) || 0,
    notes: notes?.trim() || "",
    date: date || new Date().toISOString().slice(0, 10),
  };
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
 * Removes a mission log entry, refunding its payout back out of the
 * character's money total. Blocked if the character no longer has enough
 * money to refund, or if losing this mission's XP would drop the
 * character's derived available XP below zero (i.e. either has already been
 * spent).
 * @returns {{logs: array, money: number}|null} null if blocked
 */
export function applyMissionLogRemove(character, logs, index) {
  const entry = logs[index];
  if (!entry) return null;

  const nextMoney = getMoneyTotal(character) - entry.payout;
  if (nextMoney < 0) return null;

  const remainingMissionXP = getLogTotals(logs).totalMissionXP - entry.missionXP;
  if (getAvailableXP(character, remainingMissionXP) < 0) return null;

  const nextLogs = [...logs];
  nextLogs.splice(index, 1);

  return {
    logs: nextLogs,
    money: nextMoney,
  };
}
