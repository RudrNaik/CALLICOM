function CharCard({ character, onSelect, onDelete }) {
  return (
    <div
      onClick={() => onSelect(character)}
      className="relative bg-neutral-800 border border-orange-500 hover:border-orange-400 rounded p-4 shadow text-white"
    >
      {/* Delete button */}
      <button
        onClick={() => {
          if (
            window.confirm(
              `Are you sure you want to delete ${character.callsign}?`
            )
          ) {
            onDelete(character.callsign); // Pass character _id instead of callsign
          }
        }}
        className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm"
      >
        X
      </button>

      <h2 className="text-xl font-bold text-orange-300">
        {character.callsign}
      </h2>
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">Name:</span> {character.name}
      </p>
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">Class:</span>{" "}
        {character.class}
      </p>
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">XP:</span>{" "}
        {character.XP || 0}
      </p>
    </div>
  );
}

export default CharCard;
