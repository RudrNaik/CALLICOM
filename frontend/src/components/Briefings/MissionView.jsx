import React, { useState, useEffect } from "react";

function MissionView({
  currentMission,
  isAdmin,
  refreshMissions,
  currentCampaignId,
  handleDeleteMission,
}) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [missionData, setMissionData] = useState(null);
  const [staticMissionID, setStaticID] = useState(null);

  useEffect(() => {
    setMissionData(currentMission);
  }, [currentMission]);

  const handleChange = (field, value) => {
    setMissionData((prev) => ({ ...prev, [field]: value }));
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = { ...missionData.Objectives, [index]: value };
    setMissionData((prev) => ({ ...prev, Objectives: newObjectives }));
  };

  const addObjective = () => {
    const keys = Object.keys(missionData.Objectives || {});
    const nextKey = keys.length.toString();
    setMissionData((prev) => ({
      ...prev,
      Objectives: { ...prev.Objectives, [nextKey]: "" },
    }));
  };

  const removeObjective = (index) => {
    const newObj = { ...missionData.Objectives };
    delete newObj[index];
    setMissionData((prev) => ({ ...prev, Objectives: newObj }));
  };

  const handleAchievementChange = (idx, field, value) => {
    const updated = [...(missionData.Debrief?.Score?.Achievements || [])];
    updated[idx][field] = value;
    setMissionData((prev) => ({
      ...prev,
      Debrief: {
        ...prev.Debrief,
        Score: { ...prev.Debrief.Score, Achievements: updated },
      },
    }));
  };

  const addAchievement = () => {
    const updated = [
      ...(missionData.Debrief?.Score?.Achievements || []),
      { name: "", description: "", unlocks: "", completed: false },
    ];
    setMissionData((prev) => ({
      ...prev,
      Debrief: {
        ...prev.Debrief,
        Score: { ...prev.Debrief.Score, Achievements: updated },
      },
    }));
  };

  const removeAchievement = (idx) => {
    const updated = [...missionData.Debrief.Score.Achievements];
    updated.splice(idx, 1);
    setMissionData((prev) => ({
      ...prev,
      Debrief: {
        ...prev.Debrief,
        Score: { ...prev.Debrief.Score, Achievements: updated },
      },
    }));
  };

  const saveMission = async () => {
    const token = localStorage.getItem("token");
    const updatedMission = { ...missionData, campaignId: currentCampaignId };
    delete updatedMission._id;

    setSubmitting(true);

    try {
      await fetch(
        `https://callicom.onrender.com/api/missions/${currentMission.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedMission),
        }
      );
      await refreshMissions();
      setEditing(false);
    } catch (error) {
      console.error("Error saving mission:", error);
    } finally {
      setSubmitting(false);
      setStaticID(missionData.id);
    }
  };

  if (!missionData) return null;

  return (
    <div className="bg-neutral-800/90 border border-orange-500  min-w-full rounded-xl p-6 shadow-lg min-h-[700px] max-h-[700px] overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
      {editing ? (
        <div className="min-w-sm">
          <p className="text-orange-300 text-xs font-bold">Mission ID</p>
          <input
            disabled={submitting}
            className="w-full p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.id}
            onChange={(e) => handleChange("id", e.target.value)}
          />

          <p className="text-orange-300 text-xs font-bold mt-2">Name</p>
          <input
            disabled={submitting}
            className="w-full p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.Name}
            onChange={(e) => handleChange("Name", e.target.value)}
          />

          <p className="text-orange-300 text-xs font-bold mt-2">Type</p>
          <input
            disabled={submitting}
            className="w-full p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.Type}
            onChange={(e) => handleChange("Type", e.target.value)}
          />

          <p className="text-orange-300 text-xs font-bold mt-2">Status</p>
          <select
            disabled={submitting}
            className="w-full p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option>ACTIVE</option>
            <option>COMPLETED</option>
            <option>UPCOMING</option>
          </select>

          <p className="text-orange-300 text-xs font-bold mt-2">Location</p>
          <input
            disabled={submitting}
            className="w-full p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />

          <p className="text-orange-300 text-xs font-bold mt-2">Lat/long</p>
          <input
            disabled={submitting}
            className="w-md p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.lat}
            onChange={(e) => handleChange("lat", e.target.value)}
          />
          <input
            disabled={submitting}
            className="w-md p-2 bg-neutral-900 border border-orange-400 rounded"
            value={missionData.lon}
            onChange={(e) => handleChange("lon", e.target.value)}
          />


          {"Brief,Execution,FA,Support,CnC".split(",").map((field) => (
            <div key={field}>
              <p className="text-orange-300 text-xs font-bold mt-2">
                {field === "FA"
                  ? "Force Assessment"
                  : field === "CnC"
                  ? "Command and Control"
                  : field}
              </p>
              <textarea
                disabled={submitting}
                className="w-full p-2 min-h-70 bg-neutral-900 border border-orange-400 rounded whitespace-pre-wrap"
                rows={3}
                value={missionData[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={field}
              />
            </div>
          ))}

          <p className="text-orange-300 text-xs font-bold mb-1">Objectives</p>
          {Object.entries(missionData.Objectives || {}).map(([key, val]) => (
            <div key={key} className="flex gap-2 mb-1">
              <input
                disabled={submitting}
                className="flex-1 p-2 bg-neutral-900 border border-orange-400 rounded"
                value={val}
                onChange={(e) => handleObjectiveChange(key, e.target.value)}
              />
              <button
                disabled={submitting}
                onClick={() => removeObjective(key)}
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={addObjective} className="text-orange-400">
            + Add Objective
          </button>

          {missionData.status === "COMPLETED" && (
            <div>
              <p className="text-orange-300 text-sm font-bold mt-4 mb-1">
                Debrief
              </p>
              <textarea
                rows={4}
                className="w-full p-2 bg-neutral-900 border border-orange-400 rounded whitespace-pre-wrap"
                value={missionData.Debrief?.Debriefing || ""}
                onChange={(e) =>
                  setMissionData((prev) => ({
                    ...prev,
                    Debrief: { ...prev.Debrief, Debriefing: e.target.value },
                  }))
                }
              />
              <p className="text-orange-300 text-xs font-bold mt-2 mb-1">
                Achievements
              </p>
              {(missionData.Debrief?.Score?.Achievements || []).map((a, i) => (
                <div key={i} className="mb-2 space-y-1">
                  <input
                    disabled={submitting}
                    className="w-full p-1 bg-neutral-900 border border-orange-400 rounded"
                    value={a.name}
                    onChange={(e) =>
                      handleAchievementChange(i, "name", e.target.value)
                    }
                    placeholder="Achievement Name"
                  />
                  <input
                    disabled={submitting}
                    className="w-full p-1 bg-neutral-900 border border-orange-400 rounded"
                    value={a.description}
                    onChange={(e) =>
                      handleAchievementChange(i, "description", e.target.value)
                    }
                    placeholder="Description"
                  />
                  <input
                    disabled={submitting}
                    className="w-full p-1 bg-neutral-900 border border-orange-400 rounded"
                    value={a.unlocks}
                    onChange={(e) =>
                      handleAchievementChange(i, "unlocks", e.target.value)
                    }
                    placeholder="Unlocks"
                  />
                  <label className="text-xs text-orange-200">
                    <input
                      disabled={submitting}
                      type="checkbox"
                      checked={a.completed}
                      onChange={(e) =>
                        handleAchievementChange(
                          i,
                          "completed",
                          e.target.checked
                        )
                      }
                    />{" "}
                    Completed
                  </label>
                  <button
                    onClick={() => removeAchievement(i)}
                    className="text-red-400 text-xs p-2"
                    disabled={submitting}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
              <button
                disabled={submitting}
                onClick={addAchievement}
                className="text-orange-400 mt-2"
              >
                + Add Achievement
              </button>

              <p className="text-orange-300 text-xs font-bold mt-4 mb-1">
                Debriefing Score
              </p>

              <input
                disabled={submitting}
                className="w-full p-1 bg-neutral-900 border border-orange-400 rounded mb-1"
                placeholder="Final Score"
                value={missionData.Debrief?.Score?.FinalScore || ""}
                onChange={(e) =>
                  setMissionData((prev) => ({
                    ...prev,
                    Debrief: {
                      ...prev.Debrief,
                      Score: {
                        ...prev.Debrief?.Score,
                        FinalScore: e.target.value,
                      },
                    },
                  }))
                }
              />

              <input
                disabled={submitting}
                className="w-full p-1 bg-neutral-900 border border-orange-400 rounded mb-1"
                placeholder="EXP"
                value={missionData.Debrief?.Score?.EXP || ""}
                onChange={(e) =>
                  setMissionData((prev) => ({
                    ...prev,
                    Debrief: {
                      ...prev.Debrief,
                      Score: {
                        ...prev.Debrief?.Score,
                        EXP: e.target.value,
                      },
                    },
                  }))
                }
              />

              <input
                disabled={submitting}
                className="w-full p-1 bg-neutral-900 border border-orange-400 rounded"
                placeholder="Rank"
                value={missionData.Debrief?.Score?.Rank || ""}
                onChange={(e) =>
                  setMissionData((prev) => ({
                    ...prev,
                    Debrief: {
                      ...prev.Debrief,
                      Score: {
                        ...prev.Debrief?.Score,
                        Rank: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          )}

          <button
            disabled={submitting}
            onClick={saveMission}
            className={`mt-4 w-full py-2 rounded font-bold ${
              submitting
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {submitting && (
              <svg
                className="animate-spin h-4 w-4 inline-block mr-2 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <div className="min-w-sm">
          <h2 className="uppercase text-lg font-bold text-neutral-200 bg-orange-500 p-2">
            [{missionData.Name}]
          </h2>
          <h2 className="text-sm text-neutral-400">{missionData.Type}</h2>
          <h3 className="text-sm text-neutral-400 mb-4">{missionData.location} |{missionData.lat},{missionData.lon}</h3>

          <p className="text-orange-300 text-xs font-bold mb-1">
            Key Objectives
          </p>
          <ul className="text-sm mb-3">
            {Object.values(missionData.Objectives || {}).map((obj, i) => (
              <li key={i}>- {obj}</li>
            ))}
          </ul>

          {"Brief,Execution,FA,Support,CnC".split(",").map((field) => (
            <div key={field} className="mb-3">
              <p className="text-orange-300 text-xs font-bold mb-1">
                {field === "FA"
                  ? "Force Assessment"
                  : field === "CnC"
                  ? "Command and Control"
                  : field}
              </p>
              <p className="text-sm whitespace-pre-line">
                {missionData[field] || ""}
              </p>
            </div>
          ))}

          {missionData.status === "COMPLETED" && (
            <div className="mt-4">
              <p className="text-orange-300 text-sm font-bold mb-1">Debrief</p>
              <p className="text-sm whitespace-pre-line mb-2">
                {missionData.Debrief?.Debriefing || "No debriefing available."}
              </p>
              <p className="text-orange-300 text-xs font-bold mb-1">
                Achievements
              </p>
              <ul className="text-sm">
                {(missionData.Debrief?.Score?.Achievements || []).map(
                  (a, i) => (
                    <li key={i} className="mb-2">
                      [{a.completed ? "✔" : "X"}] <strong>{a.name}</strong>
                      <br />
                      {a.description}
                      {a.unlocks && (
                        <>
                          <br />
                          Unlocks: {a.unlocks}
                        </>
                      )}
                    </li>
                  )
                )}
              </ul>
              <p className="text-sm mt-2">
                Final Score: {missionData.Debrief?.Score?.FinalScore || "N/A"}
              </p>
              <p className="text-sm">
                EXP: {missionData.Debrief?.Score?.EXP || "N/A"}
              </p>
              <p className="text-sm">
                Rank: {missionData.Debrief?.Score?.Rank || "N/A"}
              </p>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 w-full bg-orange-500 py-2 rounded font-bold hover:bg-orange-600"
            >
              Edit Mission
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteMission}
              className="mt-2 w-full py-2 bg-orange-500 text-white font-bold rounded hover:bg-red-700"
              disabled={submitting}
            >
              Abort Mission
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MissionView;
