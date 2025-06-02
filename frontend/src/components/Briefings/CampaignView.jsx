import React from "react";

function CampaignView({
  currentCampaign,
  currentCampaignId,
  setCurrentCampaignId,
  setCurrentMissionId,
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
          <ul className="text-sm space-y-1">
            {filteredMissions.map((mission, i) => (
              <li
                key={mission.id}
                onClick={() => setCurrentMissionId(mission.id)}
                className="cursor-pointer hover:text-orange-300"
              >
                - [{mission.Name}] | {mission.status || "Unknown"}
                {mission.who ? `, ${mission.who}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CampaignView;
