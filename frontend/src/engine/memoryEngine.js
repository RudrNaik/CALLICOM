/**
 * Memory Engine
 * Centralizes all localStorage interactions to ensure consistency
 * and decouple UI components from browser storage APIs.
 */

const normalizeStorageKey = (key) => {
  const value = String(key ?? "").trim();
  return value || "memory_engine_default";
};

const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value, (_, item) =>
      typeof item === "undefined" ? null : item,
    );
  } catch (error) {
    console.error("MemoryEngine: Error serializing value", error);
    return null;
  }
};

const safeParseJson = (value) => {
  if (value == null || value === "") return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("MemoryEngine: Error parsing JSON value", error);
    return null;
  }
};

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    const testKey = "__memory_engine_probe__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
};

/**
 * Retrieves an item from localStorage.
 * @param {string} key - The localStorage key.
 * @returns {string|null} The value stored at the key.
 */
export const getMemory = (key) => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    return storage.getItem(normalizeStorageKey(key));
  } catch (error) {
    console.warn("MemoryEngine: Failed to read storage value", error);
    return null;
  }
};

/**
 * Sets an item in localStorage.
 * @param {string} key - The localStorage key.
 * @param {any} value - The value to store.
 */
export const setMemory = (key, value) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const normalizedKey = normalizeStorageKey(key);
    const stringValue = typeof value === "string" ? value : safeJsonStringify(value);
    storage.setItem(normalizedKey, stringValue ?? "null");
  } catch (error) {
    console.warn("MemoryEngine: Failed to write storage value", error);
  }
};

/**
 * Retrieves and parses a JSON item from localStorage.
 * @param {string} key - The localStorage key.
 * @returns {any|null} The parsed JSON object or null.
 */
export const getJsonMemory = (key) => {
  const raw = getMemory(key);
  return safeParseJson(raw);
};

/**
 * Stores a value as JSON in localStorage.
 * @param {string} key - The localStorage key.
 * @param {any} value - The value to store as JSON.
 */
export const setJsonMemory = (key, value) => {
  setMemory(key, JSON.stringify(value));
};

/**
 * Removes an item from localStorage.
 * @param {string} key - The localStorage key.
 */
export const clearMemory = (key) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(normalizeStorageKey(key));
  } catch (error) {
    console.warn("MemoryEngine: Failed to clear storage value", error);
  }
};

/**
 * Standard auth token helpers.
 */
export const getToken = () => getMemory("token");
export const setToken = (token) => setMemory("token", token);
export const clearToken = () => clearMemory("token");

/**
 * Cache helpers used by the character roster.
 */
export const getRosterCharactersCache = (userId) => {
  const key = `roster_characters_${userId}`;
  const cached = getJsonMemory(key);
  return cached?.data ?? cached ?? null;
};

export const setRosterCharactersCache = (userId, data) => {
  const key = `roster_characters_${userId}`;
  setJsonMemory(key, { data, ts: Date.now() });
};

export const getRosterEquipmentCache = () => {
  const cached = getJsonMemory("roster_equipment");
  return cached?.data ?? cached ?? null;
};

export const setRosterEquipmentCache = (data) => {
  setJsonMemory("roster_equipment", { data, ts: Date.now() });
};

export const clearRosterCache = (userId) => {
  clearMemory(`roster_characters_${userId}`);
  clearMemory("roster_equipment");
};

// --- Standardized Key Generators ---

/**
 * Generates a key for weapon ammo storage.
 */
export const getWeaponAmmoKey = (callsign, slot) => {
  const owner = normalizeStorageKey(callsign);
  const weaponSlot = normalizeStorageKey(slot);
  return `ammo_${owner}_${weaponSlot}`;
};

/**
 * Generates a key for gadget ammo storage.
 */
export const getGadgetAmmoKey = (callsign, gadgetId) => {
  const owner = normalizeStorageKey(callsign);
  const gadget = normalizeStorageKey(gadgetId);
  return `gadgetAmmo_${owner}_${gadget}`;
};
