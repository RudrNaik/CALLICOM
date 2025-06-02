import React, { useEffect, useState } from "react";
import background from "./assets/Images/4060492.jpg";
import campaignsData from "./data/campaigns.json";
import missionsData from "./data/missions.json";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState("campaign0");
  const [currentMissionId, setCurrentMissionId] = useState(null);

  useEffect(() => {
    setCampaigns(campaignsData);
    setMissions(missionsData);
  }, []);

  useEffect(() => {
    const campaignMissions = missionsData.filter(
      (m) => m.campaignId === currentCampaignId
    );
    setFilteredMissions(campaignMissions);
    setCurrentMissionId(
      campaignMissions.find((m) => m.status === "CURRENT")?.id ||
        campaignMissions[0]?.id ||
        null
    );
  }, [currentCampaignId]);

  const currentCampaign = campaigns.find((c) => c.id === currentCampaignId);
  const currentMission = missions.find((m) => m.id === currentMissionId);
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white"
      style={{
        backgroundImage: `url(${background})`,
        fontFamily: "Geist_Mono",
      }}
    >
      <div className="py-20 px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Campaign Overview */}
          {currentCampaign && (
            <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md">
              <div className="bg-orange-500 p-2 text-neutral-100 font-bold">
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

          {/* Mission Brief */}
          {currentMission && (
            <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md">
              <h2 className="uppercase text-lg font-bold text-neutral-200 bg-orange-500 p-2">
                [ {currentMission.Name} | {currentMission.status} ]
              </h2>
              <h2 className="text-sm text-neutral-400 mb-4">
                {currentMission.Type}
              </h2>

              <p className="text-orange-300 text-xs font-bold mb-1">
                Key Objectives
              </p>
              <ul className="text-sm mb-3">
                {Object.values(currentMission.Objectives).map((obj, i) => (
                  <li key={i}>- {obj}</li>
                ))}
              </ul>

              {["Brief", "Execution", "FA", "Support", "CnC"].map((field) => (
                <div key={field} className="mb-3">
                  <p className="text-orange-300 text-xs font-bold mb-1">
                    {field === "FA"
                      ? "Force Assessment"
                      : field === "CnC"
                      ? "Command and Control"
                      : field}
                  </p>
                  <p className="text-xs whitespace-pre-line">
                    {currentMission[field]}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Operator Roster */}
          <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md">
            <h2 className="uppercase text-sm text-orange-400 tracking-wider mb-4">
              Operator Roster
            </h2>
            <div className="space-y-4">
              {["Goose", "Charlie", "Penny", "Marie"].map((name) => (
                <div
                  key={name}
                  className="bg-neutral-700 rounded-lg p-4 border border-gray-600 hover:border-orange-400"
                >
                  <p className="text-orange-300 font-semibold text-sm">
                    {name}
                  </p>
                  <p className="text-xs text-gray-300">Click to view loadout</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;
