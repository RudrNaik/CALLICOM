import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import background from "./assets/Images/4060492.jpg";
import { useNavigate } from "react-router-dom";
import Roster from "./components/Briefings/CharRoster";
import Footer from "./components/Footer";
import MissionView from "./components/Briefings/MissionView";
import CampaignView from "./components/Briefings/CampaignView";
import TopDeploymentBanner from "./components/Briefings/TopDeploymentBanner";
import "./assets/css/terminal.css";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState("Chile2018");
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);

  //console.log(isAdmin);

  const loadingCampaignData = campaigns.length === 0 || missions.length === 0;
  const isInitialLoading = loadingCampaignData || isLoading;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      return;
    }

    const fetchCampaigns = fetch(
      "https://callicom.onrender.com/api/campaigns",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    ).then((res) => res.json());

    const fetchMissions = fetch("https://callicom.onrender.com/api/missions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());

    Promise.all([fetchCampaigns, fetchMissions])
      .then(([campaignsData, missionsData]) => {
        setCampaigns(campaignsData);
        setMissions(missionsData);
      })
      .catch((err) => {
        console.error("Error fetching campaign/mission data:", err);
        navigate("/login");
      });
  }, []);

  useEffect(() => {
    const campaignMissions = missions
      .filter((m) => m.campaignId?.id === currentCampaignId)
      .sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ""));
        const numB = parseInt(b.id.replace(/\D/g, ""));
        return numB - numA;
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

  const refreshCampaigns = () => {
    const token = localStorage.getItem("token");
    fetch("https://callicom.onrender.com/api/campaigns", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setCampaigns)
      .catch((err) => console.error("Error refreshing campaigns:", err));
  };

  const refreshMissions = () => {
    const token = localStorage.getItem("token");

    fetch("https://callicom.onrender.com/api/missions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setMissions)
      .catch((err) => console.error("Failed to refresh missions:", err));
  };

  console.log(currentCampaignId);
  console.log(missions);
  console.log(filteredMissions);

  // 🔄 Fullscreen Spinner Overlay
  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-solid mb-4"></div>
        <p className="text-white text-sm font-mono tracking-wide">
          Initializing briefing environment...
        </p>
        <p className="text-xs py-2 font-mono text-neutral-400/80">
          //[⚠]:: Please be patient as occasionally the environment will require
          the backend to spool up. Usually this takes 20-30 seconds.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white crt-overlay"
      style={{
        backgroundImage: `url(${background})`,
        fontFamily: "Geist_Mono",
      }}
    >
      <div className="py-20 px-10">
        {/* TOP BANNER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0 }}
          className="flicker"
        >
          <TopDeploymentBanner
            unit={currentCampaign?.unit || "CALAMARI OPERATIONAL SUPPORT GROUP"}
            callsign={currentCampaign?.callsign || "UNASSIGNED"}
            client={currentCampaign?.client || "Unknown"}
            payout={currentCampaign?.payout || "???"}
          />
        </motion.div>

        {/* THREE COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* CAMPAIGN VIEW */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flicker"
          >
            <CampaignView
              currentCampaign={currentCampaign}
              currentCampaignId={currentCampaignId}
              setCurrentCampaignId={setCurrentCampaignId}
              setCurrentMissionId={setCurrentMissionId}
              currentMissionId={currentMissionId}
              campaigns={campaigns}
              filteredMissions={filteredMissions}
              refreshCampaigns={refreshCampaigns}
              isAdmin={isAdmin}
            />
          </motion.div>

          {/* MISSION VIEW */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flicker"
          >
            <MissionView
              currentMission={currentMission}
              isAdmin={isAdmin}
              refreshMissions={refreshMissions}
              currentCampaignId={currentCampaign}
            />
          </motion.div>

          {/* CHARACTER ROSTER */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flicker"
          >
            <Roster characters={characters} isLoading={isLoading} />
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Campaigns;
