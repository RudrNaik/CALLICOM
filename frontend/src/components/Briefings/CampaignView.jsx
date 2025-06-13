import React, { useState } from "react";

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
  const [newCampaign, setNewCampaign] = useState({
    Name: "",
    id: "",
    Location: "",
    SITREP: "",
    callsign: "",
    client: "",
    payout: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCampaign((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (campaigns.some((c) => c.id === newCampaign.id)) {
      alert(
        "A campaign with this ID already exists. Please choose a unique ID."
      );
      setIsSubmitting(false);
      return;
    }

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
      refreshCampaigns();
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
      setShowAddForm(false);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error posting campaign data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {currentCampaign && (
        <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md min-h-[700px] max-h-[700px] overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
          {/* Campaign Selector */}
          <div className="relative">
            <div className="bg-orange-500 p-2 rounded text-neutral-900 font-bold">
              <select
                value={currentCampaignId}
                onChange={(e) => {
                  if (e.target.value === "__add") {
                    setShowAddForm(true);
                    return;
                  }
                  setCurrentCampaignId(e.target.value);
                }}
                className="bg-transparent text-neutral-100 font-bold text-xl uppercase w-full appearance-none"
              >
                {campaigns.map((campaign) => (
                  <option
                    key={campaign.id}
                    value={campaign.id}
                    className="text-white bg-orange-500"
                  >
                    {campaign.Name}
                  </option>
                ))}
                {isAdmin && (
                  <option value="__add" className="text-white bg-orange-600">
                    [ + ] Add New Campaign
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Add Campaign Form */}
          {showAddForm && isAdmin && (
            <div className="mt-4 text-sm space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <input
                  name="Name"
                  placeholder="Campaign Name"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.Name}
                  onChange={handleInputChange}
                />
                <input
                  name="id"
                  placeholder="Unique ID (e.g., Chile2018)"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.id}
                  onChange={handleInputChange}
                />
                <input
                  name="Location"
                  placeholder="Location"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.Location}
                  onChange={handleInputChange}
                />
                <textarea
                  name="SITREP"
                  placeholder="SITREP / Overview"
                  rows={3}
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded resize-none"
                  value={newCampaign.SITREP}
                  onChange={handleInputChange}
                />
                <input
                  name="unit"
                  placeholder="Unit (e.g., Calamari Operational Group)"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.unit || ""}
                  onChange={handleInputChange}
                />
                <input
                  name="callsign"
                  placeholder="Callsign"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.callsign}
                  onChange={handleInputChange}
                />
                <input
                  name="client"
                  placeholder="Client(s)"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.client}
                  onChange={handleInputChange}
                />
                <input
                  name="payout"
                  placeholder="Payout"
                  className="w-full p-2 bg-neutral-900 border border-orange-500 rounded"
                  value={newCampaign.payout}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-between gap-2 mt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border border-orange-400 text-orange-400 font-semibold py-2 rounded hover:bg-orange-600/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 text-black font-bold py-2 rounded hover:bg-orange-600 transition"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* Campaign Details */}
          <h2 className="uppercase text-sm text-neutral-400 mb-4 mt-4">
            {currentCampaign.Location}
          </h2>

          <p className="text-orange-300 text-xs font-bold mb-1">SITREP</p>
          <p className="text-xs whitespace-pre-line">
            {currentCampaign.SITREP}
          </p>

          <hr className="my-4 border-gray-600" />
          <p className="text-orange-300 text-xs font-bold mb-1">
            Operations List
          </p>
          <div className="space-y-2">
            {filteredMissions.map((mission, i) => {
              const isActive = mission.status?.toLowerCase() === "active";

              return (
                <div
                  key={mission.id}
                  onClick={() => setCurrentMissionId(mission.id)}
                  className={`relative cursor-pointer p-4 border border-l-8 rounded flex justify-between items-center group transition-all duration-200 ${
                    isActive
                      ? "bg-orange-900/30 border-orange-400"
                      : "bg-neutral-800 border-neutral-700 hover:border-orange-600"
                  } ${
                    currentMissionId === mission.id ? "border-orange-600" : ""
                  }`}
                >
                  <div>
                    <p className="text-xs text-gray-400 tracking-widest uppercase">
                      MISSION //{" "}
                      {String(filteredMissions.length - i).padStart(3, "0")}
                    </p>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {mission.Name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {mission.status || "Unknown"}
                      {mission.who ? `, ${mission.who}` : ""}
                    </p>
                  </div>
                  <div
                    className={`relative px-4 py-2 text-xs font-semibold tracking-wide uppercase skew-x-[-20deg] ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "bg-neutral-600 text-white"
                    }`}
                  >
                    <div className="skew-x-[20deg] flex items-center gap-2">
                      <span>{isActive ? "ACTIVE" : "View Briefing"}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                isCreatingMission
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isCreatingMission && (
                <svg
                  className="animate-spin h-4 w-4 text-neutral-50"
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
              {isCreatingMission ? "Creating..." : "Add New Mission"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignView;
