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
        className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
      >
        Spend XP | {xpRemaining}
      </button>
    </div>
  );
}

export default XpControls;
