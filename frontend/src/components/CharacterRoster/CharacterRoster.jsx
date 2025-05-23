import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterDetail from "./CharacterDetail";

function CharacterRoster({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState();
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8080/api/characters/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data);

        if (selectedCharacter) {
          const updated = data.find(
            (char) => char._id === selectedCharacter._id
          );
          if (updated) setSelectedCharacter(updated);
        }
      })
      .catch(console.error);
  }, [userId, refreshFlag]);

  const triggerRefresh = () => setRefreshFlag((prev) => !prev);

  const handleDeleteCharacter = async (id) => {
    const res = await fetch(
      `http://localhost:8080/api/characters/${userId}/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setCharacters((prev) => prev.filter((char) => char._id !== id));
      triggerRefresh();
    } else {
      alert("Failed to delete character.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4 font-[Geist_Mono] text-white border-l-6 border-orange-500 bg-neutral-800/30">
      <h1 className="text-2xl font-bold text-orange-400">Your Characters</h1>

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
