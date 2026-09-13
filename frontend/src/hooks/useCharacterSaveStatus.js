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
export function useCharacterSaveStatus(userId, callsign) {
  const [status, setStatus] = useState(() =>
    callsign ? getRemoteCharacterSaveStatus(userId, callsign) : "idle",
  );

  useEffect(() => {
    if (!callsign) {
      setStatus("idle");
      return undefined;
    }
    setStatus(getRemoteCharacterSaveStatus(userId, callsign));
    return subscribeToRemoteCharacterSaveStatus(userId, callsign, setStatus);
  }, [userId, callsign]);

  return status;
}
