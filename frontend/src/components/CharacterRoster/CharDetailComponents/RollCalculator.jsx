import { useState, useEffect, useMemo } from "react";
import weaponCategories from "../../../data/weaponCategories.json";

function Calculator({ characterData }) {
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

  const [pingEnabled, setPingEnabled] = useState(false);
  const [fleshWounds, setFleshWounds] = useState(0);
  const [deepWounds, setDeepWounds] = useState(0);
  const [navigateRoll, setNavigateRoll] = useState(null);

  useEffect(() => {
    if (characterData) {
      setCharacter(characterData);
      setPrimary(characterData?.equipment?.primaryWeapon);
      setSecondary(characterData?.equipment?.secondaryWeapon);
      setSkills(characterData?.skills);
      setFleshWounds(characterData?.fleshWounds ?? 0);
      setDeepWounds(characterData?.deepWounds ?? 0);
    }
  }, [characterData]);

  const getWeaponData = (weapon) => {
    if (!weapon?.category) return null;
    return weaponCategories[weapon.category] || null;
  };

  const parseRangeProfile = (rangeString) => {
    const profile = {};
    if (!rangeString) return profile;
    rangeString.split("|").forEach((part) => {
      const match = part.trim().match(/([+-]?\d+)\s*(C|M|L|ELR|Bipod)/i);
      if (!match) return;
      const [, value, band] = match;
      profile[band.toUpperCase()] = Number(value);
    });
    return profile;
  };

  const getRangeModifier = () => {
    if (!selectedWeapon) return 0;
    const weaponData = getWeaponData(selectedWeapon);
    if (!weaponData?.range) return 0;
    const profile = parseRangeProfile(weaponData.range);
    if (selectedRange === "EELR") return profile.ELR ?? 0;
    return profile[selectedRange] ?? 0;
  };

  const getSkillLevel = () => {
    if (rollMode === "skill") return skills?.[selectedSkill] ?? 0;
    if (!selectedWeapon) return 0;
    const weaponData = getWeaponData(selectedWeapon);
    return skills?.[weaponData?.class] ?? 0;
  };

  const getNavigateModifier = () => {
    if (navigateRoll === null || navigateRoll === "") return 0;
    const roll = Number(navigateRoll);
    if (roll <= 1) return -2;
    if (roll <= 3) return -1;
    if (roll <= 5) return 0;
    if (roll >= 6) return 1;
    return 0;
  };

  const woundPenalty = useMemo(() => {
    return fleshWounds + deepWounds * 2;
  }, [fleshWounds, deepWounds]);

  const totalDiceChange = useMemo(() => {
    return diceModifiers.reduce((sum, m) => sum + Number(m.value), 0);
  }, [diceModifiers]);

  const getBaseDiceCount = () => {
    const skillLevel = getSkillLevel();
    return skillLevel <= 0 ? 2 : skillLevel;
  };

  const getEffectiveDiceCount = () => {
    const skillLevel = getSkillLevel();
    const min = skillLevel <= 0 ? 2 : 0;
    return Math.max(min, getBaseDiceCount() + totalDiceChange);
  };

  const totalModifierValue = useMemo(() => {
    const namedMods = modifiers.reduce((sum, m) => sum + Number(m.value), 0);
    const rangeMod = rollMode === "weapon" ? getRangeModifier() : 0;
    const ping = pingEnabled ? 1 : 0;
    const navigate =
      rollMode === "weapon" &&
      (selectedRange === "ELR" || selectedRange === "EELR")
        ? getNavigateModifier()
        : 0;
    return namedMods + rangeMod + ping + navigate;
  }, [
    modifiers,
    selectedWeapon,
    selectedRange,
    rollMode,
    pingEnabled,
    navigateRoll,
  ]);

  const rollExpression = useMemo(() => {
    const skillLevel = getSkillLevel();
    const effectiveCount = getEffectiveDiceCount();
    // Unskilled = take-lower; skilled = keep-highest
    const dice =
      skillLevel <= 0 ? `.r ${effectiveCount}d6l` : `.r ${effectiveCount}d6k1`;

    let expr = dice;
    const comments = [];

    if (rollMode === "weapon") {
      const rangeMod = getRangeModifier();
      if (rangeMod !== 0) {
        expr += rangeMod > 0 ? ` + ${rangeMod}` : ` - ${Math.abs(rangeMod)}`;
        comments.push(`RNG ${rangeMod > 0 ? "+" : ""}${rangeMod}`);
      }
    }

    if (
      rollMode === "weapon" &&
      (selectedRange === "ELR" || selectedRange === "EELR")
    ) {
      const navMod = getNavigateModifier();
      if (navMod !== 0) {
        expr += navMod > 0 ? ` + ${navMod}` : ` - ${Math.abs(navMod)}`;
        comments.push(`NAV ${navMod > 0 ? "+" : ""}${navMod}`);
      }
    }

    if (pingEnabled) {
      expr += " + 1";
      comments.push("PING +1");
    }

    modifiers.forEach((mod) => {
      expr += mod.value > 0 ? ` + ${mod.value}` : ` - ${Math.abs(mod.value)}`;
      comments.push(`${mod.label} ${mod.value > 0 ? "+" : ""}${mod.value}`);
    });

    diceModifiers.forEach((mod) => {
      comments.push(`${mod.label} ${mod.value > 0 ? "+" : ""}${mod.value}d`);
    });

    if (woundPenalty > 0) {
      expr += ` - ${woundPenalty}`;
      comments.push(`WND -${woundPenalty}`);
    }

    if (comments.length > 0) {
      expr += ` # ${comments.map((c) => `(${c})`).join(" ")}`;
    }

    return expr;
  }, [
    totalModifierValue,
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

  const copyToClipboard = () => navigator.clipboard.writeText(rollExpression);

  if (!character) {
    return (
      <div className="border border-orange-500/30 bg-neutral-900 p-4 rounded">
        Loading character...
      </div>
    );
  }

  const weaponData = selectedWeapon ? getWeaponData(selectedWeapon) : null;

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
                      className={`text-sm font-bold ${getNavigateModifier() >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {getNavigateModifier() > 0 ? "+" : ""}
                      {getNavigateModifier()}
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
                onClick={() => setFleshWounds(Math.max(0, fleshWounds - 1))}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                -
              </button>
              <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-center">
                {fleshWounds}
              </div>
              <button
                onClick={() => setFleshWounds(fleshWounds + 1)}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                +
              </button>
            </div>
            <span>//</span>
            <div className="flex items-center gap-2">
              <label>DW:</label>
              <button
                onClick={() => setDeepWounds(Math.max(0, deepWounds - 1))}
                className="px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded hover:bg-neutral-700"
              >
                -
              </button>
              <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-center">
                {deepWounds}
              </div>
              <button
                onClick={() => setDeepWounds(deepWounds + 1)}
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
            {rollExpression}
          </p>
          <div className="text-xs text-neutral-500 mt-3">
            <div>
              Dice: {getEffectiveDiceCount()}d6
              {getSkillLevel() <= 0 ? "l" : "k1"}
              {totalDiceChange !== 0 && (
                <span
                  className={
                    totalDiceChange > 0 ? "text-green-400" : "text-red-400"
                  }
                >
                  {" "}
                  ({getBaseDiceCount()} base {totalDiceChange > 0 ? "+" : ""}
                  {totalDiceChange} dice)
                </span>
              )}
            </div>
            {rollMode === "weapon" && getRangeModifier() !== 0 && (
              <div>
                Range ({selectedRange}): {getRangeModifier()}
              </div>
            )}
            {pingEnabled && <div>Ping: +1</div>}
            {rollMode === "weapon" &&
              (selectedRange === "ELR" || selectedRange === "EELR") &&
              getNavigateModifier() !== 0 && (
                <div>
                  Navigate: {getNavigateModifier() > 0 ? "+" : ""}
                  {getNavigateModifier()}
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
