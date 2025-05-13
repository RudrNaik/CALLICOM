function Edice({
  isEditing,
  emergencyDice,
  removeEmergencyDie,
  addEmergencyDie,
}) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-orange-400">Emergency Dice</h2>
      <div className="flex items-center space-x-4">
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
