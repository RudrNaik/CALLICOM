import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CACHE_KEY_CHARS = (userId) => `roster_characters_${userId}`;
const CACHE_KEY_EQUIP = `roster_equipment`;
const CACHE_TTL_MS = 20 * 1000; // 5 minutes — adjust as needed

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function bustCache(userId) {
  try {
    localStorage.removeItem(CACHE_KEY_CHARS(userId));
    localStorage.removeItem(CACHE_KEY_EQUIP);
  } catch {}
}

async function fetchJSON(url, token, navigate) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();

  if (res.status === 401 || res.status === 403) {
    const msg = text.toLowerCase();
    if (
      msg.includes("token expired") ||
      msg.includes("jwt expired") ||
      msg.includes("tokenexpirederror")
    ) {
      console.warn("Token expired. Redirecting to login.");
    } else {
      console.warn("Access denied. Redirecting to login.");
    }
    localStorage.removeItem("token");
    navigate("/login");
    return null; // signal caller to bail
  }

  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      console.error("Unexpected data format:", data);
      return null;
    }
    return data;
  } catch {
    console.error("Invalid JSON response:", text);
    return null;
  }
}

function CharacterRoster({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const navigate = useNavigate();

  const revalidate = () => setRefreshFlag((prev) => !prev);

  const triggerRefresh = () => {
    bustCache(userId);
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    revalidate();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // --- Serve cache immediately (stale-while-revalidate) ---
    const cachedChars = readCache(CACHE_KEY_CHARS(userId));
    const cachedEquip = readCache(CACHE_KEY_EQUIP);

    if (cachedChars) {
      setCharacters(cachedChars);
      if (selectedCharacter) {
        const updated = cachedChars.find(
          (c) => c._id === selectedCharacter._id,
        );
        if (updated) setSelectedCharacter(updated);
      }
    }
    if (cachedEquip) setEquipment(cachedEquip);

    // If both caches hit, don't show the spinner — revalidate silently
    const hasBothCached = !!cachedChars && !!cachedEquip;
    if (!hasBothCached) setIsLoading(true);

    // --- Revalidate in background with Promise.all ---
    Promise.all([
      fetchJSON(
        `https://callicom.onrender.com/api/characters/${userId}`,
        token,
        navigate,
      ),
      fetchJSON(
        `https://callicom.onrender.com/api/campaignEquipment`,
        token,
        navigate,
      ),
    ]).then(([chars, equip]) => {
      if (chars) {
        setCharacters(chars);
        writeCache(CACHE_KEY_CHARS(userId), chars);
        if (selectedCharacter) {
          const updated = chars.find((c) => c._id === selectedCharacter._id);
          if (updated) setSelectedCharacter(updated);
        }
      }
      if (equip) {
        setEquipment(equip);
        writeCache(CACHE_KEY_EQUIP, equip);
      }
      setIsLoading(false);
    });
  }, [userId, refreshFlag]);

  const handleDeleteCharacter = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
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
      },
    );

    if (res.ok) {
      setCharacters((prev) => prev.filter((char) => char._id !== id));
      setSelectedCharacter(false);
      triggerRefresh(); // busts cache + refetches
    } else {
      alert("Failed to delete character.");
    }
  };

  return (
    <div
      className="scroll-anchor-none sm:max-w-full md:max-w-10/11 mx-auto p-2 lg:p-6 space-y-1 text-white sm:border-0 md:border-l-6 border-orange-500 bg-neutral-800/30"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-2xl font-bold text-orange-400">Your Characters</h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="flicker"
      >
        {isLoading ? (
          <div className="flex items-center text-orange-400 font-bold py-2">
            <svg
              className="animate-spin h-4 w-4 inline-block text-orange-500 mr-2"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Fetching Operators...
          </div>
        ) : (
          <div className="text-gray-400 mb-2 text-xs">
            Operators Updated. {equipment.length}x equipment ready.
          </div>
        )}
      </motion.div>

      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
        {characters.map((char) => (
          <motion.div
            key={char._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="flicker"
          >
            <CharacterCard
              character={char}
              onSelect={setSelectedCharacter}
              onDelete={handleDeleteCharacter}
            />
          </motion.div>
        ))}
      </div>

      <div>
        {selectedCharacter ? (
          <div>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="flex-shrink mx-4 text-gray-100">
                Detailed View
              </span>
              <div className="flex-grow border-t border-gray-100" />
            </div>
            <div className="min-h[30rem]">
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
                  equipment={equipment}
                />
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            key={selectedCharacter?._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="flicker"
          >
            <div className="relative min-h-[30rem] bg-neutral-900/10 bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)][background-size:8px_8px] p-4 shadow overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-4 py-2 bg-neutral-900 border-l-4 border-orange-500 font-semibold text-center shadow-sm">
                  [CALLI.OS ::/] No Character Selected
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default CharacterRoster;
