/**
 * Sync Engine
 * Talks to the backend character API on the roster's behalf. Every call
 * here is best-effort and non-blocking by design: the frontend and its
 * localStorage cache are always the source of truth for what's on screen.
 * Local mutations push here immediately (see CharacterCreator.jsx and
 * CharacterRoster.jsx); useBackgroundCharacterSync additionally reconciles
 * against the backend once per mount to catch drift from other devices.
 */

export const API_BASE = "https://callicom.onrender.com";

/**
 * Fired when the backend rejects a request's token (401/403). Every character
 * route requires a valid login, so this only happens once the session is gone
 * (expired token, or a stale page left open after logging out). App.jsx
 * listens for it and sends the user to the login page.
 */
export const AUTH_EXPIRED_EVENT = "callicom:auth-expired";

const assertAuthorized = (res) => {
  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
};

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const fetchRemoteCharacters = async (userId, token) => {
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}`,
    { headers: authHeaders(token) },
  );
  assertAuthorized(res);
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
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Failed to create character (${res.status})`);
  return res.json();
};

export const updateRemoteCharacter = async (userId, uniqueId, character, token) => {
  // _id must never round-trip into a write: it arrives as a plain JSON
  // string (from Mongo's serialized ObjectId), and MongoDB rejects any
  // $set that touches the immutable _id field once its type no longer
  // matches what's actually stored on the document.
  const { _id, ...body } = character ?? {};
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}/${encodeURIComponent(uniqueId)}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(body),
      // Lets a request started right before tab close / navigation finish
      // in the background instead of being aborted with the page.
      keepalive: true,
    },
  );
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Failed to update character (${res.status})`);
  return res.json();
};

// Per-character (userId+uniqueId) debounce/coalescing for update pushes.
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

export const getRemoteCharacterSaveStatus = (userId, uniqueId) =>
  getCharacterSaveStatus(`${userId}::${uniqueId}`);

export const subscribeToRemoteCharacterSaveStatus = (userId, uniqueId, listener) => {
  const key = `${userId}::${uniqueId}`;
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

  updateRemoteCharacter(entry.userId, entry.uniqueId, payload, entry.token)
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

export const queueRemoteCharacterUpdate = (userId, uniqueId, character, token) => {
  const key = `${userId}::${uniqueId}`;
  let entry = updateQueues.get(key);
  if (!entry) {
    entry = { timeoutId: null, sending: false, latestPayload: null };
    updateQueues.set(key, entry);
  }

  entry.userId = userId;
  entry.uniqueId = uniqueId;
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
export const flushRemoteCharacterUpdate = (userId, uniqueId) => {
  const key = `${userId}::${uniqueId}`;
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

export const deleteRemoteCharacter = async (userId, uniqueId, token) => {
  const res = await fetch(
    `${API_BASE}/api/characters/${encodeURIComponent(userId)}/${encodeURIComponent(uniqueId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Failed to delete character (${res.status})`);
  return res.json();
};

/**
 * Identifies a character, both for local reconciliation (building the Maps
 * in diffCharacterRosters below) and as what the backend's single-character
 * GET/PATCH/DELETE routes key off of. Every character carries a
 * client-generated `uniqueId` (see CharacterCreator.jsx's createCharacterId)
 * that's stable and never shared between two characters, unlike `callsign`
 * — two characters can legitimately end up with the same callsign (nothing
 * stops it), and keying off callsign alone would silently collapse them
 * into one entry wherever this builds a Map, hiding one of them from
 * reconciliation entirely, or have a PATCH/DELETE land on the wrong one on
 * the backend. Falls back to callsign only for legacy characters predating
 * `uniqueId`.
 */
export const characterKey = (userId, character) =>
  `${userId}::${character?.uniqueId || character?.callsign || ""}`;

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
 * Backfills a real `uniqueId` onto legacy characters that predate the field
 * (missing entirely, or normalized to "" — see characterDataHandler's
 * normalizeCharacterMetadata), so they stop relying on the callsign fallback
 * in characterKey/the backend's singleCharacterFilter. Mutates matched
 * entries in `remoteCharacters` in place and returns a fresh
 * `localCharacters` array, so the caller can pass both straight into
 * diffCharacterRosters afterward using the same keys on both sides — doing
 * this any later (e.g. after diffing) would already have let one legacy
 * character's local and remote copies disagree on their key for that pass,
 * which reads as "local-only" plus "remote-only" and duplicates it.
 *
 * A callsign shared by more than one character missing a `uniqueId` is left
 * alone: the backend's callsign-fallback PATCH filter (see backend.js's
 * singleCharacterFilter) matches via Mongo's updateOne, which can only ever
 * reach one of them, so there's no way to safely assign each of two (or
 * more) same-callsign legacy documents a distinct id through the API alone.
 * Those need a one-off manual fix directly in the database.
 */
export const backfillMissingUniqueIds = async (userId, localCharacters, remoteCharacters, token) => {
  const missingRealId = (char) => !char?.uniqueId && char?.callsign;

  const groupByCallsign = (list) => {
    const groups = new Map();
    list.filter(missingRealId).forEach((char) => {
      const group = groups.get(char.callsign) ?? [];
      group.push(char);
      groups.set(char.callsign, group);
    });
    return groups;
  };

  const remoteGroups = groupByCallsign(remoteCharacters);
  const localGroups = groupByCallsign(localCharacters);

  let localChanged = false;
  const nextLocal = [...localCharacters];

  for (const [callsign, remoteGroup] of remoteGroups) {
    if (remoteGroup.length > 1) continue; // ambiguous remote duplicate
    const localGroup = localGroups.get(callsign) ?? [];
    if (localGroup.length > 1) continue; // ambiguous locally too

    const newId = crypto.randomUUID();
    try {
      await updateRemoteCharacter(userId, callsign, { uniqueId: newId }, token);
    } catch (err) {
      // Best-effort; this character will be retried on the next reconciliation.
      console.error("Failed to backfill uniqueId for legacy character:", callsign, err);
      continue;
    }
    remoteGroup[0].uniqueId = newId;

    if (localGroup.length === 1) {
      const index = nextLocal.indexOf(localGroup[0]);
      if (index !== -1) {
        nextLocal[index] = { ...nextLocal[index], uniqueId: newId };
        localChanged = true;
      }
    }
  }

  // Any local character still missing a real id at this point either has no
  // backend counterpart yet, or its counterpart already has a real uniqueId
  // that just hasn't made it into this device's cache (e.g. backfilled from
  // another session before this one last reconciled). Adopt that existing
  // remote id rather than minting a new one — minting one here would give
  // the same character two different ids on each side, which reads as two
  // different characters next reconcile and duplicates it.
  const allRemoteByCallsign = new Map();
  remoteCharacters.forEach((char) => {
    if (!char?.callsign) return;
    const group = allRemoteByCallsign.get(char.callsign) ?? [];
    group.push(char);
    allRemoteByCallsign.set(char.callsign, group);
  });

  nextLocal.forEach((char, index) => {
    if (!missingRealId(char)) return;
    if (remoteGroups.has(char.callsign)) return; // already handled above, or ambiguous

    const remoteMatches = allRemoteByCallsign.get(char.callsign) ?? [];
    if (remoteMatches.length > 1) return; // ambiguous — more than one remote character with this callsign

    const existingRemoteId = remoteMatches[0]?.uniqueId;
    nextLocal[index] = { ...char, uniqueId: existingRemoteId || crypto.randomUUID() };
    localChanged = true;
  });

  return { remoteCharacters, localCharacters: nextLocal, localChanged };
};

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
