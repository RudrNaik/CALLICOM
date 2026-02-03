import React, { useState, useEffect } from "react";
import weaponCategories from "../../data/weaponCategories.json";
import gadgetCategories from "../../data/Equipment.json";
import classes from "../../data/classSkills.json";

/* =======================
   DEFAULT STATE
======================= */
const DEFAULT_STATE = {
  identity: {
    name: "Enemy",
    class: "",
    firing: false,
    pinged: false,
  },
  stats: {
    Alertness: 1,
    Body: 0,
    Intelligence: 0,
    Spirit: 0,
    AC: 1,
    Melee: 1,
    Weapon: 1,
    rng: "",
    tgt: ""
  },
  loadout: {
    Primary: "Assault Rifles",
    Gadget: "",
  },
  wounds: {
    FW: 0,
    DW: 0,
  },
};

function EnemyCard({ id, onDelete }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [filteredGadgets, setFilteredGadgets] = useState([]);

  /* =======================
     LOAD / SAVE
  ======================= */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`enemy-${id}`);
      if (saved) setState(JSON.parse(saved));
    } catch (err) {
      console.error("Failed to load enemy:", err);
    }
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`enemy-${id}`, JSON.stringify(state));
  }, [state, loaded, id]);

  /* =======================
     FILTER GADGETS
  ======================= */
  useEffect(() => {
    setFilteredGadgets(
      gadgetCategories.filter((g) => g.class === state.identity.class)
    );
  }, [state.identity.class]);

  /* =======================
     UPDATE HELPER
  ======================= */
  const update = (path, value) => {
    setState((prev) => {
      const next = structuredClone(prev);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });
  };

  const deleteSelf = () => {
    localStorage.removeItem(`enemy-${id}`);
    onDelete(id);
  };

  /* =======================
     DERIVED VALUES
  ======================= */
  const { identity, stats, loadout, wounds } = state;

  const Body = Number(stats.Body) || 0;
  const Spirit = Number(stats.Spirit) || 0;
  const Intelligence = Number(stats.Intelligence) || 0;
  const AC = Number(stats.AC) || 0;
  const MeleeBonus = Number(stats.Melee) || 0;

  const CombatSense = 1 + Intelligence + Spirit;
  const Stamina = 5 + Body + Spirit;

  const FleshWoundThreshold = Math.ceil(Stamina / 2) + AC;
  const DeepWoundThreshold = Stamina + AC;

  const woundMod = wounds.FW + wounds.DW * 2;
  const systemShock = 5 + Math.ceil((Body + Spirit) / 2);
  const instantDeath = Stamina * 2;

  const meleeDamage = Math.max(4, Math.ceil((3 + Body + MeleeBonus)/1.5));
  const WeaponSkill = stats.Weapon;

  const weaponInfo = weaponCategories[loadout.Primary] || null;
  const selectedGadget = filteredGadgets.find(
    (g) => g.title === loadout.Gadget
  );

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="relative w-66 mb-4 bg-neutral-900/90 bg-[radial-gradient(circle,_rgba(255,120,0,0.05)_1px,_transparent_1px)] [background-size:8px_8px] rounded-lg p-4 border border-orange-400 hover:border-neutral-100 transition">
      {/* DELETE */}
      <button
        onClick={deleteSelf}
        className="absolute top-2 right-2 text-red-500 text-xs"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-start mb-2 mr-3">
        <div className="flex-1 pr-2">
          <input
            className="font-bold text-orange-500 bg-transparent border-b border-dashed w-full"
            value={identity.name}
            onChange={(e) => update(["identity", "name"], e.target.value)}
          />
          <select
            className="w-full bg-neutral-900 text-neutral-400 text-xs mt-1"
            value={identity.class}
            onChange={(e) => update(["identity", "class"], e.target.value)}
          >
            <option value="">Select Class</option>
            {Object.keys(classes).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* FLAGS */}
        <div className="flex flex-col items-end gap-1">
          <button
            title="Pinged"
            onClick={() => update(["identity", "pinged"], !identity.pinged)}
            className={`w-3 h-3 rounded-full cursor-pointer ${
              identity.pinged ? "bg-red-500" : "border border-neutral-500"
            }`}
          />
          <button
            title="Firing"
            onClick={() => update(["identity", "firing"], !identity.firing)}
            className={`text-xs cursor-pointer ${
              identity.firing ? "text-red-500" : "text-neutral-500"
            }`}
          >
            {">>>"}
          </button>
        </div>
      </div>

      {/* CORE STATS */}
      <div className="grid grid-cols-4 text-xs text-center mb-2 gap-2">
        {["Alertness", "Body", "Intelligence", "Spirit"].map((a) => (
          <div key={a}>
            <div className="text-orange-300">{a.slice(0, 3)}</div>
            <input
              className="w-full bg-neutral-800 text-center rounded-xs"
              value={stats[a]}
              onChange={(e) =>
                update(["stats", a], parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>

      {/* DEFENSE */}
      <div className="grid grid-cols-2 text-xs mb-2">
        <div>
          AC{" "}
          <input
            className="w-10 bg-neutral-800 text-center rounded ml-1"
            value={stats.AC}
            onChange={(e) =>
              update(["stats", "AC"], parseInt(e.target.value) || 0)
            }
          />
        </div>
        <div className="text-orange-300">CS {CombatSense}</div>
      </div>

      {/* WOUNDS */}
      <div className="border-t border-orange-500/30 pt-1 text-xs">
        <div className="font-bold">
          WND <span className="text-red-500">{woundMod}</span>
        </div>

        <div>
          FWT {FleshWoundThreshold}{" "}
          <button
            className="border-1 border-orange-500 rounded-sm mx-1 mb-0.5 px-1 cursor-pointer"
            onClick={() => update(["wounds", "FW"], wounds.FW + 1)}
          >
            +
          </button>
          <button
            className="border-1 border-orange-500 rounded-sm mx-1 px-1 cursor-pointer"
            onClick={() => update(["wounds", "FW"], wounds.FW - 1)}
          >
            -
          </button>
        </div>

        <div>
          DWT {DeepWoundThreshold}{" "}
          <button
            className="border-1 border-orange-500 rounded-sm mx-1 px-1 cursor-pointer"
            onClick={() => update(["wounds", "DW"], wounds.DW + 1)}
          >
            +
          </button>
          <button
            className="border-1 border-orange-500 rounded-sm mx-1 px-1 cursor-pointer"
            onClick={() => update(["wounds", "DW"], wounds.DW - 1)}
          >
            -
          </button>
        </div>

        <div className="text-[10px] mt-0.5">
          SYS {systemShock} |{" "}
          <span className="text-red-700">DTH {instantDeath}</span>
        </div>
      </div>

      {/* COMBAT */}
      <div className="border-t border-orange-500/30 mt-2 pt-1 text-xs">
        <div className="font-bold text-orange-300">Combat</div>

        <div className="flex items-center gap-1 mt-1">
          <span>CQC:</span>
          <input
            className="w-10 bg-neutral-800 text-center rounded"
            value={stats.Melee}
            onChange={(e) =>
              update(["stats", "Melee"], parseInt(e.target.value) || 0)
            }
          />
          <span className="text-orange-300">DMG {meleeDamage}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span>WPN:</span>
          <input
            className="w-10 bg-neutral-800 text-center rounded"
            value={stats.Weapon}
            onChange={(e) =>
              update(["stats", "Weapon"], parseInt(e.target.value) || 0)
            }
          />
          <input
              className="w-full bg-neutral-800 text-center rounded-xs"
              value={stats.rng}
              type="text"
              placeholder="RNG"
              onChange={(e) =>
                update(["stats", "rng"], e.target.value.toUpperCase())
              }
            />
            <input
              className="w-full bg-neutral-800 text-center rounded-xs"
              value={stats.tgt}
              type="text"
              placeholder="TGT"
              onChange={(e) =>
                update(["stats", "tgt"], e.target.value)
              }
            />
        </div>
      </div>

      {/* WEAPON */}
      <div className="border-t border-orange-500/30 mt-2 pt-1 text-xs">
        <div className="font-bold text-orange-300">Weapon</div>

        <select
          className="w-full bg-neutral-900 text-xs mt-1"
          value={loadout.Primary}
          onChange={(e) => update(["loadout", "Primary"], e.target.value)}
        >
          <option value="">Select Weapon</option>
          {Object.keys(weaponCategories).map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>

        {weaponInfo && (
          <div className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded p-1">
            <div>
              <span className="text-orange-300">DMG:</span> {weaponInfo.damage}{" "}
              | <span className="text-orange-300">PEN:</span>{" "}
              {weaponInfo.penetration}
            </div>
            <div>
              <span className="text-orange-300">RNG:</span> {weaponInfo.range}
            </div>
          </div>
        )}
      </div>

      {/* GADGET */}
      <div className="border-t border-orange-500/30 mt-2 pt-1 text-xs">
        <div className="font-bold text-orange-300">Gadget</div>

        <select
          className="w-full bg-neutral-900 text-xs mt-1"
          value={loadout.Gadget}
          onChange={(e) => update(["loadout", "Gadget"], e.target.value)}
        >
          <option value="">Select Gadget</option>
          {filteredGadgets.map((g) => (
            <option key={g.title}>{g.title}</option>
          ))}
        </select>

        {selectedGadget && (
          <div className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded p-1 max-h-28 overflow-y-auto">
            {selectedGadget.rulesText}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnemyCard;
