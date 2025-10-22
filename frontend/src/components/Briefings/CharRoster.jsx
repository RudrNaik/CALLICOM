import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import CharacterSheetModal from "././CharStatModal";
import equipmentData from "../../data/Equipment.json";

function getGadgetTitleById(id) {
  const match = equipmentData.find((item) => item.id === id);
  return match?.title || "None Selected";
}

const POPOUT_W = 288;
const POPOUT_H_GUESS = 180;
const CURSOR_OFFSET_Y = 12;

export default function Roster({ characters, isLoading }) {
  const [hoveredChar, setHoveredChar] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    if (rafRef.current) return;
    const { clientX, clientY } = e;
    rafRef.current = requestAnimationFrame(() => {
      setCursorPos({ x: clientX, y: clientY });
      rafRef.current = null;
    });
  };

  const clampPopout = () => {
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    let left = cursorPos.x;
    let top = cursorPos.y - CURSOR_OFFSET_Y;
    left = Math.max(POPOUT_W / 2 + 8, Math.min(vw - POPOUT_W / 2 - 8, left));
    top = Math.max(POPOUT_H_GUESS + 8, Math.min(vh - 8, top));
    return { left, top };
  };
  const popoutPos = clampPopout();

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border border-orange-500 rounded-sm p-6 shadow-lg min-w-sm sm:max-w-full md:max-w-md min-h-[700px] max-h-[700px] overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
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
            className="relative bg-neutral-900/90 bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)] [background-size:8px_8px] rounded-lg p-4 border border-orange-400 hover:border-orange-600 group cursor-pointer"
            onMouseEnter={() => setHoveredChar(char._id)}
            onMouseLeave={() => setHoveredChar(null)}
            onMouseMove={handleMouseMove}
            onClick={() => setSelectedChar(char)}
          >
            <p className="text-orange-300 font-semibold text-sm">
              {char.callsign} | {char.name}
            </p>
            <p className="absolute top-2 right-3 text-orange-300 text-[0.60rem]">
              {char.userId}
            </p>
            <p className="text-xs text-neutral-300">
              {char.class} | {char.multiClass || "No multiclass"} |{" "}
              {char.background}
            </p>

            {hoveredChar === char._id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.08 }}
                className="fixed w-72 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-neutral-900/95 border border-orange-400 text-xs text-neutral-100 p-4 rounded-lg shadow-xl z-50"
                style={{
                  left: `${popoutPos.left}px`,
                  top: `${popoutPos.top}px`,
                }}
              >
                <p>
                  <span className="font-bold text-orange-400">Class:</span>{" "}
                  {char.class || "Unknown"} | {char.multiClass || "N/A"}
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
                  {char.equipment?.grenades?.[0] || "-"} |{" "}
                  {char.equipment?.grenades?.[1] || "-"}
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <CharacterSheetModal
        open={!!selectedChar}
        char={selectedChar}
        onClose={() => setSelectedChar(null)}
      />
    </div>
  );
}
