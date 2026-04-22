import { useEffect, useState, useRef } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Cache Helpers ────────────────────────────────────────────────────────────

const CACHE_KEY_CHARS = (userId) => `roster_characters_${userId}`;
const CACHE_KEY_EQUIP = `roster_equipment`;
const COLD_START_THRESHOLD_MS = 3000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — adjust as needed

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
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

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

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
    console.warn(
      msg.includes("token expired") || msg.includes("jwt expired")
        ? "Token expired. Redirecting to login."
        : "Access denied. Redirecting to login."
    );
    localStorage.removeItem("token");
    navigate("/login");
    return null;
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

// ─── Banner Components ────────────────────────────────────────────────────────

function ColdStartBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border-l-4 border-yellow-500 text-sm text-yellow-300"
    >
      <svg
        className="animate-spin h-3 w-3 text-yellow-400 shrink-0"
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
      <span>⚠ Backend is waking up — saves may be delayed. Please wait.</span>
    </motion.div>
  );
}

function MismatchBanner({ onApply }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-l-4 border-orange-500 text-sm text-orange-300"
    >
      <span>⚠ Operator data has changed since last sync.</span>
      <button
        onClick={onApply}
        className="ml-4 px-3 py-1 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs transition-colors"
      >
        UPDATE
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CharacterRoster({ userId }) {
  const [characters, setCharacters]               = useState([]);
  const [equipment, setEquipment]                 = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [isLoading, setIsLoading]                 = useState(false);
  const [refreshFlag, setRefreshFlag]             = useState(false);

  const [pendingChars, setPendingChars]           = useState(null);
  const [pendingEquip, setPendingEquip]           = useState(null);
  const [hasMismatch, setHasMismatch]             = useState(false);

  const [backendSleeping, setBackendSleeping]     = useState(false);
  const sleepTimerRef                             = useRef(null);

  const navigate = useNavigate();

  const triggerRefresh = () => {
    bustCache(userId);
    setRefreshFlag((prev) => !prev);
  };

  const applyPendingUpdate = () => {
    if (pendingChars) {
      setCharacters(pendingChars);
      writeCache(CACHE_KEY_CHARS(userId), pendingChars);
      if (selectedCharacter) {
        const updated = pendingChars.find((c) => c._id === selectedCharacter._id);
        if (updated) setSelectedCharacter(updated);
      }
    }
    if (pendingEquip) {
      setEquipment(pendingEquip);
      writeCache(CACHE_KEY_EQUIP, pendingEquip);
    }
    setPendingChars(null);
    setPendingEquip(null);
    setHasMismatch(false);
  };

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => clearTimeout(sleepTimerRef.current);
  }, []);

  // Main data fetch
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const cachedChars = readCache(CACHE_KEY_CHARS(userId));
    const cachedEquip = readCache(CACHE_KEY_EQUIP);

    if (cachedChars) setCharacters(cachedChars);
    if (cachedEquip) setEquipment(cachedEquip);

    if (!cachedChars || !cachedEquip) setIsLoading(true);

    sleepTimerRef.current = setTimeout(() => {
      setBackendSleeping(true);
    }, COLD_START_THRESHOLD_MS);

    Promise.all([
      fetchJSON(`https://callicom.onrender.com/api/characters/${userId}`, token, navigate),
      fetchJSON(`https://callicom.onrender.com/api/campaignEquipment`, token, navigate),
    ]).then(([chars, equip]) => {
      clearTimeout(sleepTimerRef.current);
      setBackendSleeping(false);
      setIsLoading(false);

      const charsMismatch = chars && JSON.stringify(chars) !== JSON.stringify(cachedChars);
      const equipMismatch = equip && JSON.stringify(equip) !== JSON.stringify(cachedEquip);

      if (charsMismatch || equipMismatch) {
        if (charsMismatch) setPendingChars(chars);
        if (equipMismatch) setPendingEquip(equip);
        setHasMismatch(true);
      } else {
        if (chars) writeCache(CACHE_KEY_CHARS(userId), chars);
        if (equip) writeCache(CACHE_KEY_EQUIP, equip);
      }

      // No cache at all — apply directly without prompting
      if (!cachedChars && chars) {
        setCharacters(chars);
        writeCache(CACHE_KEY_CHARS(userId), chars);
      }
      if (!cachedEquip && equip) {
        setEquipment(equip);
        writeCache(CACHE_KEY_EQUIP, equip);
      }
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
      className="scroll-anchor-none sm:max-w-full md:max-w-10/11 mx-auto p-2 lg:p-6 space-y-1 text-white sm:border-0 md:border-l-6 border-orange-500 bg-neutral-800/30"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-2xl font-bold text-orange-400">Your Characters</h1>

      {/* Status banners */}
      <div className="space-y-1">
        <AnimatePresence>
          {backendSleeping && <ColdStartBanner key="cold-start" />}
        </AnimatePresence>
        <AnimatePresence>
          {hasMismatch && <MismatchBanner key="mismatch" onApply={applyPendingUpdate} />}
        </AnimatePresence>
      </div>

      {/* Loading / ready status line */}
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Fetching Operators...
          </div>
        ) : (
          <div className="text-gray-400 mb-2 text-xs">
            Operators Updated. {equipment.length}x equipment ready.
          </div>
        )}
      </motion.div>

      {/* Character grid */}
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

      {/* Detail panel */}
      <div>
        {selectedCharacter ? (
          <div>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="flex-shrink mx-4 text-gray-100">Detailed View</span>
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
            key="no-selection"
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