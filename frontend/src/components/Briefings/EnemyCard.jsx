import React, { useState, useEffect } from "react";
import weaponCategories from "../../data/weaponCategories.json";
import gadgetCategories from "../../data/Equipment.json";
import classes from "../../data/classSkills.json";

function EnemyCard({ id, onDelete }) {
  const defaultStats = {
    Name: "Enemy",
    Class: "Class",
    Alertness: 0,
    Body: 0,
    Intelligence: 0,
    Spirit: 0,
    AC: 0,
    Weapons: 0,
    Melee: 0,
    Primary: "N/A",
    Gadget: "N/A",
  };

  const [stats, setStats] = useState(defaultStats);
  const [FW, setFW] = useState(0);
  const [DW, setDW] = useState(0);
  const [loaded, setLoaded] = useState(false); // tracks load status
  const [filteredGadgets, setFiltered] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`enemy-data-${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stats) setStats(parsed.stats);
        if (typeof parsed.FW === "number") setFW(parsed.FW);
        if (typeof parsed.DW === "number") setDW(parsed.DW);
        console.log(`Loaded enemy-data-${id}:`, parsed);
      } else {
        console.log(`No data found for enemy-data-${id}, using defaults`);
      }
    } catch (err) {
      console.error(`Failed to parse enemy-data-${id}:`, err);
    }
    setLoaded(true);
  }, [id]);

  // Save when state changes following initial load
  useEffect(() => {
    if (!loaded) return; // avoid saving default values on first render
    const data = { stats, FW, DW };
    localStorage.setItem(`enemy-data-${id}`, JSON.stringify(data));
    // console.log(`Saved enemy-data-${id}`, data);
  }, [stats, FW, DW, id, loaded]);

  useEffect(() => {
    if (stats.Class != null) {
      setFiltered(
        gadgetCategories.filter((item) => item.class === stats.Class)
      );
    }
  });

  const handleWeaponChange = (value) => {
    setStats((prev) => ({
      ...prev,
      Primary: value,
    }));
  };

  const handleGadgetChange = (value) => {
    setStats((prev) => ({
      ...prev,
      gadget: value,
    }));
  };

  const handleChange = (field, value) => {
    const numericFields = [
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
      [field]: numericFields.includes(field) ? parseInt(value) || 0 : value,
    }));
  };

  const deleteSelf = () => {
    localStorage.removeItem(`enemy-data-${id}`);
    onDelete(id);
  };

  // Derived stats
  const { Primary, Body, Intelligence, Spirit, Melee, AC, gadget } = stats;

  const categoryData = weaponCategories[Primary];
  const gadgetData = gadgetCategories[gadget];
  const CombatSense = 1 + Intelligence + Spirit;
  const Health = Math.ceil((Body + Spirit) / 2);
  const Stamina = 5 + Body + Spirit;
  const SystemShock = 5 + Health;
  const FleshWoundThreshold = Math.ceil(Stamina / 2) + (AC || 0);
  const DeepWoundThreshold = Stamina + (AC || 0);
  const InstantDeath = Stamina * 2;
  const meleeDamage = 3 + Body + Melee;
  const woundMod = FW + DW * 2;

  return (
    <div className="relative bg-neutral-900/90 bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)] [background-size:8px_8px] rounded-lg p-4 border mt-5 border-orange-400 hover:border-orange-600 group scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
      <button
        className="absolute top-2 right-3 text-red-500 hover:text-red-700 text-xs"
        onClick={deleteSelf}
      >
        ✕
      </button>

      <input
        type="text"
        className="font-bold text-md col-span-4 max-w-full text-orange-500 border-b-2 border-dashed"
        value={stats.Name}
        onChange={(e) => handleChange("Name", e.target.value)}
      />
      <select
        className="w-full bg-neutral-900 text-neutral-400 text-xs p-2 rounded mb-2"
        value={stats.Class ?? ""} // make sure it’s a string
        onChange={(e) => handleChange("Class", e.target.value)}
      >
        <option value="" disabled>
          Select Class
        </option>
        {Object.keys(classes).map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      {/* Major Stats */}

      <div className="grid grid-cols-4 mb-2 ">
        <div className=" font-bold py-2 text-xs justify-center">ALRT</div>
        <div className="font-bold py-2 text-xs justify-center">BDY</div>
        <div className="font-bold py-2 text-xs justify-center">INT</div>
        <div className="font-bold py-2 text-xs justify-center">SPRT</div>

        <input
          type="text"
          className=" text-white text-xs max-w-6"
          value={stats.Alertness}
          onChange={(e) => handleChange("Alertness", e.target.value)}
        />
        <input
          type="text"
          className=" text-white text-xs max-w-6"
          value={stats.Body}
          onChange={(e) => handleChange("Body", e.target.value)}
        />
        <input
          type="text"
          className=" text-white text-xs max-w-6"
          value={stats.Intelligence}
          onChange={(e) => handleChange("Intelligence", e.target.value)}
        />
        <input
          type="text"
          className=" text-white text-xs max-w-6"
          value={stats.Spirit}
          onChange={(e) => handleChange("Spirit", e.target.value)}
        />
      </div>

      {/* Armor and Combat Sense */}
      <div className="grid grid-cols-2 mb-2 justify-items-center">
        <div className="flex items-center gap-1">
          <span>AC:</span>
          <input
            type="text"
            className="w-12 text-white text-center rounded max-w-7"
            value={stats.AC}
            onChange={(e) => handleChange("AC", e.target.value)}
          />
        </div>

        <div>CS: {CombatSense}</div>
      </div>

      {/* Wound handling */}
      <div classname="font-bold py-2 text-xs grid grid-cols-4">
        <div className="justify-items-center text-md grid-cols-subgrid">
          <div>
            WND: <span className="text-red-500 font-extrabold">{woundMod}</span>{" "}
          </div>
        </div>
        <div className="justify-items-center text-md grid-cols-subgrid">
          <div className="text-xs">
            FWT: {FleshWoundThreshold} |{" "}
            <button
              onClick={() => setFW(FW + 1)}
              className="text-orange-500 border-2 rounded-xl px-0.5"
            >
              +
            </button>{" "}
            <button
              onClick={() => setFW(FW - 1)}
              className="text-orange-500 border-2 rounded-xl px-0.5"
            >
              -
            </button>{" "}
          </div>
        </div>

        <div className="justify-items-center text-md grid-cols-subgrid">
          <div className="text-xs">
            DWT: {DeepWoundThreshold} |{" "}
            <button
              onClick={() => setDW(DW + 1)}
              className="text-orange-500 border-2 rounded-xl px-0.5"
            >
              +
            </button>{" "}
            <button
              onClick={() => setDW(DW - 1)}
              className="text-orange-500 border-2 rounded-xl px-0.5"
            >
              -
            </button>{" "}
          </div>
        </div>

        <div className="justify-items-center text-md grid-cols-subgrid">
          <div className="text-xs">
            INSTDTH:{" "}
            <span className=" font-bold text-red-800">{InstantDeath}</span>
          </div>
          <div className="text-xs">
            SYSSHK:{" "}
            <span className=" font-bold text-orange-700">{SystemShock}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center">--------------</div>

      {/* Weapons and Gear */}
      <div classname="font-bold py-2 text-xs flex-col">
        <div className="flex items-center gap-1">
          <span className="text-xs">Weapons:</span>
          <input
            type="text"
            className="w-12 text-white text-center rounded text-xs max-w-6"
            value={stats.Weapons}
            onChange={(e) => handleChange("Weapons", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">Melee:</span>
          <input
            type="text"
            className="w-12 text-white text-center rounded text-xs max-w-6"
            value={stats.Melee}
            onChange={(e) => handleChange("Melee", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs"> MLDMG: {meleeDamage}</span>
        </div>

        <div className="text-xs mt-2">
          <select
            className="w-full bg-neutral-900 text-white p-2 rounded mb-2"
            value={Primary || ""}
            onChange={(e) => handleWeaponChange(e.target.value)}
          >
            <option value="">Select Weapon Category</option>
            {Object.keys(weaponCategories).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {categoryData && (
            <div className="text-xs text-gray-400 p-2 rounded">
              <div>Damage: {categoryData.damage}</div>
              <div>Penetration: {categoryData.penetration}</div>
              <div>Range: {categoryData.range}</div>
            </div>
          )}
        </div>

        <div className="text-xs mt-2">
          <select
            className="w-full bg-neutral-900 text-white p-2 rounded mb-2"
            value={gadget || ""}
            onChange={(e) => handleGadgetChange(e.target.value)}
          >
            <option value="">Select Gadget</option>
            {Object.keys(filteredGadgets).map((id) => (
              <option key={id} value={id}>
                {filteredGadgets[id].title}
              </option>
            ))}
          </select>

          {gadget && filteredGadgets[gadget] && (
            <div className="text-xs text-gray-400 p-2 rounded">
              <div className="whitespace-pre-wrap">
                {filteredGadgets[gadget].rulesText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnemyCard;
