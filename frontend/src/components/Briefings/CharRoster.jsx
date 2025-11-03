import React, { useState, useRef, useMemo, useEffect } from "react";
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

function Highlight({ text, terms }) {
  if (!terms.length || !text) return <>{text}</>;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(" + terms.map(esc).join("|") + ")", "ig");
  const parts = String(text).split(re);
  return (
    <>
      {parts.map((p, i) =>
        terms.some((t) => p.toLowerCase() === t.toLowerCase()) ? (
          <mark
            key={i}
            className="bg-orange-500/20 text-orange-300 rounded px-0.5"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function parseQuery(q) {
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  const filters = { user: [], class: [], bg: [] };
  const terms = [];
  for (const t of tokens) {
    if (t.startsWith("@")) {
      filters.user.push(t.slice(1));
    } else if (/^user:/i.test(t)) {
      filters.user.push(t.split(":")[1] || "");
    } else if (/^class:/i.test(t)) {
      filters.class.push(t.split(":")[1] || "");
    } else if (/^(bg|background):/i.test(t)) {
      filters.bg.push(t.split(":")[1] || "");
    } else {
      terms.push(t);
    }
  }
  return { terms, filters };
}

/* --- normalize string helper --- */
const norm = (v) => String(v || "").toLowerCase();

export default function Roster({ characters, isLoading }) {
  const [hoveredChar, setHoveredChar] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const { terms, filters } = useMemo(() => parseQuery(debounced), [debounced]);

  const filtered = useMemo(() => {
    if (!characters) return [];
    const tnorm = terms.map(norm).filter(Boolean);
    const funion = {
      user: filters.user.map(norm).filter(Boolean),
      class: filters.class.map(norm).filter(Boolean),
      bg: filters.bg.map(norm).filter(Boolean),
    };

    return characters.filter((c) => {
      const name = norm(c.name);
      const callsign = norm(c.callsign);
      const userId = norm(c.userId);
      const cls = norm(c.class);
      const mcls = norm(c.multiClass);
      const bg = norm(c.background);

      const freeOk =
        tnorm.length === 0 ||
        tnorm.every(
          (t) =>
            name.includes(t) ||
            callsign.includes(t) ||
            userId.includes(t) ||
            cls.includes(t) ||
            mcls.includes(t) ||
            bg.includes(t)
        );

      const userOk = funion.user.length
        ? funion.user.some((u) => userId.includes(u))
        : true;

      const classOk = funion.class.length
        ? funion.class.some((u) => cls.includes(u) || mcls.includes(u))
        : true;

      const bgOk = funion.bg.length
        ? funion.bg.some((u) => bg.includes(u))
        : true;

      return freeOk && userOk && classOk && bgOk;
    });
  }, [characters, terms, filters]);

  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border border-orange-500 rounded-sm p-6 shadow-lg min-w-sm sm:max-w-full md:max-w-md min-h-[700px] max-h-[700px] overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700">
      <h2 className="uppercase text-sm text-orange-400">Operator Roster</h2>
      <div className="flex items-center gap-2 mb-3">
        <div className="">
          <div className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player/callsign"
              className="w-72 bg-neutral-900 border border-orange-500/60 rounded px-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center text-xs text-orange-400 py-2 mb-2">
          <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
          Updating Operators...
        </div>
      ) : (
        <div className="text-orange-400 text-xs py-2 mb-2">
          Operators Live.
          <span className="text-xs text-neutral-400">
            {isLoading
              ? "Updating…"
              : `${filtered.length}/${characters?.length ?? 0}`}
          </span>
        </div>
      )}

      <div className="space-y-4 relative">
        {filtered.map((char) => (
          <div
            key={char._id || char.name}
            className="relative bg-neutral-900/90 bg-[radial-gradient(circle,_rgba(255,100,0,0.06)_1px,_transparent_1px)] [background-size:8px_8px] rounded-lg p-4 border border-orange-400 hover:border-orange-600 group cursor-pointer"
            onMouseEnter={() => setHoveredChar(char._id)}
            onMouseLeave={() => setHoveredChar(null)}
            onMouseMove={handleMouseMove}
            onClick={() => setSelectedChar(char)}
          >
            <p className="text-orange-300 font-semibold text-sm">
              <Highlight
                text={`${char.callsign} | ${char.name}`}
                terms={terms}
              />
            </p>
            <p className="absolute top-2 right-3 text-orange-300 text-[0.60rem]">
              <Highlight text={char.userId} terms={terms} />
            </p>
            <p className="text-xs text-neutral-300">
              <Highlight
                text={`${char.class} | ${
                  char.multiClass || "No multiclass"
                } | ${char.background}`}
                terms={terms}
              />
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

        {!isLoading && filtered.length === 0 && (
          <div className="text-xs text-neutral-400">
            No operators match your search.
          </div>
        )}
      </div>

      <CharacterSheetModal
        open={!!selectedChar}
        char={selectedChar}
        onClose={() => setSelectedChar(null)}
      />
    </div>
  );
}
