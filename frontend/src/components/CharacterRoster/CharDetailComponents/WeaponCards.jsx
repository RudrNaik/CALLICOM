import { useState, useEffect } from "react";
import "../../../assets/css/ammoBlur.css";

const WeaponSlot = ({
  slot,
  weapon,
  isEditing,
  weaponCategories,
  handleWeaponChange,
  characterCallsign,
  charActive,
  isSecondary
}) => {
  const categoryData = weaponCategories[weapon?.category];
  const localStorageKey = `ammo_${characterCallsign}_${slot}`;

  const [firedThisMag, setFiredThisMag] = useState(0);
  const [totalFired, setTotalFired] = useState(0);
  const [pseudoAmmo, setPseudoAmmo] = useState(null);
  const [displayedAmmo, setDisplayedAmmo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const pseudoMagSizes = {
    "Light Pistols": 12,
    "Heavy Pistols": 6,
    SMGs: 20,
    Carbines: 30,
    "Assault Rifles": 30,
    "Marksman Rifles": 10,
    Shotguns: 8,
    "Drum Shotguns": 20,
    "Sniper Rifles": 5,
    "Machine Guns": 100,
  };

  // Load from localStorage on weapon load
  useEffect(() => {
    const initial = pseudoMagSizes[weapon?.category] || null;
    setPseudoAmmo(initial);
    setDisplayedAmmo(initial);

    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        const { firedThisMag, totalFired, pseudoAmmo } = JSON.parse(saved);
        setFiredThisMag(firedThisMag ?? 0);
        setTotalFired(totalFired ?? 0);
        setPseudoAmmo(pseudoAmmo ?? initial);
        setDisplayedAmmo(pseudoAmmo ?? initial);
      } catch (e) {
        console.error("Ammo state parse error:", e);
      }
    } else {
      setFiredThisMag(0);
      setTotalFired(0);
    }
  }, [weapon?.category, localStorageKey]);

  // Persist to localStorage
  useEffect(() => {
    if (!charActive) return;

    const ammoState = { firedThisMag, totalFired, pseudoAmmo };
    localStorage.setItem(localStorageKey, JSON.stringify(ammoState));
  }, [firedThisMag, totalFired, pseudoAmmo, charActive]);

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

  let reserveAmmo;
  let magSize;
  if((weapon?.category == "SMGs") && (isSecondary)){
    reserveAmmo = 4;
    magSize = 2;
  } else {
    reserveAmmo = categoryData?.totalTurns || 0
    magSize = categoryData?.magazineSize || 1;
  }
  const totalTurns = reserveAmmo;
  const magazineSize = magSize;
  const turnsRemaining = totalTurns - totalFired;
  const magTurnsLeft = Math.max(0, magazineSize - firedThisMag);

  const handleFire = () => {
    if (isAnimating) return;

    if (turnsRemaining > 0 && magTurnsLeft > 0) {
      setFiredThisMag((prev) => prev + 1);
      setTotalFired((prev) => prev + 1);

      if (pseudoAmmo !== null) {
        const fullRounds = pseudoMagSizes[weapon?.category] || 1;
        let reduction = 1;
        if (fullRounds !== 5) {
          const expectedPerTurn = fullRounds / magazineSize;
          const variance = Math.max(1, Math.floor(expectedPerTurn * 0.5));
          reduction = Math.floor(
            expectedPerTurn + (Math.random() * variance - variance / 2)
          );
        }

        setPseudoAmmo((prev) =>
          firedThisMag + 1 >= magazineSize ? 0 : Math.max(0, prev - reduction)
        );
      }
    }
  };

  const handleResupply = () => {
    setFiredThisMag(0);
    setTotalFired(0);
    setPseudoAmmo(pseudoMagSizes[weapon?.category] || null);
    localStorage.removeItem(localStorageKey); // optional
  };

  const handleReload = () => {
    const refillTurns = Math.min(magazineSize, turnsRemaining);
    setFiredThisMag(magazineSize - refillTurns);

    const fullRounds = pseudoMagSizes[weapon?.category] || 0;
    if (refillTurns === magazineSize) {
      setPseudoAmmo(fullRounds);
    } else {
      const ratio = refillTurns / magazineSize;
      const estimatedRounds = Math.floor(fullRounds * ratio);
      const variance = Math.floor(estimatedRounds * 0.1);
      const randomized = Math.max(
        0,
        estimatedRounds +
          Math.floor(Math.random() * (2 * variance + 1)) -
          variance
      );
      setPseudoAmmo(randomized);
    }
  };

  return (
    <div
      key={`${slot}-${characterCallsign}`}
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

          {categoryData && (
            <div className="text-sm text-gray-400 bg-neutral-900 p-2 rounded">
              <div>Class: {categoryData.class}</div>
              <div>Damage: {categoryData.damage}</div>
              <div>Penetration: {categoryData.penetration}</div>
              <div>Range: {categoryData.range}</div>
              <div>Total Ammo (Turns): {categoryData.totalTurns}</div>
              <div>Magazine Size (Turns): {categoryData.magazineSize}</div>
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
                DMG {categoryData.damage} | PEN {categoryData.penetration} |
                Range: {categoryData.range} | <br></br> Class:{" "}
                <strong>{categoryData.class}</strong>
                <hr />
                TOTAL: {totalTurns} turns | MAG: {magazineSize} turns
              </div>
              {charActive && (
                <div className="flex justify-left items-start gap-5 mt-2">
                  {/* Left: Counters + Buttons stacked vertically */}
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
