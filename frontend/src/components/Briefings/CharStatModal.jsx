import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import equipmentData from "../../data/Equipment.json";
import gearSetsData from "../../data/geasrSets.json";
import SkillsView from "../CharacterRoster/CharDetailComponents/Skills/SkillsView";
import skillGroups from "../../data/skills.json";
import SpecView from "../CharacterRoster/CharDetailComponents/Skills/SpecView";
import PurchasedList from "../CharacterRoster/CharDetailComponents/Logistics/PurchasedList";
import { getPurchaseEntries } from "../../engine/logisticsEngine";
import {
  getGearsetsForClass,
  getGearPieceById,
  getGearPieceByIdAnyClass,
  getActiveGearsetPatch,
  GEAR_SLOT_KEYS,
} from "../../engine/equipmentEngine";
import {
  getMoneyTotal,
  getLogTotals,
  getMissionEarnings,
  describeReceipt,
  ensureStartingLog,
} from "../../engine/logsEngine";

const biographyFields = [
  ["bio", "Biography"],
  ["age", "Age"],
  ["height", "Height"],
  ["weight", "Weight"],
  ["gender", "Gender"],
  ["famRelations", "Family Relations"],
  ["normRelations", "Normal Relations"],
  ["psych", "Psychological Profile"],
  ["notes", "Notes"],
];

const GEAR_SLOT_LABELS = {
  headgear: "Headgear",
  vest: "Vest",
  gloves: "Gloves",
  equipment: "Equipment",
};

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
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-1/2 w-[min(64rem,95vw)] 
             min-h-[90vh] max-h-[90vh] -translate-x-1/2 -translate-y-1/2
             rounded-2xl border border-orange-400 bg-neutral-900/95 shadow-2xl 
             overflow-hidden flex flex-col"
          >
            {/* Header (not scrollable) */}
            <div className="p-6 pb-4">
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

              {/* Tabs (still not scrollable) */}
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
                  <button
                    className={`px-4 py-2 text-sm font-semibold border-l border-orange-500/40 ${
                      tab === "logs"
                        ? "bg-orange-500 text-white"
                        : "text-orange-300 hover:bg-neutral-800"
                    }`}
                    onClick={() => setTab("logs")}
                  >
                    Logs
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-semibold border-l border-orange-500/40 ${
                      tab === "purchases"
                        ? "bg-orange-500 text-white"
                        : "text-orange-300 hover:bg-neutral-800"
                    }`}
                    onClick={() => setTab("purchases")}
                  >
                    Purchases
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable body only */}
            <div
              className="flex-1 overflow-y-auto px-6 pb-6
               scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700"
            >
              {tab === "loadout" && <LoadoutSection char={char} />}

              {tab === "skills" && (
                <div className="mt-2">
                  <h2 className="mt-2 text-md font-bold text-orange-400">
                    Skills:
                  </h2>
                  <SkillsView
                    skillGroups={skillGroups}
                    isEditing={false}
                    editedSkills={{}}
                    character={char}
                    increaseSkill={() => {}}
                    decreaseSkill={() => {}}
                  />

                  <h2 className="mt-4 text-md font-bold text-orange-400">
                    Specializations:
                  </h2>
                  <SpecView
                    specializations={char.specializations || []}
                    isEditing={false}
                    removeSpec={() => {}}
                  />
                </div>
              )}

              {tab === "bio" && <BioSection char={char} />}

              {tab === "logs" && <LogsSection char={char} />}

              {tab === "purchases" && <PurchasesSection char={char} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- factored loadout section to keep file tidy ---- */
function LoadoutSection({ char }) {
  const meleeMax = 7;
  const equip = char.equipment || {};
  const A = char.attributes || {};
  const armor = Number(equip?.armorClass ?? 0);
  const INT = Number(A.Intelligence ?? 0);
  const SPR = Number(A.Spirit ?? 0);
  const BDY = Number(A.Body ?? 0);
  const EXP = Number(A.Alertness ?? A.Expertise ?? 0);
  const unrmd = Math.max(4, Math.ceil((3 + BDY + (char.skills?.CQC ?? 0)) / 1.5));
  const armd = Math.max(4, Math.ceil((3 + BDY + (char.skills?.Melee ?? 0)) / 1.5));
  const inventory = (char.equipment && char.equipment.miscGear)

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
          <DerivedCard label="Armd/Unrmd DMG" value={`${armd} / ${unrmd}`} />
          <DerivedCard
            label="Deep/Flsh"
            value={`${SPR + BDY + 5 + armor} / ${Math.ceil(
              (SPR + BDY + 5) / 2 + armor
            )}`}
          />
          <DerivedCard label="Inst-Dth" value={(SPR + BDY + 5) * 2} />
          <DerivedCard label="Sys-Shk" value={Math.ceil((BDY + SPR) / 2) + 5} />
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

        <GearSlotsSection char={char}/>

        {/* Inventory */}
        <div className="rounded-xl border border-orange-500/50 bg-neutral-900/60 p-4 mt-4">
          <p className="text-orange-300 text-xs font-bold mb-2">INVENTORY</p>
          {typeof inventory === "string" && inventory ? (
            <p className="text-neutral-100 text-sm whitespace-pre-line">{inventory}</p>
          ) : (
            <p className="text-neutral-400 text-xs">No items in inventory.</p>
          )}
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
      {bio && typeof bio === "object" ? (
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {biographyFields.map(([field, label]) => (
            <div
              key={field}
              className={
                field === "bio" || field === "notes" ? "sm:col-span-2" : ""
              }
            >
              <span className="block text-orange-400">{label}</span>
              <p className="whitespace-pre-wrap">{bio[field] || "..."}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-line text-xs">
          {bio || "No biography on file."}
        </p>
      )}
    </div>
  );
}

function GearSlotsSection({ char }) {
  const gearsets = getGearsetsForClass(char, gearSetsData);
  if (gearsets.length === 0) return null;

  const gearSlots = char?.equipment?.gearSlots || {};
  const activePatch = getActiveGearsetPatch(gearsets, gearSlots);

  return (
    <div className="rounded-xl border border-orange-500/50 bg-neutral-900/60 p-4 mt-4">
      <p className="text-orange-300 text-xs font-bold mb-3">GEAR SLOTS</p>

      {activePatch && (
        <div className="rounded-lg border border-orange-400/30 bg-orange-900/20 p-3 mb-3">
          <p className="text-neutral-400 text-xs mb-1">Patch</p>
          <p className="text-neutral-100 text-sm font-semibold">
            {activePatch.name}
            <span className="block text-orange-400 text-xs italic font-light mt-0.5">
              {activePatch.gearsetName} | {activePatch.manufacturer}
            </span>
          </p>
          {activePatch.effect && (
            <p className="text-[10px] text-neutral-400 whitespace-pre-line mt-2">
              {activePatch.effect}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {GEAR_SLOT_KEYS.map((slotKey) => {
          const equippedPiece = getGearPieceById(gearsets, gearSlots[slotKey]);
          return (
            <div key={slotKey} className="rounded-lg border border-neutral-700 p-3">
              <p className="text-neutral-400 text-xs mb-1">
                {GEAR_SLOT_LABELS[slotKey]}
              </p>
              {equippedPiece ? (
                <>
                  <p className="text-neutral-100">
                    {equippedPiece.name}
                    <span className="block text-orange-400 text-xs italic font-light">
                      {equippedPiece.gearsetName} | {equippedPiece.manufacturer}
                    </span>
                  </p>
                  {equippedPiece.effect && (
                    <p className="text-[10px] text-neutral-400 whitespace-pre-line mt-2">
                      {equippedPiece.effect}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-neutral-100">None Selected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ensureStartingLog needs character.metadata.starting_cash to synthesize a
// first entry — a Briefings snapshot missing that field would otherwise
// crash Logs/Purchases instead of just showing "no data" (see
// logsEngine.createStartingLog).
function getSafeLogs(char) {
  if (char?.logs?.length) return char.logs;
  if (char?.metadata) return ensureStartingLog(char, []);
  return [];
}

function StatTile({ label, value, color }) {
  return (
    <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 px-4 py-2 rounded-xs inline-block">
      <span className="block text-xs text-neutral-400">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function LogsSection({ char }) {
  const logs = getSafeLogs(char);
  const totals = getLogTotals(logs);
  const money = getMoneyTotal(char, equipmentData, gearSetsData);

  if (logs.length === 0) {
    return (
      <p className="text-neutral-500 text-xs mt-4">No logs on file.</p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        <StatTile
          label="Current Cash"
          value={money < 0 ? `-$${Math.abs(money)}` : `$${money}`}
          color={money < 0 ? "text-red-500" : "text-green-400"}
        />
        <StatTile
          label="Total Mission XP"
          value={totals.totalMissionXP}
          color="text-orange-300"
        />
        <StatTile
          label="Total Payout"
          value={`$${totals.totalPayout}`}
          color="text-green-400"
        />
      </div>
      <div className="space-y-3">
        {logs.map((log, index) => {
          const earnings = getMissionEarnings(log);
          const receipt = describeReceipt(log.receipt, equipmentData, gearSetsData);
          return (
            <div
              key={log.id || index}
              className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-orange-300 font-semibold text-sm">
                    {log.name}
                  </p>
                  {log.date && (
                    <p className="text-[10px] text-neutral-500">{log.date}</p>
                  )}
                </div>
                <div className="text-right text-xs shrink-0">
                  <p className="text-orange-300">
                    {earnings.xp >= 0 ? "+" : ""}
                    {earnings.xp} XP
                  </p>
                  <p className="text-green-400">
                    {earnings.cash >= 0 ? "+" : ""}${earnings.cash}
                  </p>
                </div>
              </div>
              {log.notes && (
                <p className="text-xs text-neutral-400 mt-1 whitespace-pre-line">
                  {log.notes}
                </p>
              )}
              {(log.achievements ?? []).length > 0 && (
                <div className="mt-2 space-y-1">
                  {log.achievements.map((a) => (
                    <div
                      key={a.id}
                      className="text-[11px] text-neutral-300 bg-neutral-900/60 rounded px-2 py-1"
                    >
                      {a.name} ({a.xpPayout >= 0 ? "+" : ""}
                      {a.xpPayout} XP / {a.cashPayout >= 0 ? "+" : ""}$
                      {a.cashPayout})
                    </div>
                  ))}
                </div>
              )}
              {receipt.purchases.length > 0 && (
                <div className="mt-2 text-[11px] text-neutral-400">
                  <span className="text-neutral-500">Bought: </span>
                  {receipt.purchases
                    .map(
                      (p) =>
                        p.label + (p.looted ? " [Loot]" : ` ($${p.cost})`),
                    )
                    .join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PurchasesSection({ char }) {
  const logs = getSafeLogs(char);

  const gadgetEntries = getPurchaseEntries(logs, "gadget")
    .map(({ purchase }) => {
      const gadget = equipmentData.find((g) => g.id === purchase.value);
      return gadget
        ? `${gadget.title}${purchase.source === "looted" ? " | [Loot]" : ""}`
        : null;
    })
    .filter(Boolean);

  const submunitionEntries = getPurchaseEntries(logs, "submunition")
    .map(({ purchase }) => {
      const submunition = equipmentData.find((i) => i.id === purchase.value);
      if (!submunition) return null;
      const parentGadget = equipmentData.find((item) =>
        (item.options ?? []).some((option) => option.id === submunition.id),
      );
      return parentGadget
        ? `${parentGadget.title}: ${submunition.title}`
        : submunition.title;
    })
    .filter(Boolean);

  const weaponEntries = getPurchaseEntries(logs, "weapon").map(
    ({ purchase }) =>
      `${purchase.value.name || "Unnamed Weapon"} (${purchase.value.category}${
        purchase.value.family ? ` / ${purchase.value.family}` : ""
      })${purchase.source === "looted" ? " | [Loot]" : ""}`,
  );

  const grenadeEntries = getPurchaseEntries(logs, "grenade").map(
    ({ purchase }) =>
      `${
        equipmentData.find((g) => g.id === purchase.value)?.title ||
        purchase.value
      }${purchase.source === "looted" ? " | [Loot]" : ""}`,
  );

  const gearSlotEntries = getPurchaseEntries(logs, "gearSlot")
    .map(({ purchase }) => {
      const piece = getGearPieceByIdAnyClass(gearSetsData, purchase.value);
      const slotLabel = GEAR_SLOT_LABELS[purchase.slot] || purchase.slot;
      const lootTag = purchase.source === "looted" ? " | [Loot]" : "";
      return {
        label: piece
          ? `${slotLabel}: ${piece.name}${lootTag}`
          : `${slotLabel}: ${purchase.label}${lootTag}`,
        group: piece?.gearsetName || "Other",
      };
    })
    .sort((a, b) => {
      if (a.group === b.group) return 0;
      if (a.group === "Other") return 1;
      if (b.group === "Other") return -1;
      return a.group.localeCompare(b.group);
    });

  const hasAny = [
    weaponEntries,
    grenadeEntries,
    gadgetEntries,
    submunitionEntries,
    gearSlotEntries,
  ].some((list) => list.length > 0);

  return (
    <div className="mt-4 space-y-3">
      <PurchasedList title="Weapons" items={weaponEntries} />
      <PurchasedList title="Grenades" items={grenadeEntries} />
      <PurchasedList title="Gadgets" items={gadgetEntries} />
      <PurchasedList title="Submunitions" items={submunitionEntries} />
      <PurchasedList title="Gear" items={gearSlotEntries} />
      {!hasAny && (
        <p className="text-neutral-500 text-xs">No purchases on file.</p>
      )}
    </div>
  );
}
