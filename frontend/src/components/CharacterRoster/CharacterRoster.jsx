import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function CharacterRoster({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    triggerRefresh();
  }, []);

  useEffect(() => {
    setIsLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    fetch(`https://callicom.onrender.com/api/characters/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const text = await res.text();

        if (res.status === 401 || res.status === 403) {
          if (
            text.toLowerCase().includes("token expired") ||
            text.toLowerCase().includes("jwt expired") ||
            text.toLowerCase().includes("tokenexpirederror")
          ) {
            console.warn("Token expired. Redirecting to login.");
          } else {
            console.warn("Access denied. Redirecting to login.");
          }

          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Invalid JSON response:", text);
          setIsLoading(false);
          return;
        }

        if (!Array.isArray(data)) {
          console.error("Unexpected data format:", data);
          setIsLoading(false);
          return;
        }

        setCharacters(data);

        if (selectedCharacter) {
          const updated = data.find(
            (char) => char._id === selectedCharacter._id
          );
          if (updated) setSelectedCharacter(updated);
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching characters:", err);
        setIsLoading(false);
      });

    fetch(`http://callicom.onrender.com/api/campaignEquipment`, { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const text = await res.text();

        if (res.status === 401 || res.status === 403) {
          if (
            text.toLowerCase().includes("token expired") ||
            text.toLowerCase().includes("jwt expired") ||
            text.toLowerCase().includes("tokenexpirederror")
          ) {
            console.warn("Token expired. Redirecting to login.");
          } else {
            console.warn("Access denied. Redirecting to login.");
          }

          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Invalid JSON response:", text);
          setIsLoading(false);
          return;
        }

        if (!Array.isArray(data)) {
          console.error("Unexpected data format:", data);
          setIsLoading(false);
          return;
        }

        setEquipment(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching gear:", err);
        setIsLoading(false);
      });
    
  }, [userId, refreshFlag]);

  const triggerRefresh = () => setRefreshFlag((prev) => !prev);

  const handleDeleteCharacter = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${userId}/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      setCharacters((prev) => prev.filter((char) => char._id !== id));
      setSelectedCharacter(false);
      triggerRefresh();
    } else {
      alert("Failed to delete character.");
    }
  };

  return (
    <div
      className="sm:max-w-full md:max-w-10/12 mx-auto p-6 space-y-1  text-white border-l-6 border-orange-500 bg-neutral-800/30"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-2xl font-bold text-orange-400">Your Characters</h1>
      {/* Saving Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="flicker"
      >
        {isLoading ? (
          <div className="flex items-center text-orange-400 font-bold py-2">
            <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
            Fetching Operators...
          </div>
        ) : (
          <div className="text-gray-400 mb-2 text-xs">
            {" "}
            Operators Updated. {equipment.length}x equipment ready.
          </div>
        )}
      </motion.div>

      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
        {characters.map((char) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="flicker"
          >
            <CharacterCard
              key={char._id}
              character={char}
              onSelect={setSelectedCharacter}
              onDelete={handleDeleteCharacter}
            />
          </motion.div>
        ))}
      </div>
      <div>
        {selectedCharacter && (
          <div>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-100">
                Detailed View
              </span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>
            <div className="mt-8">
              <motion.div
                key={selectedCharacter?._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="flicker"
              >
                <CharacterDetail
                  character={selectedCharacter}
                  user={userId}
                  onUpdate={triggerRefresh}
                  equipment = {equipment}
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterRoster;
