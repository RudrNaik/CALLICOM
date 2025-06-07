import React from "react";

function CampaignView({
  currentCampaign,
  currentCampaignId,
  setCurrentCampaignId,
  setCurrentMissionId,
  currentMissionId,
  filteredMissions,
  campaigns,
}) {
  return (
    <div>
      {/* Campaign Overview */}
      {currentCampaign && (
        <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md min-h-[700px] max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
          <div className="bg-orange-500 p-2 rounded text-neutral-900 font-bold">
            <select
              value={currentCampaignId}
              onChange={(e) => setCurrentCampaignId(e.target.value)}
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
            </select>
          </div>

          <h2 className="uppercase text-sm text-neutral-400 mb-4 mt-2">
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
                  }
                  ${
                    currentMissionId === mission.id ? "border-orange-600" : ""
                  }`}
                >
                  {/* Left Side */}
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

                  {/* Right Tab */}
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
        </div>
      )}
    </div>
  );
}

export default CampaignView;
