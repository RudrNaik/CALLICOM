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
    },
  );
  if (!res.ok) throw new Error(`Failed to update character (${res.status})`);
  return res.json();
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
