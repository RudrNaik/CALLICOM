import { useState } from "react";

function XpControls({ xpRemaining, setIsEditing, patchXP }) {
  const [showXpInput, setShowXpInput] = useState(false);
  const [xpToAdd, setXpToAdd] = useState("");

  const handleConfirm = () => {
    const num = parseInt(xpToAdd, 10);
    if (isNaN(num) || num <= 0) {
      setXpToAdd("");
      setShowXpInput(false);
      return;
    }
    patchXP(num);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setIsEditing(true)}
        className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
      >
        Spend XP | {xpRemaining}
      </button>

      {!showXpInput && (
        <button
          onClick={() => setShowXpInput(true)}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
        >
          + Add XP
        </button>
      )}

      {showXpInput && (
        <>
          <input
            type="number"
            min="0"
            className="w-24 px-2 py-1 bg-neutral-800 border border-gray-500 rounded text-white"
            placeholder="XP"
            value={xpToAdd}
            onChange={(e) => setXpToAdd(e.target.value)}
          />
          <button
            onClick={() => {
              handleConfirm();
              setShowXpInput(false);
            }}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
          >
            Confirm
          </button>
        </>
      )}
    </div>
  );
}

export default XpControls;
