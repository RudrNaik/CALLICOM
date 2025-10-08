import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import equipmentData from "../../data/Equipment.json";
import SkillsView from "../CharacterRoster/CharDetailComponents/SkillsView";
import skillGroups from "../../data/skills.json";
import SpecView from "../CharacterRoster/CharDetailComponents/SpecView";

function getGadgetTitleById(id) {
  const match = equipmentData.find((item) => item.id === id);
  return match?.title || "None Selected";
}
const getLockCount = () => window.__scrollLockCount ?? 0;
const setLockCount = (n) => (window.__scrollLockCount = n);

export default function CharacterSheetModal({ char, open, onClose }) {
  const [tab, setTab] = useState("loadout");
  const lockedByMe = useRef(false);
  const prevOverflow = useRef("");

  // Scroll lock tied to `open`
  useEffect(() => {
    if (open) {
      // only set once per open
      if (!lockedByMe.current) {
        prevOverflow.current = document.body.style.overflow; // inline style only
        if (getLockCount() === 0) {
          document.body.style.overflow = "hidden";
        }
        setLockCount(getLockCount() + 1);
        lockedByMe.current = true;
      }
    } else if (lockedByMe.current) {
      // release lock when closing
      setLockCount(Math.max(0, getLockCount() - 1));
      if (getLockCount() === 0) {
        // restore to previous inline value
        document.body.style.overflow = prevOverflow.current || "";
      }
      lockedByMe.current = false;
    }
    // release on unmount
    return () => {
      if (lockedByMe.current) {
        setLockCount(Math.max(0, getLockCount() - 1));
        if (getLockCount() === 0) {
          document.body.style.overflow = prevOverflow.current || "";
        }
        lockedByMe.current = false;
      }
    };
  }, [open]);

  // Close on Esc only while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Conditionally render the content for AnimatePresence
  return (
    <AnimatePresence>
      {open && char && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[1px]"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            key="sheet"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-1/2 top-1/2 w-[min(64rem,95vw)] max-h-[85vh]
                       -translate-x-1/2 -translate-y-1/2 overflow-y-auto
                       rounded-2xl border border-orange-400 bg-neutral-900/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-neutral-100 tracking-wide">
                  {(char.callsign || "UNKNOWN").toUpperCase()}
                </h2>
                <p className="text-sm text-neutral-300">
                  {char.name} • {char.class}
                  {char.multiClass ? ` (+ ${char.multiClass})` : ""} •{" "}
                  {char.background}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-semibold"
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <div className="inline-flex rounded-xl border border-orange-500/40 bg-neutral-900/60 overflow-hidden">
                <button
                  className={`px-4 py-2 text-sm font-semibold ${
                    tab === "loadout"
                      ? "bg-orange-500 text-white"
                      : "text-orange-300 hover:bg-neutral-800"
                  }`}
                  onClick={() => setTab("loadout")}
                >
                  Loadout
                </button>
                <button
                  className={`px-4 py-2 text-sm font-semibold border-l border-orange-500/40 ${
                    tab === "skills"
                      ? "bg-orange-500 text-white"
                      : "text-orange-300 hover:bg-neutral-800"
                  }`}
                  onClick={() => setTab("skills")}
                >
                  Skills
                </button>
                <button
                  className={`px-4 py-2 text-sm font-semibold border-l border-orange-500/40 ${
                    tab === "bio"
                      ? "bg-orange-500 text-white"
                      : "text-orange-300 hover:bg-neutral-800"
                  }`}
                  onClick={() => setTab("bio")}
                >
                  Biography
                </button>
              </div>
            </div>

            {/* Body */}
            {tab === "loadout" && <LoadoutSection char={char} />}
            {tab === "skills" && (
              <div className="mt-4">
                <SkillsView
                  skillGroups={skillGroups}
                  isEditing={false}
                  editedSkills={{}}
                  character={char}
                  increaseSkill={() => {}}
                  decreaseSkill={() => {}}
                />

                <h2 className="mt-2 text-md font-bold text-orange-400">
                  Specializations:
                </h2>
                <SpecView
                  specializations={char.specializations}
                  isEditing={false}
                  removeSpec={() => {}}
                />
              </div>
            )}
            {tab === "bio" && <BioSection char={char} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- factored loadout section to keep file tidy ---- */
function LoadoutSection({ char }) {
  const equip = char.equipment || {};
  const A = char.attributes || {};
  const armor = Number(equip?.armorClass ?? 0);
  const INT = Number(A.Intelligence ?? 0);
  const SPR = Number(A.Spirit ?? 0);
  const BDY = Number(A.Body ?? 0);
  const EXP = Number(A.Expertise ?? 0);
  const unrmd = 3 + BDY + char.skills.CQC;
  const armd = 3 + BDY + char.skills.Melee;

  return (
    <div className="mt-4 flex gap-4 justify-center">
      <div className="w-full space-y-4">
        {/* Attributes */}
        <div className="grid grid-cols-4 gap-2">
          {[
            ["ALRT", EXP],
            ["BDY", BDY],
            ["INT", INT],
            ["SPRT", SPR],
          ].map(([label, val]) => (
            <div
              key={label}
              className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3"
            >
              <p className="text-[10px] tracking-widest text-neutral-400">
                {label}
              </p>
              <p className="text-xl font-bold text-neutral-100">{val}</p>
            </div>
          ))}
        </div>

        {/* Derived */}
        <div className="grid grid-cols-5 gap-2">
          <DerivedCard label="Combat Sense" value={1 + INT + SPR} />
          <DerivedCard
            label="Armd/Unrmd DMG"
            value={`${armd} / ${unrmd}`}
          />
          <DerivedCard
            label="Deep/Flesh"
            value={`${SPR + BDY + 5 + armor} / ${Math.ceil(
              (SPR + BDY + 5) / 2 + armor
            )}`}
          />
          <DerivedCard label="Inst-Death" value={(SPR + BDY + 5) * 2} />
          <DerivedCard
            label="Sys-Shock"
            value={Math.ceil((BDY + SPR) / 2) + 5}
          />
        </div>

        {/* Loadout */}
        <div className="rounded-xl border border-orange-500/50 bg-neutral-900/60 p-4">
          <p className="text-orange-300 text-xs font-bold mb-3">LOADOUT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <ItemCard title="Armor" value={equip.armorClass ?? "None"} />
            <ItemCard title="Gadget" value={getGadgetTitleById(equip.gadget)} />
            <ItemCard
              title={equip.primaryWeapon?.category || "Primary"}
              value={equip.primaryWeapon?.name || "None"}
            />
            <ItemCard
              title={equip.secondaryWeapon?.category || "Secondary"}
              value={equip.secondaryWeapon?.name || "None"}
            />
            <ItemCard
              className="md:col-span-2"
              title="Grenades"
              value={`${equip.grenades?.[0] || "-"} | ${
                equip.grenades?.[1] || "-"
              }`}
            />
          </div>
        </div>

        <div className="mt-4 text-[10px] text-neutral-500 tracking-wide">
          Authorized access only. Changes to loadout only accessible via Loadout
          View
        </div>
      </div>
    </div>
  );
}

function DerivedCard({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-1">
      <p className="text-[0.60rem] tracking-widest text-neutral-400 px-1">
        {label}
      </p>
      <p className="text-md font-bold text-neutral-100 px-1">{value}</p>
    </div>
  );
}

function ItemCard({ title, value, className = "" }) {
  return (
    <div className={`rounded-lg border border-neutral-700 p-3 ${className}`}>
      <p className="text-neutral-400 text-xs mb-1">{title}</p>
      <p className="text-neutral-100">{value}</p>
    </div>
  );
}

function BioSection({ char }) {
  const bio = char.Bio;

  return (
    <div className="rounded-xl border border-orange-500/50 bg-neutral-900/60 p-4 mt-4">
      <p className="text-orange-300 text-lg font-bold mb-3">BIOGRAPHY</p>
      <div>
        <p className=" whitespace-pre-line text-xs">{bio}</p>
      </div>
    </div>
  );
}
