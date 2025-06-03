import { useState, useEffect } from "react";
import "../../../assets/css/ammoBlur.css";

const WeaponSlot = ({
  slot,
  weapon,
  isEditing,
  weaponCategories,
  handleWeaponChange,
  characterCallsign,
}) => {
  const charActive = true;

  const categoryData = weaponCategories[weapon?.category];

  const [firedThisMag, setFiredThisMag] = useState(0);
  const [totalFired, setTotalFired] = useState(0);
  const [pseudoAmmo, setPseudoAmmo] = useState(null);
  const [displayedAmmo, setDisplayedAmmo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const pseudoMagSizes = {
    "Light Pistols": 12,
    "Heavy Pistols": 6,
    SMGs: 30,
    Carbines: 30,
    "Assault Rifles": 30,
    "Marksman Rifles": 20,
    Shotguns: 8,
    "Drum Shotguns": 20,
    "Sniper Rifles": 5,
    "Machine Guns": 100,
  };

  useEffect(() => {
    setFiredThisMag(0);
    setTotalFired(0);
    const initial = pseudoMagSizes[weapon?.category] || null;
    setPseudoAmmo(initial);
    setDisplayedAmmo(initial);
  }, [weapon?.category]);

  useEffect(() => {
    if (pseudoAmmo === null || displayedAmmo === null) {
      setDisplayedAmmo(pseudoAmmo);
      return;
    }

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
      }, 40); // adjust speed here
    }
  }, [pseudoAmmo]);

  const totalTurns = categoryData?.totalTurns || 0;
  const magazineSize = categoryData?.magazineSize || 1;

  const turnsRemaining = totalTurns - totalFired;
  const magTurnsLeft = Math.max(0, magazineSize - firedThisMag);

  const handleFire = () => {
    if (turnsRemaining > 0 && magTurnsLeft > 0) {
      setFiredThisMag((prev) => prev + 1);
      setTotalFired((prev) => prev + 1);

      // Subtract pseudo rounds if they exist
      if (pseudoAmmo !== null) {
        const expectedPerTurn =
          (pseudoMagSizes[weapon?.category] || 1) / magazineSize;
        const variance = Math.max(1, Math.floor(expectedPerTurn * 0.5));
        const randomReduction = Math.floor(
          expectedPerTurn + (Math.random() * variance - variance / 2)
        );

        setPseudoAmmo((prev) =>
          firedThisMag + 1 >= magazineSize
            ? 0 // last turn in mag
            : Math.max(0, prev - randomReduction)
        );
      }
    }
  };

  const handleResupply = () => {
    setFiredThisMag(0);
    setTotalFired(0);
    setPseudoAmmo(pseudoMagSizes[weapon?.category] || null);
  };

  const handleReload = () => {
    const refillTurns = Math.min(magazineSize, turnsRemaining);
    setFiredThisMag(magazineSize - refillTurns);

    const fullRounds = pseudoMagSizes[weapon?.category] || 0;

    if (refillTurns === magazineSize) {
      // Full refill: reset to full ammo count
      setPseudoAmmo(fullRounds);
    } else {
      // Partial refill: randomize around proportional fill
      const ratio = refillTurns / magazineSize;
      const estimatedRounds = Math.floor(fullRounds * ratio);

      const variance = Math.floor(estimatedRounds * 0.1); // ±10%
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
      className="bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow"
    >
      <h3 className="font-semibold text-orange-300 mb-2">
        {slot === "primaryWeapon" ? "Primary Weapon" : "Secondary Weapon"}
      </h3>

      {isEditing ? (
        <>
          <input
            className="w-full bg-neutral-900 text-white p-2 rounded mb-2"
            placeholder="Weapon Name"
            value={weapon?.name || ""}
            onChange={(e) => handleWeaponChange(slot, "name", e.target.value)}
          />
          <select
            className="w-full bg-neutral-900 text-white p-2 rounded mb-2"
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
              <p className="text-xs text-gray-400 mt-1">
                DMG {categoryData.damage} | PEN {categoryData.penetration} |
                Range: {categoryData.range}
                <hr />
                TOTAL: {totalTurns} turns | MAG: {magazineSize} turns
              </p>
              {charActive && (
                <div className="flex justify-around items-start gap-5 mt-2">
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
                        disabled={turnsRemaining === 0 || magTurnsLeft === 0}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40"
                      >
                        Fire
                      </button>
                      <button
                        onClick={handleReload}
                        disabled={firedThisMag === 0 || turnsRemaining === 0}
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
