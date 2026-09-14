import { useEffect, useState } from "react";
import {
  getRemoteCharacterSaveStatus,
  subscribeToRemoteCharacterSaveStatus,
} from "../engine/syncEngine";

/**
 * Tracks a character's pending-backend-save status ("idle" | "pending" |
 * "saving") so UI can show a throbber during the debounce window and while
 * the PATCH is in flight, without polling the queue.
 */
export function useCharacterSaveStatus(userId, characterId) {
  const [status, setStatus] = useState(() =>
    characterId ? getRemoteCharacterSaveStatus(userId, characterId) : "idle",
  );

  useEffect(() => {
    if (!characterId) {
      setStatus("idle");
      return undefined;
    }
    setStatus(getRemoteCharacterSaveStatus(userId, characterId));
    return subscribeToRemoteCharacterSaveStatus(userId, characterId, setStatus);
  }, [userId, characterId]);

  return status;
}
