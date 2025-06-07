function Edice({
  isEditing,
  emergencyDice,
  removeEmergencyDie,
  addEmergencyDie,
}) {
  return (
    <div className="mt-6">
      {/* Tooltip wrapper */}
      <div className="relative inline-block group">
        <h2 className="text-xl font-bold text-orange-400">Emergency Dice</h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Emergency dice can be spent to increase the amount of dice rolled in a check. It can be used <span className="text-orange-500 font-bold">proactively</span> in any case, but only <span className="text-orange-500 font-bold">retroactively</span> in <span className="text-orange-500 font-bold">cognition</span> checks.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4 mt-2">
        <span className="text-white text-lg">
          {emergencyDice} dice available
        </span>

        <button
          onClick={removeEmergencyDie}
          className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
        >
          −
        </button>

        {isEditing && (
          <button
            onClick={addEmergencyDie}
            className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export default Edice;
