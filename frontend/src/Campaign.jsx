import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import background from "./assets/Images/4060492.jpg";
import { useNavigate } from "react-router-dom";
import campaignsData from "./data/campaigns.json";
import missionsData from "./data/missions.json";
import Roster from "./components/Briefings/CharRoster";
import Footer from "./components/Footer";
import MissionView from "./components/Briefings/MissionView";
import CampaignView from "./components/Briefings/CampaignView";
import TopDeploymentBanner from "./components/Briefings/TopDeploymentBanner";
import "./assets/css/terminal.css";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState("Chile2018");
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCampaigns(campaignsData);
    setMissions(missionsData);
  }, []);

  useEffect(() => {
    const campaignMissions = missions
      .filter((m) => m.campaignId === currentCampaignId)
      .sort((a, b) => {
        // Assuming mission IDs are like "Mission1", "Mission6", etc.
        const numA = parseInt(a.id.replace(/\D/g, ""));
        const numB = parseInt(b.id.replace(/\D/g, ""));
        return numB - numA; // Descending order
      });

    setFilteredMissions(campaignMissions);

    const current = campaignMissions.find((m) => m.status === "CURRENT");
    const fallback = campaignMissions[0];

    setCurrentMissionId(current?.id || fallback?.id || null);
  }, [currentCampaignId, missions]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
    }

    setIsLoading(true);

    fetch("https://callicom.onrender.com/api/characters", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 403) {
          console.warn("Access denied, redirecting to login.");
          navigate("/login");
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

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
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white crt-overlay"
      style={{
        backgroundImage: `url(${background})`,
        fontFamily: "Geist_Mono",
      }}
    >
      <div className="">
        <div className="py-20 px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0 }}
            className="flicker"
          >
            <TopDeploymentBanner
              unit={
                currentCampaign?.unit || "CALAMARI OPERATIONAL SUPPORT GROUP"
              }
              callsign={currentCampaign?.callsign || "UNASSIGNED"}
              client={currentCampaign?.client || "Unknown"}
              payout={currentCampaign?.payout || "???"}
            ></TopDeploymentBanner>
          </motion.div>
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
                currentMissionId={currentMissionId}
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
        <Footer></Footer>
      </div>
    </div>
  );
}

export default Campaigns;
