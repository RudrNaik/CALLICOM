import { useCallback, useEffect, useRef, useState } from "react";
import { writeCharacterRosterCache } from "../engine/characterDataHandler";
import {
  getToken,
  getDeletedCharacterKeys,
  removeDeletedCharacterKey,
} from "../engine/memoryEngine";
import {
  fetchRemoteCharacters,
  createRemoteCharacter,
  updateRemoteCharacter,
  deleteRemoteCharacter,
  diffCharacterRosters,
  characterKey,
} from "../engine/syncEngine";

/**
 * Reconciles the character roster against the backend once, when the user
 * lands on the roster (mount / userId change) — not on a timer. Local
 * mutations made afterwards (create/update/delete) push straight to the
 * backend as they happen instead of waiting for another reconciliation, so
 * the only time this ever needs to ask the user anything is when the two
 * sides have genuinely diverged (e.g. edits made on another device), not on
 * every routine tick. Characters missing on only one side are synced
 * silently; characters that exist on both sides with different content, or
 * that were deleted here but still exist on the backend, are surfaced for
 * the user to decide.
 */
export function useCharacterRosterSync(userId, characters, setCharacters) {
  const [conflicts, setConflicts] = useState([]);
  const [deletionConflicts, setDeletionConflicts] = useState([]);
  const charactersRef = useRef(characters);
  charactersRef.current = characters;
  const syncingRef = useRef(false);

  const applyLocalUpdate = useCallback(
    (updater) => {
      setCharacters((prev) => {
        const next = updater(prev);
        writeCharacterRosterCache(userId, next);
        return next;
      });
    },
    [userId, setCharacters],
  );

  const reconcile = useCallback(async () => {
    if (syncingRef.current) return;
    const token = getToken();
    if (!userId || !token) return;

    syncingRef.current = true;
    try {
      const remoteCharacters = await fetchRemoteCharacters(userId, token);
      if (!Array.isArray(remoteCharacters)) return;

      const deletedKeys = getDeletedCharacterKeys(userId);
      const { contentConflicts, deletionConflicts: newDeletionConflicts, toCreateRemote, toPullLocal, staleTombstones } =
        diffCharacterRosters({
          userId,
          localCharacters: charactersRef.current,
          remoteCharacters,
          deletedKeys,
        });

      staleTombstones.forEach((key) => removeDeletedCharacterKey(userId, key));

      const pushedIds = [];
      for (const { key, local } of toCreateRemote) {
        try {
          const created = await createRemoteCharacter(local, token);
          const insertedId = created?.insertedId || created?._id;
          if (insertedId) pushedIds.push({ key, insertedId });
        } catch (err) {
          // Best-effort; this character will be retried on the next reconciliation.
          console.error("Failed to push local-only character to backend:", err);
        }
      }

      if (toPullLocal.length || pushedIds.length) {
        applyLocalUpdate((prev) => {
          let next = prev;
          if (pushedIds.length) {
            const idByKey = new Map(pushedIds.map((p) => [p.key, p.insertedId]));
            next = next.map((char) => {
              const key = characterKey(userId, char);
              return idByKey.has(key) ? { ...char, _id: idByKey.get(key) } : char;
            });
          }
          if (toPullLocal.length) {
            next = [...next, ...toPullLocal];
          }
          return next;
        });
      }

      setConflicts(contentConflicts);
      setDeletionConflicts(newDeletionConflicts);
    } catch (err) {
      // Backend unreachable or errored; stay silent, the next mount will retry.
      console.error("Character roster reconciliation failed:", err);
    } finally {
      syncingRef.current = false;
    }
  }, [userId, applyLocalUpdate]);

  useEffect(() => {
    if (!userId) return;
    reconcile();
  }, [userId, reconcile]);

  const resolveContentConflict = useCallback(
    async (key, choice) => {
      const token = getToken();
      const conflict = conflicts.find((entry) => entry.key === key);
      if (!conflict) return;

      if (choice === "local") {
        if (token) {
          try {
            await updateRemoteCharacter(userId, conflict.local.callsign, conflict.local, token);
          } catch (err) {
            // Will surface again on the next reconciliation if it still disagrees.
            console.error("Failed to push conflict resolution (keep local) to backend:", err);
          }
        }
      } else {
        applyLocalUpdate((prev) =>
          prev.map((char) => (characterKey(userId, char) === key ? conflict.remote : char)),
        );
      }

      setConflicts((prev) => prev.filter((entry) => entry.key !== key));
    },
    [conflicts, userId, applyLocalUpdate],
  );

  const resolveDeletionConflict = useCallback(
    async (key, choice) => {
      const token = getToken();
      const conflict = deletionConflicts.find((entry) => entry.key === key);
      if (!conflict) return;

      if (choice === "deleteRemote") {
        if (token) {
          try {
            await deleteRemoteCharacter(userId, conflict.remote.callsign, token);
          } catch (err) {
            // Will surface again on the next reconciliation.
            console.error("Failed to push conflict resolution (delete remote) to backend:", err);
            setDeletionConflicts((prev) => prev.filter((entry) => entry.key !== key));
            return;
          }
        }
        removeDeletedCharacterKey(userId, key);
      } else {
        applyLocalUpdate((prev) => [...prev, conflict.remote]);
        removeDeletedCharacterKey(userId, key);
      }

      setDeletionConflicts((prev) => prev.filter((entry) => entry.key !== key));
    },
    [deletionConflicts, userId, applyLocalUpdate],
  );

  return { conflicts, deletionConflicts, resolveContentConflict, resolveDeletionConflict };
}
