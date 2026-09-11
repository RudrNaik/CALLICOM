import { useState, useEffect, useMemo } from "react";
import equipmentData from "../../../data/Equipment.json";
import {
  getWeaponCategoriesLookup,
  getWeaponData,
  getRangeModifier,
  getNavigateModifier,
  totalModifierValue as computeTotalModifierValue,
  rollExpression as buildRollExpression,
} from "../../../engine/weaponEngine";
import {
  getWoundPenalty,
  getBaseDiceCount,
  getEffectiveDiceCount,
} from "../../../engine/characterEngine";

function Calculator({
  characterData,
  fleshWounds,
  deepWounds,
  onIncreaseFlesh,
  onDecreaseFlesh,
  onIncreaseDeep,
  onDecreaseDeep,
}) {
  const [character, setCharacter] = useState(null);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [skills, setSkills] = useState(null);

  const [rollMode, setRollMode] = useState("weapon");
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedRange, setSelectedRange] = useState("M");

  const [modifiers, setModifiers] = useState([]);
  const [newModValue, setNewModValue] = useState(0);
  const [newModLabel, setNewModLabel] = useState("");

  const [diceModifiers, setDiceModifiers] = useState([]);
  const [newDiceModValue, setNewDiceModValue] = useState(0);
  const [newDiceModLabel, setNewDiceModLabel] = useState("");

  const weaponCatsLookup = useMemo(
    () => getWeaponCategoriesLookup(equipmentData),
    [],
  );

  const [pingEnabled, setPingEnabled] = useState(false);

  const [navigateRoll, setNavigateRoll] = useState(null);

  const characterKey =
    characterData?._id || characterData?.uniqueId || characterData?.callsign;

  useEffect(() => {
    if (characterData) {
      setCharacter(characterData);
      setPrimary(characterData?.equipment?.primaryWeapon);
      setSecondary(characterData?.equipment?.secondaryWeapon);
      setSkills(characterData?.skills);
    }
  }, [characterData]);

  // Reset the roll-builder selections (not just the synced character/gear
  // above) when switching to a different character, so picks from the
  // previous character's weapons/skills don't linger in the UI.
  useEffect(() => {
    setRollMode("weapon");
    setSelectedWeapon(null);
    setSelectedSkill(null);
    setSelectedRange("M");
    setModifiers([]);
    setNewModValue(0);
    setNewModLabel("");
    setDiceModifiers([]);
    setNewDiceModValue(0);
    setNewDiceModLabel("");
    setPingEnabled(false);
    setNavigateRoll(null);
  }, [characterKey]);

  const getSkillLevel = () => {
    if (rollMode === "skill") return skills?.[selectedSkill] ?? 0;
    if (!selectedWeapon) return 0;
    const weaponData = getWeaponData(selectedWeapon, weaponCatsLookup);
    return skills?.[weaponData?.class] ?? 0;
  };

  const rangeMod = rollMode === "weapon"
    ? getRangeModifier(selectedWeapon, weaponCatsLookup, selectedWeapon?.family, selectedRange)
    : 0;

  const navigateMod = getNavigateModifier(navigateRoll);

  const woundPenalty = useMemo(() => {
    return getWoundPenalty(fleshWounds, deepWounds);
  }, [fleshWounds, deepWounds]);

  const totalDiceChange = useMemo(() => {
    return diceModifiers.reduce((sum, m) => sum + Number(m.value), 0);
  }, [diceModifiers]);

  const skillLevel = getSkillLevel();
  const baseDiceCount = getBaseDiceCount(skillLevel);
  const effectiveDiceCount = getEffectiveDiceCount(skillLevel, totalDiceChange);

  const totalModValue = useMemo(() => {
    return computeTotalModifierValue({
      modifiers,
      rollMode,
      rangeMod,
      pingEnabled,
      selectedRange,
      navigateMod,
    });
  }, [
    modifiers,
    selectedWeapon,
    selectedRange,
    rollMode,
    pingEnabled,
    navigateRoll,
    rangeMod,
    navigateMod,
  ]);

  const rollExpr = useMemo(() => {
    return buildRollExpression({
      skillLevel,
      effectiveCount: effectiveDiceCount,
      rollMode,
      rangeMod,
      selectedRange,
      navigateMod,
      pingEnabled,
      modifiers,
      diceModifiers,
      woundPenalty,
    });
  }, [
    totalModValue,
    totalDiceChange,
    woundPenalty,
    selectedWeapon,
    selectedSkill,
    rollMode,
    modifiers,
    diceModifiers,
    selectedRange,
    pingEnabled,
    navigateRoll,
    skillLevel,
    effectiveDiceCount,
    rangeMod,
    navigateMod,
  ]);

  const addModifier = () => {
    if (!newModLabel.trim()) return;
    setModifiers([
      ...modifiers,
      { id: Date.now(), value: Number(newModValue), label: newModLabel.trim() },
    ]);
    setNewModValue(0);
    setNewModLabel("");
  };

  const removeModifier = (id) =>
    setModifiers(modifiers.filter((m) => m.id !== id));

  const addDiceModifier = () => {
    if (!newDiceModLabel.trim()) return;
    setDiceModifiers([
      ...diceModifiers,
      {
        id: Date.now(),
        value: Number(newDiceModValue),
        label: newDiceModLabel.trim(),
      },
    ]);
    setNewDiceModValue(0);
    setNewDiceModLabel("");
  };

  const removeDiceModifier = (id) =>
    setDiceModifiers(diceModifiers.filter((m) => m.id !== id));

  const copyToClipboard = () => navigator.clipboard.writeText(rollExpr);

  if (!character) {
    return (
      <div className="border border-orange-500/30 bg-neutral-900 p-4 rounded">
        Loading character...
      </div>
    );
  }

  const weaponData = selectedWeapon ? getWeaponData(selectedWeapon, weaponCatsLookup) : null;

  const setMode = (mode) => {
    setRollMode(mode);
    if (pingEnabled) setPingEnabled(false);
  };

  return (
    <div className="rounded-md bg-neutral-900 border border-orange-500/30 shadow-lg">
      <div className="px-4 py-2 border-b border-orange-500/30 bg-neutral-850 flex justify-between items-center">
        <h3 className="text-sm tracking-widest text-orange-400 font-bold">
          Mode:
          {["weapon", "skill"].map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`px-2 py-1 ml-2 text-sm rounded-sm border
                ${
                  rollMode === mode
                    ? "bg-orange-500/20 border-orange-500 text-orange-400"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400"
                }`}
            >
              {mode === "weapon" ? "Weapons" : "Skills"}
            </button>
          ))}
        </h3>
      </div>

      <div className="p-4 space-y-2">
        {rollMode === "weapon" && (
          <>
            <div>
              <label className="text-xs uppercase text-neutral-500 block mb-2">
                Weapon{" "}
                {weaponData && (
                  <span className="text-xs text-neutral-500 mt-2">
                    Skill: {weaponData.class} ({getSkillLevel()})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                {[primary, secondary].map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWeapon(w)}
                    className={`px-3 py-1.5 text-sm rounded-sm border
                      ${
                        selectedWeapon === w
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}
                  >
                    {i === 0 ? "Primary" : "Secondary"}: {w?.name || "None"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase text-neutral-500 block mb-2">
                Range
              </label>
              <div className="flex gap-2">
                {["C", "M", "L", "ELR", "EELR"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1.5 text-sm rounded-sm border
                      ${
                        selectedRange === range
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}
                  >
                    {range}
                  </button>
                ))}
                <button
                  onClick={() => setPingEnabled(!pingEnabled)}
                  className={`px-3 py-1.5 text-sm rounded-sm border
                    ${
                      pingEnabled
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                    }`}
                >
                  {pingEnabled ? "Pinged (+1)" : "Ping"}
                </button>
              </div>
            </div>

            {selectedRange === "EELR" && (
              <div>
                <label className="text-xs text-neutral-500 block mb-2">
                  EELR Navigate Check
                  <span className="text-xs text-neutral-400 ml-2">
                    ≤1: -2 | 2-3: -1 | 4-5: +0 | ≥6: +1
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={navigateRoll ?? ""}
                    onChange={(e) =>
                      setNavigateRoll(
                        e.target.value === "" ? null : e.target.value,
                      )
                    }
                    onBlur={(e) => {
                      const val = e.target.value;
                      setNavigateRoll(val === "" ? null : Number(val));
                    }}
                    placeholder="Enter result"
                    className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
                  />
                  {navigateRoll !== null && navigateRoll !== "" && (
                    <span
                      className={`text-sm font-bold ${navigateMod >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {navigateMod > 0 ? "+" : ""}
                      {navigateMod}
                    </span>
                  )}
                  <button
                    onClick={() => setNavigateRoll(null)}
                    className="px-2 py-1 text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {rollMode === "skill" && (
          <div>
            <label className="text-xs uppercase text-neutral-500 block mb-1">
              Select Skill
            </label>
            <select
              value={selectedSkill || ""}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
            >
              <option value="">Select Skill</option>
              {Object.keys(skills || {}).map((skill) => (
                <option key={skill} value={skill}>
                  {skill} ({skills[skill]})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* flat modifiers */}
        <div>
          <label className="text-xs uppercase text-neutral-500 block mb-2">
            Add Modifier
          </label>
          <div className="flex gap-2 mb-3">
            <input
              value={newModValue}
              onChange={(e) => setNewModValue(e.target.value)}
              onBlur={(e) => {
                const num = Number(e.target.value);
                setNewModValue(isNaN(num) ? 0 : num);
              }}
              className="w-15 px-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
            />
            <input
              type="text"
              value={newModLabel}
              onChange={(e) => setNewModLabel(e.target.value)}
              className="flex-1 px-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
              placeholder="Reason"
            />
            <button
              onClick={addModifier}
              className="px-3 py-1 bg-orange-500/20 border border-orange-500 text-orange-400 rounded"
            >
              Add
            </button>
          </div>
          {modifiers.length > 0 && (
            <div className="space-y-1 text-xs">
              {modifiers.map((mod) => (
                <div
                  key={mod.id}
                  className="flex justify-between items-center bg-neutral-850 border border-neutral-800 px-2 rounded"
                >
                  <span className="text-neutral-400">
                    {mod.value > 0 ? "+" : ""}
                    {mod.value} [{mod.label}]
                  </span>
                  <button
                    onClick={() => removeModifier(mod.id)}
                    className="text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* dice modifiers */}
        <div>
          <label className="text-xs uppercase text-neutral-500 block mb-2">
            Add Dice
          </label>
          <div className="flex gap-2 mb-3">
            <input
              value={newDiceModValue}
              onChange={(e) => setNewDiceModValue(e.target.value)}
              onBlur={(e) => {
                const num = Number(e.target.value);
                setNewDiceModValue(isNaN(num) ? 0 : num);
              }}
              className="w-15 px-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
            />
            <input
              type="text"
              value={newDiceModLabel}
              onChange={(e) => setNewDiceModLabel(e.target.value)}
              className="flex-1 px-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
              placeholder="Reason"
            />
            <button
              onClick={addDiceModifier}
              className="px-3 py-1 bg-orange-500/20 border border-orange-500 text-orange-400 rounded"
            >
              Add
            </button>
          </div>
          {diceModifiers.length > 0 && (
            <div className="space-y-1 text-xs">
              {diceModifiers.map((mod) => (
                <div
                  key={mod.id}
                  className="flex justify-between items-center bg-neutral-850 border border-neutral-800 px-2 rounded"
                >
                  <span className="text-neutral-400">
                    {mod.value > 0 ? "+" : ""}
                    {mod.value}d [{mod.label}]
                  </span>
                  <button
                    onClick={() => removeDiceModifier(mod.id)}
                    className="text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* wounds */}
        <div>
          <label className="text-xs uppercase text-neutral-500 block mb-1">
            Wounds
          </label>
          <div className="flex gap-1 items-center text-xs text-neutral-400 border border-neutral-800 bg-neutral-850 px-3 py-2 rounded">
            <div className="flex items-center gap-2">
              <label>FW:</label>
              <button
                onClick={onDecreaseFlesh}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                -
              </button>
              <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-center">
                {fleshWounds}
              </div>
              <button
                onClick={onIncreaseFlesh}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                +
              </button>
            </div>
            <span>//</span>
            <div className="flex items-center gap-2">
              <label>DW:</label>
              <button
                onClick={onDecreaseDeep}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                -
              </button>
              <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-center">
                {deepWounds}
              </div>
              <button
                onClick={onIncreaseDeep}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <span className="text-orange-400 text-xs">
              Penalty: -{woundPenalty}
            </span>
          </div>
        </div>

        {/* final */}
        <div className="px-2 py-2 bg-black bg-[radial-gradient(circle,_rgba(255,120,0,0.05)_1px,_transparent_1px)] [background-size:8px_8px] rounded-lg p-4 border border-orange-400 hover:border-neutral-100 transition">
          <p className="text-xs text-neutral-500 uppercase mb-2">Final Roll</p>
          <p className="text-2xl font-mono text-orange-400 break-words">
            {rollExpr}
          </p>
          <div className="text-xs text-neutral-500 mt-3">
            <div>
              Dice: {effectiveDiceCount}d6
              {skillLevel <= 0 ? "l" : "k1"}
              {totalDiceChange !== 0 && (
                <span
                  className={
                    totalDiceChange > 0 ? "text-green-400" : "text-red-400"
                  }
                >
                  {" "}
                  ({baseDiceCount} base {totalDiceChange > 0 ? "+" : ""}
                  {totalDiceChange} dice)
                </span>
              )}
            </div>
            {rollMode === "weapon" && rangeMod !== 0 && (
              <div>
                Range ({selectedRange}): {rangeMod}
              </div>
            )}
            {pingEnabled && <div>Ping: +1</div>}
            {rollMode === "weapon" &&
              (selectedRange === "ELR" || selectedRange === "EELR") &&
              navigateMod !== 0 && (
                <div>
                  Navigate: {navigateMod > 0 ? "+" : ""}
                  {navigateMod}
                </div>
              )}
            {modifiers.map((mod) => (
              <div key={mod.id}>
                {mod.label}: {mod.value > 0 ? "+" : ""}
                {mod.value}
              </div>
            ))}
            {diceModifiers.map((mod) => (
              <div key={mod.id}>
                {mod.label}: {mod.value > 0 ? "+" : ""}
                {mod.value}d
              </div>
            ))}
            <div>Wounds: -{woundPenalty}</div>
          </div>
          <button
            onClick={copyToClipboard}
            className="mt-3 px-3 bg-orange-500/20 border border-orange-500 text-orange-400 rounded"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calculator;
