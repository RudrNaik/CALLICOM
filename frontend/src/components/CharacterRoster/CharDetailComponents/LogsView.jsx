import { useEffect, useState } from "react";
import equipmentData from "../../../data/Equipment.json";
import {
  createMissionLog,
  createAchievement,
  applyMissionLogAdd,
  applyMissionLogRemove,
  applyMissionLogEdit,
  applyAchievementAdd,
  applyAchievementRemove,
  getMoneyTotal,
  getLogTotals,
  getMissionEarnings,
  describeReceipt,
  getEmergencyDiceXPDuring,
  ensureStartingLog,
} from "../../../engine/logsEngine";

const today = () => new Date().toISOString().slice(0, 10);

const emptyAchievementDraft = {
  name: "",
  criteria: "",
  xpPayout: "",
  cashPayout: "",
};

// A negative payout (a task/achievement that costs XP or money rather than
// awarding it) drops the "+" and shows red instead of its usual color, so
// it reads as a cost at a glance rather than looking like a typo'd bonus.
const formatSigned = (value) => (value < 0 ? `${value}` : `+${value}`);
const formatSignedCash = (value) => (value < 0 ? `-$${Math.abs(value)}` : `+$${value}`);
const signedClass = (value, positiveClass) => (value < 0 ? "text-red-400" : positiveClass);

/** One already-added achievement, shown wherever a mission's achievements are listed (the add-mission form's staged list, and the latest mission's edit view). */
function AchievementListItem({ achievement, onRemove }) {
  return (
    <div className="flex items-start justify-between gap-2 bg-neutral-800/60 rounded px-2 py-1 text-xs">
      <div>
        <div className="text-orange-300 font-medium">{achievement.name}</div>
        {achievement.criteria && (
          <div className="text-neutral-500">Criteria/Reason: {achievement.criteria}</div>
        )}
        <div className="space-x-3 mt-0.5">
          <span className={signedClass(achievement.xpPayout, "text-orange-300")}>
            {formatSigned(achievement.xpPayout)} XP
          </span>
          <span className={signedClass(achievement.cashPayout, "text-green-400")}>
            {formatSigned(achievement.cashPayout)} Money
          </span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-neutral-500 hover:text-red-400 shrink-0 cursor-pointer"
      >
        Remove
      </button>
    </div>
  );
}

/** The name/criteria/XP/cash inputs for drafting one new achievement, shared between the add-mission form and the latest mission's edit view. */
function AchievementDraftForm({ draft, setDraft, onSave, onCancel }) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Name"
        className="w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <textarea
        placeholder="Criteria/Reason"
        className="w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs resize-y min-h-[40px]"
        value={draft.criteria}
        onChange={(e) => setDraft({ ...draft, criteria: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="XP Adjustment"
          className="w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs"
          value={draft.xpPayout}
          onChange={(e) => setDraft({ ...draft, xpPayout: e.target.value })}
        />
        <input
          type="number"
          placeholder="Cash Adjustment"
          className="w-full bg-neutral-800 border border-gray-500 rounded px-2 py-1 text-white text-xs"
          value={draft.cashPayout}
          onChange={(e) => setDraft({ ...draft, cashPayout: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs cursor-pointer"
        >
          Save Achievement
        </button>
        <button
          onClick={onCancel}
          className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded text-xs cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function LogsView({ character, refreshCharacter }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [missionXP, setMissionXP] = useState("");
  const [payout, setPayout] = useState("");
  const [notes, setNotes] = useState("");
  const [missionDate, setMissionDate] = useState(today);

  // Achievements staged onto the mission being logged — folded into its
  // `achievements` when the mission is saved (see handleAddMission), rather
  // than requiring the mission to be saved first and edited afterward.
  const [newMissionAchievements, setNewMissionAchievements] = useState([]);
  const [showNewAchievementForm, setShowNewAchievementForm] = useState(false);
  const [newAchievementDraft, setNewAchievementDraft] = useState(emptyAchievementDraft);

  const [editingLatest, setEditingLatest] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [achievementDraft, setAchievementDraft] = useState(emptyAchievementDraft);

  const logs = ensureStartingLog(character, character?.logs ?? []);
  const money = getMoneyTotal(character, equipmentData);
  const { totalMissionXP, totalPayout } = getLogTotals(logs);

  // Every character needs a first log to attach receipts to (see
  // createStartingLog); persist it as soon as we notice one's missing so it
  // shows up "no matter what", not just once something's bought against it.
  useEffect(() => {
    if (!character?.logs || character.logs.length === 0) {
      refreshCharacter({ logs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.logs?.length]);

  const resetForm = () => {
    setName("");
    setMissionXP("");
    setPayout("");
    setNotes("");
    setMissionDate(today());
    setShowForm(false);
    setNewMissionAchievements([]);
    setShowNewAchievementForm(false);
    setNewAchievementDraft(emptyAchievementDraft);
  };

  const handleAddMission = () => {
    const entry = createMissionLog(
      { name, missionXP, payout, notes, date: missionDate },
      character,
    );
    entry.achievements = newMissionAchievements;
    const result = applyMissionLogAdd(character, logs, entry);
    refreshCharacter(result);
    resetForm();
  };

  const handleAddNewMissionAchievement = () => {
    setNewMissionAchievements([
      ...newMissionAchievements,
      createAchievement(newAchievementDraft),
    ]);
    setShowNewAchievementForm(false);
    setNewAchievementDraft(emptyAchievementDraft);
  };

  const handleRemoveNewMissionAchievement = (achIndex) => {
    setNewMissionAchievements(
      newMissionAchievements.filter((_, i) => i !== achIndex),
    );
  };

  const handleRemoveMission = (index) => {
    const result = applyMissionLogRemove(character, logs, index, equipmentData);
    if (!result) {
      alert(
        "Can't remove this mission — its payout has already been spent.",
      );
      return;
    }
    refreshCharacter(result);
  };

  const startEditLatest = (log) => {
    setEditDraft({
      name: log.name,
      date: log.date,
      notes: log.notes,
      missionXP: log.missionXP,
      payout: log.payout,
    });
    setEditingLatest(true);
  };

  const cancelEditLatest = () => {
    setEditingLatest(false);
    setEditDraft(null);
    setShowAchievementForm(false);
    setAchievementDraft(emptyAchievementDraft);
  };

  const handleSaveEditLatest = (index) => {
    const result = applyMissionLogEdit(character, logs, index, editDraft, equipmentData);
    if (!result) {
      alert(
        "Can't save that — it would take available XP or money below zero.",
      );
      return;
    }
    refreshCharacter(result);
    cancelEditLatest();
  };

  const handleAddAchievement = (index) => {
    const achievement = createAchievement(achievementDraft);
    const result = applyAchievementAdd(character, logs, index, achievement);
    refreshCharacter(result);
    setShowAchievementForm(false);
    setAchievementDraft(emptyAchievementDraft);
  };

  const handleRemoveAchievement = (missionIndex, achievementIndex) => {
    const result = applyAchievementRemove(
      character,
      logs,
      missionIndex,
      achievementIndex,
      equipmentData,
    );
    if (!result) {
      alert(
        "Can't remove that achievement — its XP or money has already been spent.",
      );
      return;
    }
    refreshCharacter(result);
  };

  return (
    <div className="text-white">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-sm">
          <span className="block text-xs text-neutral-400">Total XP Earned</span>
          <span className="text-lg font-bold text-orange-400">{totalMissionXP}</span>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-sm">
          <span className="block text-xs text-neutral-400">Total Payout</span>
          <span className="text-lg font-bold text-orange-400">${totalPayout}</span>
        </div>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-sm">
          <span className="block text-xs text-neutral-400">Current Cash</span>
          <span className="text-lg font-bold text-green-400">${money}</span>
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

            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="text-xs text-neutral-500">Achievements/Tasks/Etc. (optional)</div>
              {newMissionAchievements.map((achievement, achIndex) => (
                <AchievementListItem
                  key={achievement.id ?? achIndex}
                  achievement={achievement}
                  onRemove={() => handleRemoveNewMissionAchievement(achIndex)}
                />
              ))}
              {showNewAchievementForm ? (
                <AchievementDraftForm
                  draft={newAchievementDraft}
                  setDraft={setNewAchievementDraft}
                  onSave={handleAddNewMissionAchievement}
                  onCancel={() => {
                    setShowNewAchievementForm(false);
                    setNewAchievementDraft(emptyAchievementDraft);
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowNewAchievementForm(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer"
                >
                  + Add Achievement
                </button>
              )}
            </div>

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
            .sort((a, b) => b.index - a.index)
            .map(({ log, index }) => {
              const canRemove = index === logs.length - 1;
              const isEditingThis = editingLatest && canRemove;
              const receipt = describeReceipt(log.receipt, equipmentData);
              const ediceXPSpent = getEmergencyDiceXPDuring(logs, index, character);
              const totalXPSpent = receipt.xpSpent + ediceXPSpent;
              const hasReceipt =
                receipt.skills.length > 0 ||
                receipt.attributes.length > 0 ||
                receipt.specializations.length > 0 ||
                receipt.purchases.length > 0 ||
                ediceXPSpent !== 0;
              const earnings = getMissionEarnings(log);
              const hasAchievementBonus =
                earnings.xp !== log.missionXP || earnings.cash !== log.payout;
              const achievements = log.achievements ?? [];

              return (
                <div
                  key={log.id ?? index}
                  className="bg-neutral-900 border border-l-4 border-l-orange-500 border-neutral-700 rounded p-3 flex items-start justify-between gap-3"
                >
                  <div className="w-full">
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                            value={editDraft.name}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, name: e.target.value })
                            }
                          />
                          <input
                            type="date"
                            className="bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                            value={editDraft.date}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, date: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex gap-3">
                          <input
                            type="number"
                            placeholder="XP earned"
                            className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                            value={editDraft.missionXP}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, missionXP: e.target.value })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Money earned"
                            className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white"
                            value={editDraft.payout}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, payout: e.target.value })
                            }
                          />
                        </div>
                        <textarea
                          placeholder="Notes (optional)"
                          className="w-full bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white resize-y min-h-[60px]"
                          value={editDraft.notes}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, notes: e.target.value })
                          }
                        />

                        {/* Achievements are managed here, folded into the mission's edit view. */}
                        <div className="pt-2 border-t border-neutral-800 space-y-2">
                          <div className="text-xs text-neutral-500">Achievements/Tasks/Etc.</div>
                          {achievements.map((achievement, achIndex) => (
                            <AchievementListItem
                              key={achievement.id ?? achIndex}
                              achievement={achievement}
                              onRemove={() => handleRemoveAchievement(index, achIndex)}
                            />
                          ))}

                          {showAchievementForm ? (
                            <AchievementDraftForm
                              draft={achievementDraft}
                              setDraft={setAchievementDraft}
                              onSave={() => handleAddAchievement(index)}
                              onCancel={() => {
                                setShowAchievementForm(false);
                                setAchievementDraft(emptyAchievementDraft);
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setShowAchievementForm(true)}
                              className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer"
                            >
                              + Add Achievement
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditLatest(index)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditLatest}
                            className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-orange-400">{log.name}</div>
                        <div className="text-xs text-neutral-400">{log.date}</div>
                        {log.notes && (
                          <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap">
                            {log.notes}
                          </p>
                        )}
                        <div className="text-xs mt-1 space-x-3">
                          <span className="text-orange-300">+{log.missionXP} XP</span>
                          {log.metadata?.starting_cash != null ? (
                            <span className="text-green-400">
                              Starting Cash: ${log.metadata.starting_cash}
                            </span>
                          ) : (
                            <span className="text-green-400">+${log.payout}</span>
                          )}
                        </div>

                        {achievements.length > 0 && (
                          <div className="text-xs mt-2 pt-2 border-t border-neutral-800 space-y-1">
                            <div className="text-neutral-500">Achievements/Tasks/Etc.:</div>
                            {achievements.map((achievement, achIndex) => (
                              <div
                                key={achievement.id ?? achIndex}
                                className="bg-neutral-800/60 rounded px-2 py-1"
                              >
                                <div className="text-orange-300 font-medium">
                                  {achievement.name}
                                </div>
                                {achievement.criteria && (
                                  <div className="text-neutral-500">
                                    Criteria/Reason: {achievement.criteria}
                                  </div>
                                )}
                                <div className="space-x-3 mt-0.5">
                                  <span className={signedClass(achievement.xpPayout, "text-orange-300")}>
                                    {formatSigned(achievement.xpPayout)} XP
                                  </span>
                                  <span className={signedClass(achievement.cashPayout, "text-green-400")}>
                                    {formatSignedCash(achievement.cashPayout)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {hasAchievementBonus && (
                          <div className="text-xs mt-1 text-neutral-500">
                            Total with achievements/tasks/etc.:{" "}
                            <span className={signedClass(earnings.xp, "")}>
                              {formatSigned(earnings.xp)} XP
                            </span>
                            ,{" "}
                            <span className={signedClass(earnings.cash, "")}>
                              {formatSignedCash(earnings.cash)}
                            </span>
                          </div>
                        )}

                        {hasReceipt && (
                          <div className="text-xs mt-2 pt-2 border-t border-neutral-800 text-neutral-400 space-y-0.5">
                            <div className="text-neutral-500">Bought since:</div>
                            {receipt.skills.length > 0 && (
                              <div>Skills: {receipt.skills.join(", ")}</div>
                            )}
                            {receipt.attributes.length > 0 && (
                              <div>Attributes: {receipt.attributes.join(", ")}</div>
                            )}
                            {receipt.specializations.length > 0 && (
                              <div>
                                Specializations: {receipt.specializations.join(", ")}
                              </div>
                            )}
                            {ediceXPSpent !== 0 && (
                              <div>Emergency Dice: {ediceXPSpent} XP</div>
                            )}
                            <div className="text-orange-300 font-semibold">
                              Total XP Spent: {totalXPSpent}
                            </div>
                            {receipt.purchases.length > 0 && (
                              <div>
                                <div className="text-neutral-500">Purchased:</div>
                                {receipt.purchases.map((purchase, pIndex) => (
                                  <div key={pIndex} className="pl-2">
                                    {purchase.label} — ${purchase.cost}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {receipt.emergencyDiceBefore !== undefined && (
                          <div className="text-xs text-neutral-500 mt-1">
                            E-Dice at mission start: {receipt.emergencyDiceBefore}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditingThis &&
                    (canRemove ? (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => startEditLatest(log)}
                          className="text-neutral-500 hover:text-orange-400 text-xs cursor-pointer py-1 px-2 border rounded-sm border-orange-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveMission(index)}
                          className="text-neutral-500 hover:text-red-400 text-xs cursor-pointer py-1 px-2 border rounded-sm border-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span
                        title="Only the most recently logged mission can be edited or removed"
                        className="text-neutral-700 text-xs shrink-0"
                      >
                        Locked
                      </span>
                    ))}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default LogsView;
