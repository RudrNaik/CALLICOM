import React from "react";

function Roster({ characters, isLoading}) {
  return (
    <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md">
      <h2 className="uppercase text-sm text-orange-400">Operator Roster</h2>
      {isLoading ? (
        <div className="flex items-center textr-xs text-orange-400 py-2 mb-2">
          <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
          Fetching Operators...
        </div>
      ) : (
        <div className="text-orange-400 text-xs py-2 mb-2">
          {" "}
          Operators Updated.
        </div>
      )}
      <div className="space-y-4">
        {characters.map((char) => (
          <div
            key={char._id || char.name}
            className="bg-neutral-700 rounded-lg p-4 border border-gray-600 hover:border-orange-400"
          >
            <p className="text-orange-300 font-semibold text-sm">{char.name}</p>
            <p className="text-xs text-gray-300">Click to view loadout</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Roster
