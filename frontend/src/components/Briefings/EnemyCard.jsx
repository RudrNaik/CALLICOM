import React, { useState, useEffect, useMemo } from "react";
import equipmentData from "../../data/Equipment.json";
import classes from "../../data/classSkills.json";
import gearSetsData from "../../data/geasrSets.json";
import {
  applyModifiers,
  getWeaponCategoriesByIdLookup,
} from "../../engine/weaponEngine";
import {
  getGearsetsForClass,
  getGearPiecesBySlot,
  getGearPieceById,
  getActiveGearsetPatch,
  GEAR_SLOT_KEYS,
} from "../../engine/equipmentEngine";
import Collapsible from "../Collapsible";

const GEAR_SLOT_LABELS = {
  headgear: "Headgear",
  vest: "Vest",
  gloves: "Gloves",
  equipment: "Equipment",
};

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
    tgt: "",
  },
  loadout: {
    Primary: "Assault Rifles",
    PrimaryFamily: null,
    Gadget: "",
    SecondaryGadget: "",
  },
  wounds: {
    FW: 0,
    DW: 0,
  },
  gearSlots: {
    headgear: "",
    vest: "",
    gloves: "",
    equipment: "",
  },
};

function EnemyCard({ id, onDelete }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [filteredGadgets, setFilteredGadgets] = useState([]);
  const [secondaryGadgets, setSecondaryGadgets] = useState([]);

  const weaponCatsLookup = useMemo(
    () => getWeaponCategoriesByIdLookup(equipmentData),
    [],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`enemy-${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          gearSlots: { ...DEFAULT_STATE.gearSlots, ...parsed.gearSlots },
        });
      }
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
      equipmentData.filter((g) => g.class === state.identity.class),
    );
  }, [state.identity.class]);

  useEffect(() => {
    setSecondaryGadgets(equipmentData.filter((g) => g.parentId === "passives"));
  });

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
  const { identity, stats, loadout, wounds, gearSlots } = state;

  const gearsets = useMemo(
    () => getGearsetsForClass({ class: identity.class }, gearSetsData),
    [identity.class],
  );

  const activePatch = useMemo(
    () => getActiveGearsetPatch(gearsets, gearSlots),
    [gearsets, gearSlots],
  );

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

  const meleeDamage = Math.max(4, Math.ceil((3 + Body + MeleeBonus) / 1.5));
  const WeaponSkill = stats.Weapon;

  // Get weapon base stats
  const baseWeaponInfo = weaponCatsLookup[loadout.Primary] || null;

  // Apply family modifiers if selected
  const weaponInfo =
    baseWeaponInfo && loadout.PrimaryFamily && baseWeaponInfo.families
      ? (() => {
          const family = baseWeaponInfo.families.find(
            (f) => f.family === loadout.PrimaryFamily,
          );
          return family
            ? applyModifiers(baseWeaponInfo, family.modifiers)
            : baseWeaponInfo;
        })()
      : baseWeaponInfo;

  const selectedGadget = filteredGadgets.find(
    (g) => g.title === loadout.Gadget,
  );

  const selectedSecondaryGadget = secondaryGadgets.find(
    (g) => g.title === loadout.SecondaryGadget,
  );

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="relative w-66 bg-neutral-900/90 bg-[radial-gradient(circle,_rgba(255,120,0,0.05)_1px,_transparent_1px)] [background-size:8px_8px] rounded-sm p-3 border border-orange-400 hover:border-neutral-100 transition">
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
            className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
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
            title="Firing"
            onClick={() => update(["identity", "firing"], !identity.firing)}
            className={`text-xs cursor-pointer ${
              identity.firing ? "text-red-500" : "text-neutral-500"
            }`}
          >
            {"[>>>]"}
          </button>
        </div>
      </div>

      {/* CORE STATS */}
      <div className="grid grid-cols-5 text-xs text-center mb-1 gap-1">
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
        <div>
          <div className="text-orange-300">AC</div>
          <input
            className="w-full bg-neutral-800 text-center rounded-xs"
            value={stats.AC}
            onChange={(e) =>
              update(["stats", "AC"], parseInt(e.target.value) || 0)
            }
          />
        </div>
      </div>

      {/* WOUNDS */}
      <div className="border-t border-orange-500/30 pt-1 text-xs">
        <div className="flex justify-between font-bold">
          <span>
            WND <span className="text-red-500">{woundMod}</span>
          </span>
          <span className="text-orange-300">CS {CombatSense}</span>
          <span className="text-[10px] font-normal">
            SYS {systemShock} |{" "}
            <span className="text-red-700">DTH {instantDeath}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 mt-0.5">
          <div className="whitespace-nowrap">
            FWT {FleshWoundThreshold}
            <button
              className="border border-orange-500 rounded-sm mx-1 px-1 cursor-pointer"
              onClick={() => update(["wounds", "FW"], wounds.FW + 1)}
            >
              +
            </button>
            <button
              className="border border-orange-500 rounded-sm px-1 cursor-pointer"
              onClick={() => update(["wounds", "FW"], wounds.FW - 1)}
            >
              -
            </button>
          </div>

          <div className="whitespace-nowrap">
            DWT {DeepWoundThreshold}
            <button
              className="border border-orange-500 rounded-sm mx-1 px-1 cursor-pointer"
              onClick={() => update(["wounds", "DW"], wounds.DW + 1)}
            >
              +
            </button>
            <button
              className="border border-orange-500 rounded-sm px-1 cursor-pointer"
              onClick={() => update(["wounds", "DW"], wounds.DW - 1)}
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* COMBAT */}
      <div className="border-t border-orange-500/30 mt-1 pt-1 text-xs">
        <div className="grid grid-cols-2 gap-1 items-center">
          <div className="flex items-center gap-1">
            <span>CQC:</span>
            <input
              className="w-8 bg-neutral-800 text-center rounded"
              value={stats.Melee}
              onChange={(e) =>
                update(["stats", "Melee"], parseInt(e.target.value) || 0)
              }
            />
            <span className="text-orange-300">DMG {meleeDamage}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>WPN:</span>
            <input
              className="w-8 bg-neutral-800 text-center rounded"
              value={stats.Weapon}
              onChange={(e) =>
                update(["stats", "Weapon"], parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1">
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
            onChange={(e) => update(["stats", "tgt"], e.target.value)}
          />
        </div>
      </div>

      {/* WEAPON */}
      <div className="border-t border-orange-500/30 mt-1 pt-1 text-xs">
        <div className="flex flex-row gap-1">
          <select
            className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
            value={loadout.Primary}
            onChange={(e) => update(["loadout", "Primary"], e.target.value)}
          >
            <option value="">Select Weapon</option>
            {Object.entries(weaponCatsLookup).map(([weaponId, weapon]) => (
              <option key={weaponId} value={weaponId}>
                {weapon?.categoryName || weaponId}
              </option>
            ))}
          </select>

          {baseWeaponInfo?.families && baseWeaponInfo.families.length > 0 && (
            <select
              className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
              value={loadout.PrimaryFamily || ""}
              onChange={(e) =>
                update(["loadout", "PrimaryFamily"], e.target.value || null)
              }
            >
              <option value="">No Family</option>
              {baseWeaponInfo.families.map((family) => (
                <option key={family.family} value={family.family}>
                  {family.family}
                </option>
              ))}
            </select>
          )}
        </div>

        {weaponInfo && (
          <div className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded-xs p-1">
            <div>
              <span className="text-orange-300">DMG:</span> {weaponInfo.damage}{" "}
              | <span className="text-orange-300">PEN:</span>{" "}
              {weaponInfo.penetration} |{" "}
              <span className="text-orange-300">RNG:</span> {weaponInfo.range}
            </div>
            {loadout.PrimaryFamily && baseWeaponInfo?.families && (
              <div className="mt-1 pt-1 border-t border-orange-500/20">
                <div className="text-orange-300">
                  Family: {loadout.PrimaryFamily}
                </div>
                <div className="text-[9px] mt-1">
                  {
                    baseWeaponInfo.families.find(
                      (f) => f.family === loadout.PrimaryFamily,
                    )?.effect
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GADGET */}
      <div className="border-t border-orange-500/30 mt-1 pt-1 text-xs">
        <div className="flex flex-row gap-1">
          <div className="font-bold text-orange-300">Gadget: </div>

          <select
            className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
            value={loadout.Gadget}
            onChange={(e) => update(["loadout", "Gadget"], e.target.value)}
            placeholder={"Secondary Gadget"}
          >
            <option value="">Select Gadget</option>
            {filteredGadgets.map((g) => (
              <option key={g.title}>{g.title}</option>
            ))}
          </select>
        </div>

        {selectedGadget && (
          <details className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded">
            <summary className="cursor-pointer px-1 text-orange-300">
              Rules
            </summary>
            <div className="p-1 max-h-28 overflow-y-auto">
              {selectedGadget.rulesText}
            </div>
          </details>
        )}
      </div>

      <div className="border-t border-orange-500/30 mt-1 pt-1 text-xs">
        <div className="flex flex-row gap-1">
          <div className="font-bold text-orange-300">Sec.Gadget</div>

          <select
            className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
            value={loadout.SecondaryGadget}
            onChange={(e) =>
              update(["loadout", "SecondaryGadget"], e.target.value)
            }
          >
            <option value="">Select Gadget</option>
            {secondaryGadgets.map((g) => (
              <option key={g.title}>{g.title}</option>
            ))}
          </select>
        </div>

        {selectedSecondaryGadget && (
          <details className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded">
            <summary className="cursor-pointer px-1 text-orange-300">
              Rules
            </summary>
            <div className="p-1 max-h-28 overflow-y-auto">
              {selectedSecondaryGadget.rulesText}
            </div>
          </details>
        )}
      </div>

      {/* GEAR SLOTS */}
      {identity.class && gearsets.length > 0 && (
        <Collapsible
          title="Gear Slots"
          color="orange-400"
          headerSize="xs"
          bottomMargin={false}
        >
          <div className="space-y-1 text-xs">
            {activePatch && (
              <div className="border border-orange-400/30 bg-orange-900/20 rounded-xs p-1">
                <div className="text-orange-300">Patch</div>
                <div className="font-semibold text-white">
                  {activePatch.name}{" "}
                  <span className="text-orange-400 text-[10px] italic font-light">
                    {activePatch.gearsetName}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-neutral-400 whitespace-pre-line">
                  {activePatch.effect}
                </div>
              </div>
            )}
            {GEAR_SLOT_KEYS.map((slotKey) => {
              const options = getGearPiecesBySlot(gearsets, slotKey);
              const equippedPiece = getGearPieceById(
                gearsets,
                gearSlots[slotKey],
              );
              return (
                <div key={slotKey}>
                  <div className="text-orange-300">
                    {GEAR_SLOT_LABELS[slotKey]}
                  </div>
                  <select
                    className="w-full bg-neutral-900 text-xs border-1 border-orange-400/60"
                    value={gearSlots[slotKey] || ""}
                    onChange={(e) =>
                      update(["gearSlots", slotKey], e.target.value)
                    }
                  >
                    <option value="">None</option>
                    {options.map((piece) => (
                      <option key={piece.id} value={piece.id}>
                        {piece.gearsetName} — {piece.name}
                      </option>
                    ))}
                  </select>
                  {equippedPiece?.effect && (
                    <div className="mt-1 text-[10px] text-neutral-400 border border-orange-500/20 rounded p-1">
                      {equippedPiece.effect}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}
    </div>
  );
}

export default EnemyCard;
