import { useState, useEffect, useMemo } from "react";
import weaponCategories from "../../../data/weaponCategories.json";

function Calculator({ characterData}) {
  const [character, setCharacter] = useState(null);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [skills, setSkills] = useState(null);

  const [rollMode, setRollMode] = useState("weapon"); // weapon or skill.
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedRange, setSelectedRange] = useState("M");

  const [modifiers, setModifiers] = useState([]);
  const [newModValue, setNewModValue] = useState(0);
  const [newModLabel, setNewModLabel] = useState("");

  const [pingEnabled, setPingEnabled] = useState(false);

  useEffect(() => {
    if (characterData) {
      setCharacter(characterData);
      setPrimary(characterData?.equipment?.primaryWeapon);
      setSecondary(characterData?.equipment?.secondaryWeapon);
      setSkills(characterData?.skills);
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
    if (rollMode === "skill") {
      return skills?.[selectedSkill] ?? 0;
    }

    if (!selectedWeapon) return 0;
    const weaponData = getWeaponData(selectedWeapon);
    return skills?.[weaponData?.class] ?? 0;
  };

  const woundPenalty = useMemo(() => {
    const FW = character?.fleshWounds ?? 0;
    const DW = character?.deepWounds ?? 0;
    return FW + DW * 2;
  }, [character]);

  const totalModifierValue = useMemo(() => {
    const namedMods = modifiers.reduce((sum, m) => sum + Number(m.value), 0);
    const rangeMod = rollMode === "weapon" ? getRangeModifier() : 0;
    const ping = pingEnabled ? 1 : 0;

    return namedMods + rangeMod + ping;
  }, [modifiers, selectedWeapon, selectedRange, rollMode, pingEnabled]);

  const rollExpression = useMemo(() => {
    const skillLevel = getSkillLevel();
    const dice = skillLevel <= 0 ? ".r 2d6l" : `.r ${skillLevel}d6k1`;

    let expr = dice;
    const comments = [];

    // Add range modifier
    if (rollMode === "weapon") {
      const rangeMod = getRangeModifier();
      if (rangeMod !== 0) {
        expr += rangeMod > 0 ? ` + ${rangeMod}` : ` - ${Math.abs(rangeMod)}`;
        comments.push(`RNG ${rangeMod > 0 ? "+" : ""}${rangeMod}`);
      }
    }

    // Add ping bonus
    if (pingEnabled) {
      expr += " + 1";
      comments.push("PING +1");
    }

    // Add custom modifiers
    modifiers.forEach((mod) => {
      expr += mod.value > 0 ? ` + ${mod.value}` : ` - ${Math.abs(mod.value)}`;
      comments.push(
        `${mod.label} ${mod.value > 0 ? "+" : ""}${mod.value}`,
      );
    });

    // Add wound penalty
    if (woundPenalty > 0) {
      expr += ` - ${woundPenalty}`;
      comments.push(`WND -${woundPenalty}`);
    }

    // Add all comments with # prefix
    if (comments.length > 0) {
      expr += ` # ${comments.map((c) => `(${c})`).join(" ")}`;
    }

    return expr;
  }, [
    totalModifierValue,
    woundPenalty,
    selectedWeapon,
    selectedSkill,
    rollMode,
    modifiers,
    selectedRange,
    pingEnabled,
  ]);

  const addModifier = () => {
    if (!newModLabel.trim()) return;

    setModifiers([
      ...modifiers,
      {
        id: Date.now(),
        value: Number(newModValue),
        label: newModLabel.trim(),
      },
    ]);

    setNewModValue(0);
    setNewModLabel("");
  };

  const removeModifier = (id) => {
    setModifiers(modifiers.filter((m) => m.id !== id));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rollExpression);
  };

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
    if (pingEnabled) {
      setPingEnabled(!pingEnabled);
    }
  };

  return (
    <div className="rounded-md bg-neutral-900 border border-orange-500/30 shadow-lg">
      <div className="px-4 py-2 border-b border-orange-500/30 bg-neutral-850 flex justify-between items-center">
        <h3 className="text-sm tracking-widest text-orange-400 font-bold">
          Mode:
          {/* mode toggle */}
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
        {/* weapon */}
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
          </>
        )}

        {/* skill */}
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

        {/* modifiers */}
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

        {/* wounds */}
        <div className="flex justify-left text-xs text-neutral-400 border border-neutral-800 bg-neutral-850 px-3 py-3 rounded">
          <span>FW: {character.fleshWounds || 0} // </span>
          <span>DW: {character.deepWounds || 0} // </span>
          <span className="text-orange-400">Penalty: -{woundPenalty}</span>
        </div>

        {/* final */}
        <div className="px-2 py-2 bg-black border border-orange-500/40 rounded-md">
          <p className="text-xs text-neutral-500 uppercase mb-2">Final Roll</p>

          <p className="text-2xl font-mono text-orange-400 break-words">
            {rollExpression}
          </p>

          <div className="text-xs text-neutral-500 mt-3">
            <div>
              Dice: {getSkillLevel() <= 0 ? "2d6l" : `${getSkillLevel()}d6k1`}
            </div>
            {rollMode === "weapon" && getRangeModifier() !== 0 && (
              <div>
                Range ({selectedRange}): {getRangeModifier()}
              </div>
            )}
            {pingEnabled && <div>Ping: +1</div>}
            {modifiers.map((mod) => (
              <div key={mod.id}>
                {mod.label}: {mod.value > 0 ? "+" : ""}
                {mod.value}
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
