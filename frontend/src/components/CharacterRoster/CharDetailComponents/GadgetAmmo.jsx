// src/components/GadgetAmmo.jsx
import { useEffect, useMemo } from "react";

export default function GadgetAmmo({
  isEditing, // same semantics as before
  isActive, // mission-active; mirrors charActive in WeaponSlot
  gadgetId, // e.g. "ugl", "x89-ams", "stim-pouch", "spec-ammo"
  config, // { options: [{id,label}], maxGrenades/maxRounds/maxStims/maxSpecAmmo }
  gadgetAmmo, // Record<string, number>
  setGadgetAmmo, // (next: Record<string, number>) => void
  itemById, // id -> { rulesText, ... }
  charClass, // used specifically for engineer class so they can get more rockets later on.
  characterCallsign, //to build per-character storage key
}) {
  if (!config) return null;

  const options = config?.options || [];
  const optionIds = useMemo(() => new Set(options.map((o) => o.id)), [options]);

  // Title + max
  const { title, max } = useMemo(() => {
    if (gadgetId === "stim-pouch")
      return { title: "Stimulants", max: config.maxStims ?? 0 };
    if (gadgetId === "ugl")
      return { title: "40mm Rounds", max: config.maxGrenades ?? 0 };
    if (gadgetId === "x89-ams")
      return { title: "Mortar Shells", max: config.maxRounds ?? 0 };
    if (gadgetId === "spec-ammo")
      return { title: "Special Ammo", max: config.maxSpecAmmo ?? 0 };
    return { title: "Consumables", max: 0 };
  }, [gadgetId, config]);

  const headerText = useMemo(() => {
    if (!config) return null;
    if (gadgetId === "ugl" && config.maxGrenades != null)
      return `Max ${config.maxGrenades} rounds.`;
    if (gadgetId === "x89-ams" && config.maxRounds != null)
      return `Choose up to ${config.maxRounds} shells.`;
    if (gadgetId === "stim-pouch" && config.maxStims != null)
      return `Choose up to ${config.maxStims} stims.`;
    if (gadgetId === "spec-ammo" && config.maxSpecAmmo != null)
      return `Choose up to ${config.maxSpecAmmo} rounds`;
    return null;
  }, [config, gadgetId]);

  // handles localstorage
  const localStorageKey = useMemo(
    () => `gadgetAmmo_${characterCallsign}_${gadgetId}`,
    [characterCallsign, gadgetId]
  );

  const sanitize = (obj) => {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    for (const [k, v] of Object.entries(obj)) {
      if (!optionIds.has(k)) continue; // keep only known options
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : -1; //
    }
    return out;
  };

  const sumNonNeg = (obj) =>
    Object.values(obj || {}).reduce(
      (a, n) => a + Math.max(0, Number(n || 0)),
      0
    );

  // Load from localStorage on change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = sanitize(JSON.parse(saved));
        setGadgetAmmo(parsed);
      } else {
        // sanitize parent state to only valid options
        setGadgetAmmo(sanitize(gadgetAmmo || {}));
      }
    } catch (e) {
      console.error("GadgetAmmo parse error:", e);
      setGadgetAmmo({});
    }
  }, [localStorageKey]);

  // Persist to localStorage whenever the ammo map changes
  useEffect(() => {
    try {
      const clean = sanitize(gadgetAmmo || {});
      if (isActive) {
        localStorage.setItem(localStorageKey, JSON.stringify(clean));
      }
    } catch (e) {
      console.error("GadgetAmmo save error:", e);
    }
  }, [gadgetAmmo, isActive, localStorageKey]);

  // When options list changes, prune unknown keys and resave
  useEffect(() => {
    const pruned = sanitize(gadgetAmmo || {});
    if (JSON.stringify(pruned) !== JSON.stringify(gadgetAmmo || {})) {
      setGadgetAmmo(pruned);
    }
  }, [optionIds]);

  return (
    <div className="mt-1 rounded border border-orange-500/40 bg-neutral-900/50 p-3">
      <h4 className="text-orange-300 font-semibold mb-2">{title}</h4>
      {headerText && <p className="text-xs text-gray-400 mb-2">{headerText}</p>}

      <div className="text-xs">
        {options.map((opt) => {
          const rules = itemById?.[opt.id]?.rulesText;
          const count = Number.isFinite(gadgetAmmo?.[opt.id])
            ? gadgetAmmo[opt.id]
            : 0;
          if (!isEditing && count <= -1) return null;

          return (
            <div
              key={opt.id}
              className="flex items-start justify-between gap-2 mb-1"
            >
              {/* Label + rules */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {rules && (
                    <span className="text-[10px] text-gray-400">{rules}</span>
                  )}
                </div>
              </div>

              {/* Input */}
              {isActive || isEditing ? (
                <input
                  type="number"
                  min={-1}
                  max={Math.max(0, max)}
                  value={count}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (Number.isNaN(val)) val = -1;

                    const next = { ...(gadgetAmmo || {}), [opt.id]: val };

                    // Enforce total cap across options
                    if (max > 0 && sumNonNeg(next) > max) {
                      return; // reject if exceeding cap
                    }

                    setGadgetAmmo(next);

                    // immediate write
                    try {
                      if (isActive) {
                        localStorage.setItem(
                          localStorageKey,
                          JSON.stringify(sanitize(next))
                        );
                      }
                    } catch {}
                  }}
                  className="w-16 text-center bg-neutral-800 text-white rounded"
                />
              ) : (
                <p className="px-2 py-1 rounded bg-neutral-900">
                  <span className="text-yellow-400">
                    {count}
                  </span>{" "}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
