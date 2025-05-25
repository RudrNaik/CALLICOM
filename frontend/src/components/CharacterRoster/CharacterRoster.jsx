import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";

function CharacterRoster({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
      triggerRefresh(); 
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`https://callicom.onrender.com/api/characters/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data);

        if (selectedCharacter) {
          const updated = data.find(
            (char) => char._id === selectedCharacter._id
          );
          if (updated) setSelectedCharacter(updated);
        }
        setIsLoading(false);
      })
      .catch(console.error);
  }, [userId, refreshFlag]);

  const triggerRefresh = () => setRefreshFlag((prev) => !prev);

  const handleDeleteCharacter = async (id) => {
    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${userId}/${id}`,
      {
        method: "DELETE",
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
      className="max-w-6xl mx-auto p-6 space-y-4  text-white border-l-6 border-orange-500 bg-neutral-800/30"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-2xl font-bold text-orange-400">Your Characters</h1>
      {/* Saving Indicator */}
      {isLoading ? (
        <div className="flex items-center text-orange-400 font-bold py-2">
          <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
          Fetching Operators...
        </div>
      ) : (
        <div className="text-orange-400 font-bold py-2"> Operators Updated.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {characters.map((char) => (
          <CharacterCard
            key={char._id}
            character={char}
            onSelect={setSelectedCharacter}
            onDelete={handleDeleteCharacter}
          />
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
              <CharacterDetail
                character={selectedCharacter}
                user={userId}
                onUpdate={triggerRefresh}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterRoster;
