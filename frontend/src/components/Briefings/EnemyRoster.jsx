import React, { useState, useEffect } from "react";
import EnemyCard from "./EnemyCard";

function EnemyView() {
  const [enemyIds, setEnemyIds] = useState([]);
  const [loaded, setLoaded] = useState(false); // ⬅ track whether we've loaded data

  // ✅ Load IDs from localStorage once on mount
  useEffect(() => {
    const saved = localStorage.getItem("enemy-ids");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEnemyIds(parsed);
          console.log("Loaded enemy IDs:", parsed);
        }
      } catch (err) {
        console.error("Failed to parse enemy-ids:", err);
      }
    } else {
      setEnemyIds(["enemy-1"]);
    }
    setLoaded(true); // ✅ allow saving from this point forward
  }, []);

  // ✅ Save to localStorage when enemyIds change (but only after first load)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("enemy-ids", JSON.stringify(enemyIds));
      console.log("Saved enemy IDs:", enemyIds);
    }
  }, [enemyIds, loaded]);

  // ✅ Generate the next unused ID
  const addEnemy = () => {
    let counter = 1;
    let nextId = `enemy-${counter}`;
    while (enemyIds.includes(nextId)) {
      counter++;
      nextId = `enemy-${counter}`;
    }
    setEnemyIds((prev) => [...prev, nextId]);
  };

  const removeEnemy = (idToRemove) => {
    localStorage.removeItem(`enemy-data-${idToRemove}`);
    setEnemyIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  return (
    <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg mt-5 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
      <button
        className="mb-4 px-4 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
        onClick={addEnemy}
      >
        + Add Enemy
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {enemyIds.map((id) => (
          <EnemyCard key={id} id={id} onDelete={removeEnemy} />
        ))}
      </div>
    </div>
  );
}

export default EnemyView;
