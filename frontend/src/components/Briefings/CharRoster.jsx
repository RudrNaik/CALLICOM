import React, { useState } from "react";
import { motion } from "framer-motion";
import equipmentData from "../../data/Equipment.json";

function getGadgetTitleById(id) {
  const match = equipmentData.find((item) => item.id === id);
  return match?.title || "None Selected";
}

function Roster({ characters, isLoading }) {
  const [hoveredChar, setHoveredChar] = useState(null);

  return (
    <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md min-h-[700px] max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
      <h2 className="uppercase text-sm text-orange-400">Operator Roster</h2>
      {isLoading ? (
        <div className="flex items-center text-xs text-orange-400 py-2 mb-2">
          <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
          Updating Operators...
        </div>
      ) : (
        <div className="text-orange-400 text-xs py-2 mb-2">Operators Live.</div>
      )}

      <div className="space-y-4 relative">
        {characters.map((char) => (
          <div
            key={char._id || char.name}
            className="
            relative  
          bg-neutral-900/90
            bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)]
            [background-size:8px_8px] 
            rounded-lg p-4 border 
          border-orange-400 
          hover:border-orange-600 group"
            onMouseEnter={() => setHoveredChar(char._id)}
            onMouseLeave={() => setHoveredChar(null)}
          >
            <p className="text-orange-300 font-semibold text-sm">
              {char.callsign} | {char.name}
            </p>
            <p className="text-xs text-neutral-300">
              {char.class} | {char.background}
            </p>

            {hoveredChar === char._id && (
              <div className="fixed left-47/80 top-1/2 transform -translate-x-1/2 -translate-y-[110%] bg-neutral-900/95 border border-orange-400 text-xs text-neutral-100 p-4 rounded-lg shadow-xl z-50 animate-flicker w-72">
                <p>
                  <span className="font-bold text-orange-400">Class:</span>{" "}
                  {char.class || "Unknown"}
                </p>
                <p>
                  <span className="font-bold text-orange-400">Armor:</span>{" "}
                  {char.equipment?.armorClass ?? "None"}
                </p>
                <p>
                  <span className="font-bold text-orange-400">Primary:</span>{" "}
                  {char.equipment?.primaryWeapon?.name || "None"}
                </p>
                <p>
                  <span className="font-bold text-orange-400">Secondary:</span>{" "}
                  {char.equipment?.secondaryWeapon?.name || "None"}
                </p>
                <p>
                  <span className="font-bold text-orange-400">Gadget:</span>{" "}
                  {getGadgetTitleById(char.equipment?.gadget)}
                </p>
                <p>
                  <span className="font-bold text-orange-400">Grenades:</span>{" "}
                  {(char.equipment?.grenades?.[0] || "-") +
                    " | " +
                    (char.equipment?.grenades?.[1] || "-")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Roster;
