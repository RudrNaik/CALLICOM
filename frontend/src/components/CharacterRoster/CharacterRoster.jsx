import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";
import {
  isCharacter,
  normalizeCharacterData,
} from "../../engine/characterDataHandler";
import {
  setJsonMemory,
  getJsonMemory,
} from "../../engine/memoryEngine";

const CACHE_KEY_CHARS = (userId) => `roster_characters_${userId}`;
const CACHE_KEY_EQUIP = `roster_equipment`;

/**
 * Takes an input of the character's key, and then returns the parsed JSON value of the key value.
 * @param {*} key a Character's key
 * @returns JSON formatted data for the character.
 */
function readCache(key) {
  try {
    const cached = getJsonMemory(key);
    const value = cached?.data ?? cached ?? null;
    return value ? normalizeCharacterData(value) : null;
  } catch {
    return null;
  }
}

/**
 * Writes data and the timestamp of said data into the cache
 * @param {*} key the key of the character
 * @param {*} data the data of said character
 */
function writeCache(key, data) {
  try {
    setJsonMemory(key, { data: normalizeCharacterData(data), ts: Date.now() });
  } catch {
    // localStorage full or unavailable, silently skip
  }
}

/**
 * The main component that's exported.
 * @param userId the username of the current user.
 */
function CharacterRoster({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const updateCharacter = (updates) => {
    if (!updates) return;

    const nextCharacters = characters.map((char) => {
      const charKey = char._id || char.uniqueId || char.callsign;
      const selectedKey = selectedCharacter?._id || selectedCharacter?.uniqueId || selectedCharacter?.callsign;
      return charKey === selectedKey
        ? normalizeCharacterData({ ...char, ...updates })
        : char;
    });

    writeCache(CACHE_KEY_CHARS(userId), nextCharacters);
    setCharacters(nextCharacters);
    setSelectedCharacter((current) => {
      if (!current) return current;
      return nextCharacters.find(
        (char) => (char._id || char.uniqueId || char.callsign) ===
          (current._id || current.uniqueId || current.callsign),
      ) || current;
    });
  };

  /**
   * UseEffect to fetch all of the data needed. Also gathers cached data from localstorage
   */
  useEffect(() => {
    const cachedChars = readCache(CACHE_KEY_CHARS(userId));
    const cachedEquip = readCache(CACHE_KEY_EQUIP);
    setCharacters(Array.isArray(cachedChars) ? cachedChars.filter(isCharacter) : []);
    setEquipment(Array.isArray(cachedEquip) ? cachedEquip : []);
    setIsLoading(false);
  }, [userId]);

  /**
   * Handles deleting a character via their characterID.
   * @param {*} id
   * @returns nothing if the deletion was a success. Or throws an alert if there was an issue doing so.
   */
  const handleDeleteCharacter = (id) => {
    const nextCharacters = characters.filter((char) => {
      return ![char._id, char.uniqueId, char.callsign].includes(id);
    });

    writeCache(CACHE_KEY_CHARS(userId), nextCharacters);
    setCharacters(nextCharacters);
    setSelectedCharacter((current) => {
      if (!current) return current;
      const currentId = current._id || current.uniqueId || current.callsign;
      return currentId === id ? undefined : current;
    });
  };

  return (
    <div
      className="scroll-anchor-none sm:max-w-full md:max-w-95/100 mx-auto space-y-1 text-white bg-neutral-900/70"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-2xl font-bold text-orange-400 px-2">
        Your Characters
      </h1>

      {/* Loading and status */}
      <div className="flicker">
        {isLoading ? (
          <div className="flex items-center text-orange-400 font-bold py-2 px-2">
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
          <div className="text-gray-400 mb-2 text-xs px-2">
            Operators Updated. {equipment.length}x equipment ready.
          </div>
        )}
      </div>

      {/* Characters */}
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 px-2">
        {characters.map((char) => (
          <div
            key={char._id || char.uniqueId || char.callsign}
            className="flicker"
          >
            <CharacterCard
              character={char}
              onSelect={setSelectedCharacter}
              onDelete={handleDeleteCharacter}
            />
          </div>
        ))}
      </div>

      {/* Selected Character */}
      <div>
        {selectedCharacter ? (
          <div>
            <div className="relative flex py-5 px-2 items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="flex-shrink mx-4 text-gray-100">
                Detailed View
              </span>
              <div className="flex-grow border-t border-gray-100" />
            </div>
            <div className="min-h[30rem]">
              <div
                key={selectedCharacter?._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="flicker"
              >
                <CharacterDetail
                  character={selectedCharacter}
                  user={userId}
                  onUpdate={updateCharacter}
                  equipment={equipment}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
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
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterRoster;
