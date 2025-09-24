function CharCard({ character, onSelect, onDelete }) {
  return (
    <div
      onClick={() => onSelect(character)}
      className="relative  bg-neutral-900
          bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)]
          [background-size:8px_8px] border border-orange-500 hover:border-orange-400 rounded p-4 shadow text-white hover:bg-orange-500/50 hover:shadow-inner
          transition duration-200
          group cursor-pointer"
    >
      {/* Delete button */}
      <button
        onClick={() => {
          if (
            window.confirm(
              `Are you sure you want to delete ${character.callsign}?`
            )
          ) {
            onDelete(character.callsign);
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
        <span className="font-semibold text-white text-xs">Class:</span>{" "}
        {character.class} {character.multiClass}
      </p>
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white text-xs">BG:</span>{" "}
        {character.background}
      </p>
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">XP:</span>{" "}
        {character.XP || 0}
      </p>
    </div>
  );
}

export default CharCard;
