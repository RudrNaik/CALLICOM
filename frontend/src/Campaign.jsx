import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import background from "./assets/Images/4060492.jpg";
import { useNavigate } from "react-router-dom";
import campaignsData from "./data/campaigns.json";
import missionsData from "./data/missions.json";
import Roster from "./components/Briefings/CharRoster";
import MissionView from "./components/Briefings/MissionView";
import CampaignView from "./components/Briefings/CampaignView";
import "./assets/css/terminal.css";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState("Chile2018");
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login.");
      return;
    }

    setIsLoading(true);

    fetch("https://callicom.onrender.com/api/characters", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (char) => char.campaignId === currentCampaignId
        );
        setCharacters(filtered);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching characters:", err);
        setIsLoading(false);
      });
  }, [currentCampaignId]);

  const currentCampaign = campaigns.find((c) => c.id === currentCampaignId);
  const currentMission = missions.find((m) => m.id === currentMissionId);

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white scanlines crt-overlay"
      style={{
        backgroundImage: `url(${background})`,
        fontFamily: "Geist_Mono",
      }}
    >
      <div className="">
        <div className="py-20 px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flicker"
            >
              {/* Campaign Overview */}
              <CampaignView
                currentCampaign={currentCampaign}
                currentCampaignId={currentCampaignId}
                setCurrentCampaignId={setCurrentCampaignId}
                setCurrentMissionId={setCurrentMissionId}
                campaigns={campaigns}
                filteredMissions={filteredMissions}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flicker"
            >
              {/* mission View */}
              <MissionView currentMission={currentMission} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flicker"
            >
              {/* Operator Roster */}
              <Roster characters={characters} isLoading={isLoading} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;
