import React, { useEffect, useState } from "react";

function CampaignView({
  currentCampaign,
  currentCampaignId,
  setCurrentCampaignId,
  setCurrentMissionId,
  currentMissionId,
  filteredMissions,
  campaigns,
  refreshCampaigns,
  isAdmin,
  handleAddMission,
  isCreatingMission,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // ADD: isolated state
  const [newCampaign, setNewCampaign] = useState({
    Name: "",
    id: "",
    Location: "",
    SITREP: "",
    callsign: "",
    client: "",
    payout: "",
    unit: "",
  });

  // EDIT: isolated state
  const [editCampaign, setEditCampaign] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close forms when switching campaigns
  useEffect(() => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditCampaign(null);
  }, [currentCampaignId]);

  const openAdd = () => {
    setNewCampaign({
      Name: "",
      id: "",
      Location: "",
      SITREP: "",
      callsign: "",
      client: "",
      payout: "",
      unit: "",
    });
    setShowEditForm(false);
    setShowAddForm(true);
  };

  const seedEditFromCurrent = () => {
    if (!currentCampaign) return;
    setEditCampaign({
      Name: currentCampaign.Name || "",
      id: currentCampaign.id || "",
      Location: currentCampaign.Location || "",
      SITREP: currentCampaign.SITREP || "",
      unit: currentCampaign.unit || "",
      callsign: currentCampaign.callsign || "",
      client: currentCampaign.client || "",
      payout: currentCampaign.payout || "",
    });
  };

  const openEdit = () => {
    seedEditFromCurrent();
    setShowAddForm(false);
    setShowEditForm(true);
  };

  // ---- Add handlers
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewCampaign((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!newCampaign.id?.trim()) {
      alert("Campaign ID is required.");
      return;
    }
    if (campaigns.some((c) => c.id === newCampaign.id)) {
      alert("A campaign with this ID already exists. Please choose a unique ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://callicom.onrender.com/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCampaign),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      await res.json();
      await refreshCampaigns();
      setShowAddForm(false);
      setCurrentCampaignId(newCampaign.id); // jump to the new one (optional)
    } catch (err) {
      console.error("Error posting campaign data:", err);
      alert("Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Edit handlers
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditCampaign((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!editCampaign || !currentCampaign) return;

    // Route uses the human string id per Option A
    const routeId = currentCampaign.id;

    // Never try to change identifiers in the body
    const { _id, id, ...update } = editCampaign;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://callicom.onrender.com/api/campaigns/${routeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update campaign");
      await res.json();
      await refreshCampaigns();
      setShowEditForm(false);
      setEditCampaign(null);
      // keep selection on same campaign id
    } catch (err) {
      console.error("Error updating campaign:", err);
      alert("Failed to update campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {currentCampaign && (
        <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg min-w-sm sm:max-w-full md:max-w-md min-h-[700px] max-h-[700px] overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
          {/* Campaign Selector */}
          <div className="relative">
            <div className="bg-orange-500 p-2 rounded text-neutral-900 font-bold">
              <select
                value={currentCampaignId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__add") return openAdd();
                  if (v === "__edit") return openEdit();
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setCurrentCampaignId(v);
                }}
                className="bg-transparent text-neutral-100 font-bold text-xl uppercase w-full appearance-none"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id} className="text-white bg-orange-500">
                    {campaign.Name}
                  </option>
                ))}
                {isAdmin && (
                  <option value="__add" className="text-white bg-orange-600">
                    [ + ] Add New Campaign
                  </option>
                )}
                {isAdmin && (
                  <option value="__edit" className="text-white bg-orange-600">
                    [ ^ ] Edit Current Campaign
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Add Campaign Form */}
          {showAddForm && isAdmin && (
            <div className="mt-4 text-sm space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <input name="Name" placeholder="Campaign Name" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.Name} onChange={handleAddInputChange} />
                <input name="id" placeholder="Unique ID (e.g., Chile2018)" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.id} onChange={handleAddInputChange} />
                <input name="Location" placeholder="Location" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.Location} onChange={handleAddInputChange} />
                <textarea name="SITREP" placeholder="SITREP / Overview" rows={3} className="w-full p-2 bg-neutral-900 border border-orange-500 rounded resize-none" value={newCampaign.SITREP} onChange={handleAddInputChange} />
                <input name="unit" placeholder="Unit (e.g., Calamari Operational Group)" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.unit} onChange={handleAddInputChange} />
                <input name="callsign" placeholder="Callsign" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.callsign} onChange={handleAddInputChange} />
                <input name="client" placeholder="Client(s)" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.client} onChange={handleAddInputChange} />
                <input name="payout" placeholder="Payout" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={newCampaign.payout} onChange={handleAddInputChange} />
              </div>
              <div className="flex justify-between gap-2 mt-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 border border-orange-400 text-orange-400 font-semibold py-2 rounded hover:bg-orange-600/10">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 bg-orange-500 text-black font-bold py-2 rounded hover:bg-orange-600 transition disabled:opacity-60">
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* Edit Campaign Form */}
          {showEditForm && isAdmin && editCampaign && (
            <div className="mt-4 text-sm space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <input name="Name" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.Name} onChange={handleEditInputChange} />
                <input name="id" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded opacity-60 cursor-not-allowed" value={editCampaign.id} readOnly />
                <input name="Location" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.Location} onChange={handleEditInputChange} />
                <textarea name="SITREP" rows={3} className="w-full p-2 bg-neutral-900 border border-orange-500 rounded resize-none" value={editCampaign.SITREP} onChange={handleEditInputChange} />
                <input name="unit" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.unit} onChange={handleEditInputChange} />
                <input name="callsign" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.callsign} onChange={handleEditInputChange} />
                <input name="client" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.client} onChange={handleEditInputChange} />
                <input name="payout" className="w-full p-2 bg-neutral-900 border border-orange-500 rounded" value={editCampaign.payout} onChange={handleEditInputChange} />
              </div>
              <div className="flex justify-between gap-2 mt-2">
                <button onClick={() => { setShowEditForm(false); setEditCampaign(null); }} className="flex-1 border border-orange-400 text-orange-400 font-semibold py-2 rounded hover:bg-orange-600/10">
                  Cancel
                </button>
                <button onClick={handleUpdate} disabled={isSubmitting} className="flex-1 bg-orange-500 text-black font-bold py-2 rounded hover:bg-orange-600 transition disabled:opacity-60">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Campaign Details */}
          <h2 className="uppercase text-sm text-neutral-400 mb-4 mt-4">
            {currentCampaign.Location}
          </h2>

          <p className="text-orange-300 text-xs font-bold mb-1">SITREP</p>
          <p className="text-xs whitespace-pre-line">{currentCampaign.SITREP}</p>

          <hr className="my-4 border-gray-600" />
          <p className="text-orange-300 text-xs font-bold mb-1">Operations List</p>

          <div className="space-y-2">
            {filteredMissions.map((mission, i) => {
              const isActive = mission.status?.toLowerCase() === "active";
              const isUpcoming = mission.status?.toLowerCase() === "upcoming";

              return (
                <div
                  key={mission.id}
                  onClick={() => setCurrentMissionId(mission.id)}
                  className={`relative cursor-pointer p-4 border border-l-8 rounded flex justify-between items-center group transition-all duration-200
                    ${isActive ? "bg-orange-900/30 border-orange-400" : "bg-neutral-800 border-neutral-700 hover:border-orange-600"}
                    ${isUpcoming ? "bg-neutral-800/30 border-orange-500" : ""}
                    ${currentMissionId === mission.id ? "border-orange-600" : ""}`}
                >
                  <div>
                    <p className="text-xs text-gray-400 tracking-widest uppercase">
                      MISSION // {String(filteredMissions.length - i).padStart(3, "0")}
                    </p>
                    <h3 className="text-lg font-bold text-white tracking-wide">{mission.Name}</h3>
                    <p className="text-sm text-gray-400">
                      {mission.status || "Unknown"}{mission.who ? `, ${mission.who}` : ""}
                    </p>
                  </div>
                  <div className={`relative px-4 py-2 text-xs font-semibold tracking-wide uppercase skew-x-[-20deg] ${isActive ? "bg-orange-500 text-white" : "bg-neutral-600 text-white"}`}>
                    <div className="skew-x-[20deg] flex items-center gap-2">
                      <span>{isActive ? "ACTIVE" : "View Briefing"}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 2l9 4v12l-9 4-9-4V6l9-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <button
              onClick={handleAddMission}
              disabled={isCreatingMission}
              className={`mt-2 w-full flex justify-center items-center gap-2 py-2 rounded font-bold transition ${
                isCreatingMission ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isCreatingMission && (
                <svg className="animate-spin h-4 w-4 text-neutral-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {isCreatingMission ? "Creating..." : "Add New Mission"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignView;
