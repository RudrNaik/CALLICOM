import React, { useState, useEffect } from "react";
import EnemyCard from "./EnemyCard";
import weaponCategories from "../../data/weaponCategories.json";


function EnemyView() {
  const [enemyIds, setEnemyIds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [rollPreview, setRollPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // load the IDs
  useEffect(() => {
    const saved = localStorage.getItem("enemy-ids");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setEnemyIds(parsed);
      } catch (err) {
        console.error("Failed to parse enemy-ids:", err);
      }
    } else {
      setEnemyIds(["enemy-1"]);
    }
    setLoaded(true);
  }, []);

  /* =======================
     SAVE IDS
  ======================= */
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("enemy-ids", JSON.stringify(enemyIds));
    }
  }, [enemyIds, loaded]);

  // Enemy manager
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
    localStorage.removeItem(`enemy-${idToRemove}`);
    setEnemyIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  // Turns
  const increaseTurn = () => setTurnCount((t) => t + 1);
  const resetTurns = () => setTurnCount(0);

  // Range and weapon managment.
  const parseRangeProfile = (rangeString = "") => {
    // Example input: "-1 C | +1 M | -1 ELR"
    const profile = {};

    rangeString.split("|").forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      const match = trimmed.match(/([+-]?\d+)\s*(C|M|L|ELR)/i);
      if (!match) return;

      const [, value, band] = match;
      profile[band.toUpperCase()] = Number(value);
    });

    return profile;
  };

  const getRangeModifier = (enemy, weapon) => {
    if (!weapon?.range) return 0;

    const band = enemy.stats?.rng;
    if (!band) return 0;

    const profile = parseRangeProfile(weapon.range);

    // EELR counts as ELR
    if (band === "EELR") return profile.ELR ?? 0;

    return profile[band] ?? 0;
  };

  const buildEnemyRollExpression = (enemy, weapon) => {
    setShowPreview(true);
    const weaponSkill = enemy.stats?.Weapon ?? 0;
    const dice = weaponSkill <= 0 ? "2d6l" : `${weaponSkill}d6k1`;

    const FW = enemy.wounds?.FW ?? 0;
    const DW = enemy.wounds?.DW ?? 0;
    const woundPenalty = FW + (DW * 2);

    const rangeMod = getRangeModifier(enemy, weapon);

    let expr = dice;

    if (rangeMod !== 0) {
      expr += rangeMod > 0 ? ` + ${rangeMod}` : ` - ${Math.abs(rangeMod)}`;
    }

    if (woundPenalty > 0) {
      expr += ` - ${woundPenalty}`;
    }

    return {
      expr,
      rangeMod,
      woundPenalty,
    };
  };

  // Volley roll generator
  const buildFiringRoll = () => {
    const parts = [];

    enemyIds.forEach((id) => {
      try {
        const raw = localStorage.getItem(`enemy-${id}`);
        if (!raw) return;

        const enemy = JSON.parse(raw);
        if (!enemy?.identity?.firing) return;

        const weaponId = enemy.loadout?.Primary;
        const weapon = weaponCategories?.[weaponId];

        const name = enemy.identity.name || id;
        const target = enemy.stats?.tgt;

        const { expr, rangeMod, woundPenalty } = buildEnemyRollExpression(
          enemy,
          weapon,
        );

        let comment = `${name} @ ${target || "TGT"} `;

        if (enemy.stats?.rng) comment += `(${enemy.stats.rng}) `;

        if (rangeMod !== 0)
          comment += `(RNG ${rangeMod > 0 ? "+" : ""}${rangeMod}) `;

        if (woundPenalty > 0) comment += `(WND -${woundPenalty})`;

        parts.push(`${expr} # ${comment.trim()}`);
      } catch (err) {
        console.warn(`Failed to parse enemy ${id}`, err);
      }
    });

    if (!parts.length) return "";

    return `.r ${parts.join("; ")}`;
  };

  const generateAndCopyRoll = () => {
    const roll = buildFiringRoll();
    if (!roll) return;

    setRollPreview(roll);
    navigator.clipboard.writeText(roll);
  };

  return (
    <div
      className="
        bg-gradient-to-t from-neutral-800 to-neutral-850
        border border-orange-500 rounded-xl p-6 shadow-lg mt-5
        overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700
      "
    >
      <h1 className="text-neutral-200 text-2xl font-bold px-2 border-l-4 mb-2 border-orange-500">
        Enemy Manager 
        {(turnCount > 0) && (
          ` | Turn: ${turnCount}`
        )}
      </h1>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
          onClick={addEnemy}
        >
          + Add Enemy
        </button>

        <button
          className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
          onClick={increaseTurn}
        >
          Encounter Turns: {turnCount}
        </button>

        <button
          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          onClick={resetTurns}
        >
          Reset Turns
        </button>

        <button
          className="px-2 py-1 text-xs bg-orange-700 text-white rounded hover:bg-orange-500"
          onClick={generateAndCopyRoll}
        >
          CPY ATK Roll
        </button>
        <button
          className="px-2 py-1 text-xs bg-neutral-700 text-neutral-200 rounded hover:bg-neutral-600"
          onClick={() => {
            setShowPreview(false);
            setRollPreview("");
          }}
        >
          CLR Rolls
        </button>
      </div>

      {/* ROLL PREVIEW */}
      {rollPreview && showPreview && (
        <pre className="text-xs bg-neutral-900 border border-orange-500/30 p-2 rounded mb-3 text-orange-300">
          {rollPreview}
        </pre>
      )}

      {/* ENEMIES */}
      <div className="flex flex-row gap-2 flex-wrap justify-start">
        {enemyIds.map((id) => (
          <EnemyCard key={id} id={id} onDelete={removeEnemy} />
        ))}
      </div>
    </div>
  );
}

export default EnemyView;
