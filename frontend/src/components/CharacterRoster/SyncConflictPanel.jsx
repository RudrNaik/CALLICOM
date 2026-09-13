/**
 * Small, dismissable-by-resolving corner panel for background sync
 * conflicts. Never blocks the rest of the roster: it just floats over the
 * page and lets the user decide, at their own pace, which side wins.
 */
function SyncConflictPanel({ conflicts, deletionConflicts, onResolveContent, onResolveDeletion }) {
  if (!conflicts.length && !deletionConflicts.length) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] space-y-2 text-white"
      style={{ fontFamily: "Geist_Mono" }}
    >
      {conflicts.map((conflict) => (
        <div
          key={conflict.key}
          className="bg-neutral-900/95 border border-orange-500 rounded p-3 shadow-lg text-sm"
        >
          <p className="font-semibold text-orange-400 mb-1">
            Sync mismatch: {conflict.local?.callsign || conflict.remote?.callsign}
          </p>
          <p className="text-gray-400 mb-2">
            This character's data is different between your device and the server's.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onResolveContent(conflict.key, "local")}
              className="px-2 py-1 border border-orange-500 rounded hover:bg-orange-500/30 text-xs"
            >
              Keep Local Version
            </button>
            <button
              onClick={() => onResolveContent(conflict.key, "remote")}
              className="px-2 py-1 border border-orange-500 rounded hover:bg-orange-500/30 text-xs"
            >
              Use Server Version
            </button>
          </div>
        </div>
      ))}

      {deletionConflicts.map((conflict) => (
        <div
          key={conflict.key}
          className="bg-neutral-900/95 border border-red-500 rounded p-3 shadow-lg text-sm"
        >
          <p className="font-semibold text-red-400 mb-1">
            Deleted character still on server: {conflict.remote?.callsign}
          </p>
          <p className="text-gray-400 mb-2">
            This character doesnt exist on your local roster, but exists on the server.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onResolveDeletion(conflict.key, "deleteRemote")}
              className="px-2 py-1 border border-red-500 rounded hover:bg-red-500/30 text-xs"
            >
              Delete character on Server
            </button>
            <button
              onClick={() => onResolveDeletion(conflict.key, "restore")}
              className="px-2 py-1 border border-orange-500 rounded hover:bg-orange-500/30 text-xs"
            >
              Restore character here
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SyncConflictPanel;
