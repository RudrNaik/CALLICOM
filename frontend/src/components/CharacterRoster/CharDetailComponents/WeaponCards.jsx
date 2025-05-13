import React from "react";

const WeaponSlot = ({
  slot,
  weapon,
  isEditing,
  weaponCategories,
  handleWeaponChange,
  characterCallsign,
}) => {
  const categoryData = weaponCategories[weapon?.category];

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
            onChange={(e) => handleWeaponChange(slot, "category", e.target.value)}
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
              <div>Capacity: {categoryData.capacity}</div>
              <div>Ammo/Action: {categoryData.ammoPerAction}</div>
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
            <p className="text-xs text-gray-400 mt-1">
              DMG {categoryData.damage} | PEN {categoryData.penetration} | Range:{" "}
              {categoryData.range}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default WeaponSlot;
