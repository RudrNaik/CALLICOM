import { useState } from "react";
import {
  createMissionLog,
  applyMissionLogAdd,
  applyMissionLogRemove,
  getMoneyTotal,
  getLogTotals,
} from "../../../engine/logsEngine";

const today = () => new Date().toISOString().slice(0, 10);

function LogsView({ character, refreshCharacter }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [missionXP, setMissionXP] = useState("");
  const [payout, setPayout] = useState("");
  const [notes, setNotes] = useState("");
  const [missionDate, setMissionDate] = useState(today);

  const logs = character?.logs ?? [];
  const money = getMoneyTotal(character);
  const { totalMissionXP, totalPayout } = getLogTotals(logs);

  const resetForm = () => {
    setName("");
    setMissionXP("");
    setPayout("");
    setNotes("");
    setMissionDate(today());
    setShowForm(false);
  };

  const handleAddMission = () => {
    const entry = createMissionLog({ name, missionXP, payout, notes, date: missionDate });
    const result = applyMissionLogAdd(character, logs, entry);
    refreshCharacter(result);
    resetForm();
  };

  const handleRemoveMission = (index) => {
    const result = applyMissionLogRemove(character, logs, index);
    if (!result) {
      alert(
        "Can't remove this mission — its XP or payout has already been spent.",
      );
      return;
    }
    refreshCharacter(result);
  };

  return (
    <div className="text-white">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 px-4 py-2 rounded">
          <span className="block text-xs text-neutral-400">Total XP Earned</span>
          <span className="text-lg font-bold text-orange-400">{totalMissionXP}</span>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 px-4 py-2 rounded">
          <span className="block text-xs text-neutral-400">Total Payout Earned</span>
          <span className="text-lg font-bold text-orange-400">{totalPayout}</span>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 px-4 py-2 rounded">
          <span className="block text-xs text-neutral-400">Current Money</span>
          <span className="text-lg font-bold text-green-400">{money}</span>
        </div>
      </div>

      <div className="mb-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded text-sm cursor-pointer"
          >
            + Log Mission
          </button>
        ) : (
          <div className="bg-neutral-900 border border-neutral-700 rounded p-4 space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Mission name"
                className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="date"
                title="In-character mission date"
                className="bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                value={missionDate}
                onChange={(e) => setMissionDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="XP earned"
                className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                value={missionXP}
                onChange={(e) => setMissionXP(e.target.value)}
              />
              <input
                type="number"
                placeholder="Money earned"
                className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white resize-y min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddMission}
                className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm cursor-pointer"
              >
                Save Mission
              </button>
              <button
                onClick={resetForm}
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-1 rounded text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="text-neutral-500 italic text-sm">No missions logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs
            .map((log, index) => ({ log, index }))
            .sort((a, b) => (b.log.date || "").localeCompare(a.log.date || ""))
            .map(({ log, index }) => (
              <div
                key={log.id ?? index}
                className="bg-neutral-900 border border-neutral-700 rounded p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-orange-400">{log.name}</div>
                  <div className="text-xs text-neutral-400">{log.date}</div>
                  {log.notes && (
                    <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap">
                      {log.notes}
                    </p>
                  )}
                  <div className="text-xs mt-1 space-x-3">
                    <span className="text-orange-300">+{log.missionXP} XP</span>
                    <span className="text-green-400">+{log.payout} Money</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMission(index)}
                  className="text-neutral-500 hover:text-red-400 text-xs cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default LogsView;
