/**
 * Sync Engine
 * Talks to the backend character API on the roster's behalf. Every call
 * here is best-effort and non-blocking by design: the frontend and its
 * localStorage cache are always the source of truth for what's on screen.
 * Local mutations push here immediately (see CharacterCreator.jsx and
 * CharacterRoster.jsx); useBackgroundCharacterSync additionally reconciles
 * against the backend once per mount to catch drift from other devices.
 */

const API_BASE = "https://callicom.onrender.com";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const fetchRemoteCharacters = async (userId, token) => {
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) throw new Error(`Failed to fetch characters (${res.status})`);
  return res.json();
};

export const createRemoteCharacter = async (character, token) => {
  const res = await fetch(`${API_BASE}/api/characters`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      ...character,
      userId: character?.userId ?? character?.metadata?.userId ?? "",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create character (${res.status})`);
  return res.json();
};

export const updateRemoteCharacter = async (userId, callsign, character, token) => {
  // _id must never round-trip into a write: it arrives as a plain JSON
  // string (from Mongo's serialized ObjectId), and MongoDB rejects any
  // $set that touches the immutable _id field once its type no longer
  // matches what's actually stored on the document.
  const { _id, ...body } = character ?? {};
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}/${encodeURIComponent(callsign)}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(body),
      // Lets a request started right before tab close / navigation finish
      // in the background instead of being aborted with the page.
      keepalive: true,
    },
  );
  if (!res.ok) throw new Error(`Failed to update character (${res.status})`);
  return res.json();
};

// Per-character (userId+callsign) debounce/coalescing for update pushes.
// Every local edit funnels into CharacterRoster's updateCharacter, which used
// to PATCH immediately on each call — rapid actions (spending several XP
// entries, buying multiple items, adding log lines) fired one overlapping,
// unordered request per edit. This delays each push briefly and, if further
// edits land before it fires, coalesces them: only the latest full character
// state is ever sent, and only one request per character is ever in flight.
const UPDATE_DEBOUNCE_MS = 8000;
const updateQueues = new Map();

// Lets UI (a "saving" throbber) observe queue state without polling.
// Status is "idle" (nothing queued), "pending" (queued, waiting out the
// debounce) or "saving" (request in flight).
const statusListeners = new Map();

const getCharacterSaveStatus = (key) => {
  const entry = updateQueues.get(key);
  if (!entry) return "idle";
  return entry.sending ? "saving" : "pending";
};

const notifyStatus = (key) => {
  const status = getCharacterSaveStatus(key);
  for (const listener of statusListeners.get(key) ?? []) listener(status);
};

export const getRemoteCharacterSaveStatus = (userId, callsign) =>
  getCharacterSaveStatus(`${userId}::${callsign}`);

export const subscribeToRemoteCharacterSaveStatus = (userId, callsign, listener) => {
  const key = `${userId}::${callsign}`;
  if (!statusListeners.has(key)) statusListeners.set(key, new Set());
  statusListeners.get(key).add(listener);
  return () => {
    const listeners = statusListeners.get(key);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) statusListeners.delete(key);
  };
};

const flushCharacterUpdate = (key) => {
  const entry = updateQueues.get(key);
  if (!entry || entry.sending) return;

  entry.timeoutId = null;
  entry.sending = true;
  notifyStatus(key);
  const payload = entry.latestPayload;

  updateRemoteCharacter(entry.userId, entry.callsign, payload, entry.token)
    .catch((err) => {
      console.error("Failed to push character update to backend:", err);
    })
    .finally(() => {
      entry.sending = false;
      if (entry.latestPayload !== payload) {
        // A newer edit landed while this request was in flight; send it
        // right away rather than waiting out another debounce window.
        flushCharacterUpdate(key);
      } else {
        updateQueues.delete(key);
        notifyStatus(key);
      }
    });
};

export const queueRemoteCharacterUpdate = (userId, callsign, character, token) => {
  const key = `${userId}::${callsign}`;
  let entry = updateQueues.get(key);
  if (!entry) {
    entry = { timeoutId: null, sending: false, latestPayload: null };
    updateQueues.set(key, entry);
  }

  entry.userId = userId;
  entry.callsign = callsign;
  entry.token = token;
  entry.latestPayload = character;
  if (entry.timeoutId) clearTimeout(entry.timeoutId);
  entry.timeoutId = setTimeout(() => flushCharacterUpdate(key), UPDATE_DEBOUNCE_MS);
  notifyStatus(key);
};

/**
 * Sends a character's queued update immediately instead of waiting out the
 * debounce — used when the user switches away from a character or the page
 * is about to unload, so the last burst of edits isn't stranded. No-op if
 * nothing is queued for that character.
 */
export const flushRemoteCharacterUpdate = (userId, callsign) => {
  const key = `${userId}::${callsign}`;
  const entry = updateQueues.get(key);
  if (!entry) return;
  if (entry.timeoutId) {
    clearTimeout(entry.timeoutId);
    entry.timeoutId = null;
  }
  flushCharacterUpdate(key);
};

/** Flushes every character with a pending queued update. */
export const flushAllRemoteCharacterUpdates = () => {
  for (const [key, entry] of updateQueues) {
    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId);
      entry.timeoutId = null;
    }
    flushCharacterUpdate(key);
  }
};

export const deleteRemoteCharacter = async (userId, callsign, token) => {
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}/${encodeURIComponent(callsign)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );
  if (!res.ok) throw new Error(`Failed to delete character (${res.status})`);
  return res.json();
};

/**
 * The backend identifies a character by (userId, callsign) — that's what
 * its GET/PATCH/DELETE single-character routes key off of — so sync uses
 * the same pair to match a local character against a remote one.
 */
export const characterKey = (userId, character) =>
  `${userId}::${character?.callsign ?? ""}`;

// Bookkeeping fields that legitimately differ between a local record and
// its backend counterpart without representing a real conflict: Mongo's
// _id doesn't exist locally until a create round-trips, and updatedAt is
// stamped independently on each side rather than being compared itself.
const SYNC_IGNORED_KEYS = new Set(["_id", "updatedAt"]);

const deepEqualIgnoringSyncFields = (a, b) => {
  if (a === b) return true;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqualIgnoringSyncFields(item, b[index]));
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a).filter(
      (key) => !SYNC_IGNORED_KEYS.has(key) && a[key] !== undefined,
    );
    const bKeys = Object.keys(b).filter(
      (key) => !SYNC_IGNORED_KEYS.has(key) && b[key] !== undefined,
    );
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) => bKeys.includes(key) && deepEqualIgnoringSyncFields(a[key], b[key]),
    );
  }

  return false;
};

export const characterContentEqual = (a, b) => deepEqualIgnoringSyncFields(a, b);

/**
 * Diffs a local roster against the backend's copy for the same user.
 * Characters present on only one side are not conflicts — those get
 * synced silently by the caller. Only characters that exist on both
 * sides with different content, or that were deleted locally but still
 * exist remotely, need a person to decide.
 */
export const diffCharacterRosters = ({ userId, localCharacters, remoteCharacters, deletedKeys }) => {
  const localMap = new Map(
    localCharacters
      .filter((char) => char?.callsign)
      .map((char) => [characterKey(userId, char), char]),
  );
  const remoteMap = new Map(
    remoteCharacters
      .filter((char) => char?.callsign)
      .map((char) => [characterKey(userId, char), char]),
  );
  const tombstones = new Set(deletedKeys);

  const contentConflicts = [];
  const deletionConflicts = [];
  const toCreateRemote = [];
  const toPullLocal = [];
  const staleTombstones = [];

  const allKeys = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const key of allKeys) {
    const local = localMap.get(key);
    const remote = remoteMap.get(key);
    const tombstoned = tombstones.has(key);

    if (local && remote) {
      if (tombstoned) {
        staleTombstones.push(key);
      } else if (!characterContentEqual(local, remote)) {
        contentConflicts.push({ key, local, remote });
      }
    } else if (local && !remote) {
      if (tombstoned) {
        staleTombstones.push(key);
      } else {
        toCreateRemote.push({ key, local });
      }
    } else if (!local && remote) {
      if (tombstoned) {
        deletionConflicts.push({ key, remote });
      } else {
        toPullLocal.push(remote);
      }
    }
  }

  return { contentConflicts, deletionConflicts, toCreateRemote, toPullLocal, staleTombstones };
};
