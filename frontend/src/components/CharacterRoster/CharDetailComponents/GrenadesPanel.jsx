const GrenadesPanel = ({
  grenades,
  safeGrenades,
  safeGrenadeCounts,
  itemById,
  isEditing,
  charActive,
  onGrenadeChange,
  onGrenadeCountsChange,
}) => {
  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow">
      <h3 className="font-semibold text-orange-300 mb-1">Grenades</h3>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeGrenades.map((grenadeId, i) => {
            const grenadeData = itemById[grenadeId];
            return (
              <div className="flex flex-col" key={i}>
                <select
                  className="w-full bg-neutral-900 text-white border-1 border-orange-400/60 py-2 px-2 rounded"
                  value={grenadeId || ""}
                  onChange={(e) => onGrenadeChange(i, e.target.value)}
                >
                  <option value="">Select Grenade</option>
                  {grenades.map((grenade) => (
                    <option key={grenade.id} value={grenade.id}>
                      {grenade.title}
                    </option>
                  ))}
                </select>

                <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded mt-2 whitespace-pre-line flex flex-grow">
                  {grenadeData?.rulesText}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ gridAutoRows: "1fr" }}
        >
          {safeGrenades.map((grenadeId, i) => {
            const grenadeData = itemById[grenadeId];
            return (
              <div key={i} className="text-sm text-white space-y-1 flex flex-col">
                <div>
                  <span className="font-semibold text-neutral-300">
                    {grenadeData?.title || `Grenade ${i + 1}`}
                  </span>
                </div>
                {grenadeData && (
                  <div className="text-[10px] text-neutral-400 mb-2 whitespace-pre-line flex-grow">
                    {grenadeData?.rulesText}
                  </div>
                )}
                {charActive && (
                  <div>
                    <div className="px-2 py-1 rounded-xs bg-neutral-900 mb-2">
                      <span className="text-yellow-400">
                        {safeGrenadeCounts[i]} / 2
                      </span>{" "}
                      <span className="text-gray-400 italic">remaining</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const updated = [...safeGrenadeCounts];
                          updated[i] = Math.max(0, updated[i] - 1);
                          onGrenadeCountsChange(updated);
                        }}
                        disabled={safeGrenadeCounts[i] === 0}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                      >
                        Throw
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...safeGrenadeCounts];
                          updated[i] = 2;
                          onGrenadeCountsChange(updated);
                        }}
                        className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                      >
                        Resupply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrenadesPanel;
