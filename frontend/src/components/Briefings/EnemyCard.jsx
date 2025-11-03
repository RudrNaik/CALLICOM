import React, { useState, useEffect } from "react";
import weaponCategories from "../../data/weaponCategories.json";
import gadgetCategories from "../../data/Equipment.json";
import classes from "../../data/classSkills.json";

function EnemyCard({ id, onDelete }) {
  const defaultStats = {
    Name: "Enemy",
    Class: "Rifleman",
    Alertness: 0,
    Body: 0,
    Intelligence: 0,
    Spirit: 0,
    AC: 0,
    Weapons: 0,
    Melee: 0,
    Primary: "Assault Rifles",
    Gadget: "",
  };

  const [stats, setStats] = useState(defaultStats);
  const [FW, setFW] = useState(0);
  const [DW, setDW] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [filteredGadgets, setFiltered] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`enemy-data-${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stats) setStats(parsed.stats);
        if (typeof parsed.FW === "number") setFW(parsed.FW);
        if (typeof parsed.DW === "number") setDW(parsed.DW);
      }
    } catch (err) {
      console.error(`Failed to parse enemy-data-${id}:`, err);
    }
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    if (!loaded) return;
    const data = { stats, FW, DW };
    localStorage.setItem(`enemy-data-${id}`, JSON.stringify(data));
  }, [stats, FW, DW, id, loaded]);

  useEffect(() => {
    if (stats.Class != null) {
      setFiltered(
        gadgetCategories.filter((item) => item.class === stats.Class)
      );
    }
  }, [stats.Class]);

  const handleChange = (field, value) => {
    const numeric = [
      "Alertness",
      "Body",
      "Intelligence",
      "Spirit",
      "AC",
      "Weapons",
      "Melee",
    ];
    setStats((prev) => ({
      ...prev,
      [field]: numeric.includes(field) ? parseInt(value) || 0 : value,
    }));
  };

  const handleWeaponChange = (value) =>
    setStats((prev) => ({ ...prev, Primary: value }));
  const handleGadgetChange = (value) =>
    setStats((prev) => ({ ...prev, Gadget: value }));

  const deleteSelf = () => {
    localStorage.removeItem(`enemy-data-${id}`);
    onDelete(id);
  };

  // Derived stats
  const { Primary, Body, Intelligence, Spirit, AC, Gadget } = stats;
  const CombatSense = 1 + Intelligence + Spirit;
  const Stamina = 5 + Body + Spirit;
  const FleshWoundThreshold = Math.ceil(Stamina / 2) + (AC || 0);
  const DeepWoundThreshold = Stamina + (AC || 0);
  const woundMod = FW + DW * 2;
  const instantDeath = Stamina * 2;
  const systemShock = Math.ceil((Body + Spirit) / 2) + 5;

  // NEW: weapon + gadget lookups for inline display
  const weaponInfo = weaponCategories[Primary] || null;
  const selectedGadget =
    (Gadget && filteredGadgets.find((g) => g.title === Gadget)) || null;

  return (
    <div className="relative w-full flex items-center gap-4 bg-neutral-900/80 border border-orange-500/60 rounded-lg px-3 py-2 text-[12px] text-neutral-200 hover:border-orange-400 transition">
      {/* Delete button */}
      <button
        className="absolute top-1 right-2 text-red-500 hover:text-red-700 text-xs"
        onClick={deleteSelf}
      >
        ✕
      </button>

      {/* Enemy Name / Class */}
      <div className="flex flex-col w-36">
        <input
          type="text"
          className="font-bold text-sm text-orange-400 bg-transparent border-b border-dashed border-orange-400 focus:outline-none"
          value={stats.Name}
          onChange={(e) => handleChange("Name", e.target.value)}
        />
        <select
          className="select-themed bg-neutral-800 text-xs rounded mt-1 text-neutral-300"
          value={stats.Class}
          onChange={(e) => handleChange("Class", e.target.value)}
        >
          {Object.keys(classes).map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {["Alertness", "Body", "Intelligence", "Spirit"].map((attr) => (
          <div key={attr} className="flex flex-col items-center">
            <span className="text-orange-300 text-[11px] font-semibold">
              {attr.slice(0, 3).toUpperCase()}
            </span>
            <input
              type="number"
              className="num-themed w-10 text-center bg-neutral-800 rounded text-xs"
              value={stats[attr]}
              onChange={(e) => handleChange(attr, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* AC / CS */}
      <div className="flex flex-col items-center text-xs">
        <div className="flex items-center gap-1">
          <span>AC:</span>
          <input
            type="number"
            className="num-themed w-10 text-center bg-neutral-800 rounded"
            value={stats.AC}
            onChange={(e) => handleChange("AC", e.target.value)}
          />
        </div>
        <div className="text-orange-300">CS: {CombatSense}</div>
      </div>

      {/* Wounds */}
      <div className="flex flex-col items-center text-xs">
        <div className="text-red-400 font-semibold">WND: {woundMod}</div>
        <div className="flex items-center gap-1">
          <span>F:{FleshWoundThreshold}</span>
          <button
            onClick={() => setFW(FW + 1)}
            className="px-1 text-orange-400 border border-orange-500/60 rounded"
          >
            +
          </button>
          <button
            onClick={() => setFW(FW - 1)}
            className="px-1 text-orange-400 border border-orange-500/60 rounded"
          >
            -
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span>D:{DeepWoundThreshold}</span>
          <button
            onClick={() => setDW(DW + 1)}
            className="px-1 text-orange-400 border border-orange-500/60 rounded"
          >
            +
          </button>
          <button
            onClick={() => setDW(DW - 1)}
            className="px-1 text-orange-400 border border-orange-500/60 rounded"
          >
            -
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center text-xs">
        <div className="text-orange-300">SYS: <span className="text-red-700">{systemShock}</span></div>
        <div className="text-orange-300">DTH: <span className="text-red-900">{instantDeath}</span></div>
      </div>

      {/* Weapon */}
      <div className="flex flex-col text-xs min-w-[10rem]">
        <div className="flex items-center gap-2">
          <span className="text-orange-300 font-semibold">Weapon</span>
          <select
            className="select-themed bg-neutral-800 rounded px-1 text-xs"
            value={Primary}
            onChange={(e) => handleWeaponChange(e.target.value)}
          >
            {Object.keys(weaponCategories).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* stacked stats below the dropdown */}
        {weaponInfo ? (
          <div
            className="text-neutral-400 leading-tight mt-1"
            title={`Damage: ${weaponInfo.damage} Penetration: ${weaponInfo.penetration} Range: ${weaponInfo.range}`}
          >
            <div>
              DMG: {weaponInfo.damage} | PEN: {weaponInfo.penetration}
            </div>
            <div>RNG: {weaponInfo.range}</div>
          </div>
        ) : (
          <div className="text-neutral-500 mt-1">—</div>
        )}
      </div>

      {/* Gadget */}
      <div className="flex flex-col text-xs min-w-[18rem]">
        <div className="flex items-center gap-2">
          <span className="text-orange-300 font-semibold">Gadget</span>
          <select
            className="select-themed bg-neutral-800 rounded px-1 text-xs min-w-[20rem]"
            value={Gadget || ""}
            onChange={(e) => handleGadgetChange(e.target.value)}
          >
            <option value="">—</option>
            {filteredGadgets.map((g, i) => (
              <option key={i} value={g.title}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Description below selector */}
        {selectedGadget ? (
          <div
            className="text-neutral-400 leading-tight mt-1 max-w-[30rem]"
            title={selectedGadget.rulesText}
          >
            {selectedGadget.rulesText}
          </div>
        ) : (
          <div className="text-neutral-500 mt-1">—</div>
        )}
      </div>
    </div>
  );
}

export default EnemyCard;
