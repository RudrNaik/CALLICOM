import { useState, useEffect } from "react";
import "../../../assets/css/ammoBlur.css";
import {
  applyModifiers,
  pseudoMagSizes,
  getWeaponAmmoCapacity,
  computeFireResult,
  resupplyWeaponAmmo,
  computeReloadResult,
} from "../../../engine/weaponEngine";

const WeaponSlot = ({
  slot,
  weapon,
  isEditing,
  weaponCategories,
  handleWeaponChange,
  onAmmoChange,
  characterId,
  charActive,
  isSecondary,
}) => {
  const categoryData = weaponCategories[weapon?.category];

  const [firedThisMag, setFiredThisMag] = useState(0);
  const [totalFired, setTotalFired] = useState(0);
  const [pseudoAmmo, setPseudoAmmo] = useState(null);
  const [displayedAmmo, setDisplayedAmmo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);

  // Load ammo from the character's weapon slot on weapon load
  useEffect(() => {
    const initial = pseudoMagSizes[weapon?.category] || null;
    setPseudoAmmo(initial);
    setDisplayedAmmo(initial);

    // Initialize family from weapon data if it's present
    if (weapon?.family) {
      setSelectedFamily(weapon.family);
    } else {
      setSelectedFamily(null);
    }

    if (weapon?.ammo) {
      const { firedThisMag, totalFired, pseudoAmmo } = weapon.ammo;
      setFiredThisMag(firedThisMag ?? 0);
      setTotalFired(totalFired ?? 0);
      setPseudoAmmo(pseudoAmmo ?? initial);
      setDisplayedAmmo(pseudoAmmo ?? initial);
    } else {
      setFiredThisMag(0);
      setTotalFired(0);
    }
  }, [weapon?.category, weapon?.family, characterId, slot]);

  // Sync family selection to Equipment View
  useEffect(() => {
    if (isEditing && selectedFamily) {
      handleWeaponChange(slot, "family", selectedFamily);
    }
  }, [selectedFamily, isEditing, slot, handleWeaponChange]);

  // Force Machine Pistols for secondary SMGs
  useEffect(() => {
    if (
      weapon?.category === "SMGs" &&
      isSecondary &&
      isEditing &&
      selectedFamily !== "Machine Pistols"
    ) {
      setSelectedFamily("Machine Pistols");
      handleWeaponChange(slot, "family", "Machine Pistols");
    }
  }, [weapon?.category, isSecondary, isEditing, slot, handleWeaponChange]);

  useEffect(() => {
    if (pseudoAmmo === null || displayedAmmo === null) return;

    if (pseudoAmmo !== displayedAmmo) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setDisplayedAmmo((prev) => {
          if (prev === pseudoAmmo) {
            clearInterval(interval);
            setIsAnimating(false);
            return prev;
          }
          const step = prev > pseudoAmmo ? -1 : 1;
          return prev + step;
        });
      }, 20);

      return () => clearInterval(interval);
    }
  }, [pseudoAmmo]);

  const selectedFamilyData =
    selectedFamily && categoryData?.families
      ? categoryData.families.find((f) => f.family === selectedFamily)
      : null;

  const modifiedCategoryData = selectedFamilyData
    ? applyModifiers(categoryData, selectedFamilyData.modifiers)
    : categoryData;

  const { totalTurns, magazineSize } = getWeaponAmmoCapacity(
    weapon,
    categoryData,
    weaponCategories,
    selectedFamily,
    isSecondary,
  );
  const turnsRemaining = totalTurns - totalFired;
  const magTurnsLeft = Math.max(0, magazineSize - firedThisMag);

  const pushAmmo = (next) => {
    if (!charActive) return;
    onAmmoChange?.(slot, next);
  };

  const handleFire = () => {
    if (isAnimating) return;

    const result = computeFireResult({
      firedThisMag,
      totalFired,
      pseudoAmmo,
      magazineSize,
      totalTurns,
      category: weapon?.category,
    });
    if (!result) return;

    const { firedThisMag: nextFiredThisMag, totalFired: nextTotalFired, pseudoAmmo: nextPseudoAmmo } = result;
    setFiredThisMag(nextFiredThisMag);
    setTotalFired(nextTotalFired);
    if (pseudoAmmo !== null) {
      setPseudoAmmo(nextPseudoAmmo);
    }

    pushAmmo({
      firedThisMag: nextFiredThisMag,
      totalFired: nextTotalFired,
      pseudoAmmo: nextPseudoAmmo,
    });
  };

  const handleResupply = () => {
    const { firedThisMag: nextFiredThisMag, totalFired: nextTotalFired, pseudoAmmo: nextPseudoAmmo } =
      resupplyWeaponAmmo(weapon?.category);
    setFiredThisMag(nextFiredThisMag);
    setTotalFired(nextTotalFired);
    setPseudoAmmo(nextPseudoAmmo);

    pushAmmo({ firedThisMag: nextFiredThisMag, totalFired: nextTotalFired, pseudoAmmo: nextPseudoAmmo });
  };

  const handleReload = () => {
    const { firedThisMag: nextFiredThisMag, pseudoAmmo: nextPseudoAmmo } = computeReloadResult({
      firedThisMag,
      turnsRemaining,
      magazineSize,
      category: weapon?.category,
    });
    setFiredThisMag(nextFiredThisMag);
    setPseudoAmmo(nextPseudoAmmo);

    pushAmmo({
      firedThisMag: nextFiredThisMag,
      totalFired,
      pseudoAmmo: nextPseudoAmmo,
    });
  };

  return (
    <div
      key={`${slot}-${characterId}`}
      className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-4 lg:p-6 rounded shadow mt-2"
    >
      <h3 className="font-semibold text-orange-300 mb-2">
        {slot === "primaryWeapon" ? "Primary Weapon" : "Secondary Weapon"}
      </h3>

      {isEditing ? (
        <>
          <input
            className="w-full bg-neutral-900 text-white p-2 border-1 border-orange-400/60 rounded mb-2"
            placeholder="Weapon Name"
            value={weapon?.name || ""}
            onChange={(e) => handleWeaponChange(slot, "name", e.target.value)}
          />
          <select
            className="w-full select-themed p-2 rounded mb-2"
            value={weapon?.category || ""}
            onChange={(e) =>
              handleWeaponChange(slot, "category", e.target.value)
            }
          >
            <option value="">Select Weapon Category</option>
            {Object.keys(weaponCategories).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {categoryData?.families && categoryData.families.length > 0 && (
            <>
              {weapon?.category === "SMGs" && isSecondary ? (
                <>
                  <select
                    className="w-full select-themed p-2 rounded mb-2"
                    value={selectedFamily || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setSelectedFamily(value);
                      handleWeaponChange(slot, "family", value);
                    }}
                  >
                    {categoryData.families
                      .filter((family) => family.family === "Machine Pistols")
                      .map((family) => (
                        <option key={family.family} value={family.family}>
                          {family.family}
                        </option>
                      ))}
                  </select>
                </>
              ) : (
                <select
                  className="w-full select-themed p-2 rounded mb-2"
                  value={selectedFamily || ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setSelectedFamily(value);
                    handleWeaponChange(slot, "family", value);
                  }}
                >
                  <option value="">Default</option>
                  {categoryData.families.map((family) => (
                    <option key={family.family} value={family.family}>
                      {family.family}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {categoryData && (
            <div className="text-xs text-gray-400 bg-neutral-900 p-2 rounded">
              <div>Class: {categoryData.class}</div>
              <div>Damage: {categoryData.damage}</div>
              <div>Penetration: {categoryData.penetration}</div>
              <div>Range: {categoryData.range}</div>
              <div>Total Ammo (Turns): {categoryData.totalTurns}</div>
              <div>Magazine Size (Turns): {categoryData.magazineSize}</div>
              {selectedFamily && categoryData?.families && (
                <div >
                  <div>------------------</div>
                  <div>Family: {selectedFamily}</div>
                  <div className="text-gray-400 mt-1">
                    {
                      categoryData.families.find(
                        (f) => f.family === selectedFamily,
                      )?.effect
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <p>
            <strong className="text-orange-300">{weapon?.name}</strong> —{" "}
            {weapon?.category || "No category selected"}
          </p>
          {categoryData && (
            <>
              <div className="text-xs text-gray-400 mt-1">
                DMG {modifiedCategoryData.damage} | PEN{" "}
                {modifiedCategoryData.penetration} | Range:{" "}
                {modifiedCategoryData.range} | <br></br> Class:{" "}
                <strong>{modifiedCategoryData.class}</strong>
                {selectedFamily && categoryData?.families && (
                <div>
                  Family: <strong>{selectedFamily}</strong>
                  <div>
                    {
                      categoryData.families.find(
                        (f) => f.family === selectedFamily,
                      )?.effect
                    }
                  </div>
                </div>
              )}
                <hr />
                TOTAL: {totalTurns} turns | MAG: {magazineSize} turns
              </div>

              {charActive && (
                <div className="flex justify-left items-start gap-5 mt-2">
                  {/* Left: Counters + Buttons */}
                  <div className="flex flex-col">
                    <div className="text-xs text-white">
                      Remaining Ammo: {turnsRemaining} turns
                      <br />
                      Mag Remaining: {magTurnsLeft}/{magazineSize}
                    </div>

                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={handleFire}
                        disabled={
                          isAnimating ||
                          turnsRemaining === 0 ||
                          magTurnsLeft === 0
                        }
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40"
                      >
                        Fire
                      </button>
                      <button
                        onClick={handleReload}
                        disabled={
                          firedThisMag === 0 ||
                          turnsRemaining === 0 ||
                          turnsRemaining === magTurnsLeft
                        }
                        className="bg-neutral-700 hover:bg-neutral-600 text-white px-2 py-1 rounded disabled:opacity-40"
                      >
                        Reload
                      </button>
                      <button
                        onClick={handleResupply}
                        className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded"
                      >
                        Resupply
                      </button>
                    </div>
                  </div>

                  {/* Right: Pseudo Ammo Readout */}
                  {displayedAmmo !== null && (
                    <div className="text-2xl px-2 py-1 rounded bg-neutral-900 text-yellow-400 shadow">
                      <span
                        className={`${
                          isAnimating ? "motion-blur-vertical" : ""
                        } transition-all duration-200`}
                      >
                        {displayedAmmo}
                      </span>{" "}
                      / {pseudoMagSizes[weapon?.category]}
                      <div className="text-[10px] text-gray-400 italic">
                        rounds
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WeaponSlot;
