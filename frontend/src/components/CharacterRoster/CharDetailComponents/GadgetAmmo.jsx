// src/components/GadgetAmmo.jsx
import { useEffect, useMemo } from "react";

export default function GadgetAmmo({
  isEditing,
  isActive, // only save to LS when actually in play
  gadgetId,
  config, // mixed: maxGrenades/maxRounds/maxStims/maxSpecAmmo; expendables: { max }
  gadgetAmmo, // Record<string, number>
  setGadgetAmmo,
  itemById,
  charClass,
  characterCallsign, // for per-character storage key
  campActive,
  campaignId,
}) {
  if (!config) return null;

  const options = config?.options || [];
  const optionIds = useMemo(() => new Set(options.map((o) => o.id)), [options]);

  // ---- classify gadget modes ----
  const isMixed = useMemo(
    () =>
      [
        "spec-ammo",
        "stim-pouch",
        "x89-ams",
        "ugl",
        "demo-dog",
        "ammo-bag",
      ].includes(gadgetId),
    [gadgetId]
  );

  // Everything that isn't mixed + has a max pool is considered expendable here
  const isExpendable = useMemo(
    () =>
      [
        "shock-sticks",
        "claymores",
        "ankle-busters",
        "lil-mac",
        "c4",
        "m5-slam",
        "9bangs",
        "snapshot",
        "rocket-launcher",
        "wire-launcher",
        "guided-launcher",
        "amr",
        "semenov-railgun",
        "m26-mass",
        "PMGL",
        "LMD",
        "mp-aps",
        "zipline",
        "grappling-hook",
        "hydraulic-hook",
      ].includes(gadgetId),
    [gadgetId]
  );

  // ---- constants / keys ----
  const EX_KEY = "__uses"; // pooled expendable counter
  const MAG_KEY = "__mag"; // legacy (reloadable)
  const RES_KEY = "__res"; // legacy (reloadable)

  const clamp0 = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);

  // Effective pool (with Engineer bonus)
  const effectiveMax = useMemo(() => {
    let base = config.max ?? 0;
    if (
      isExpendable &&
      charClass === "Combat Engineer" &&
      (gadgetId === "rocket-launcher" ||
        gadgetId === "wire-launcher" ||
        gadgetId === "guided-launcher")
    )
      base *= 2;
    return base;
  }, [isExpendable, charClass, config.max]);

  // ---- title + header ----
  const { title, max } = useMemo(() => {
    if (gadgetId === "stim-pouch")
      return { title: "Stimulants", max: config.maxStims ?? 0 };
    if (gadgetId === "ugl")
      return { title: "40mm Rounds", max: config.maxGrenades ?? 0 };
    if (gadgetId === "x89-ams")
      return { title: "Mortar Shells", max: config.maxRounds ?? 0 };
    if (gadgetId === "spec-ammo")
      return { title: "Special Ammo", max: config.maxSpecAmmo ?? 0 };
    if (gadgetId === "thinkpad") return { title: "Hacks", max: 0 };
    if (gadgetId === "demo-dog")
      return { title: "Variant", max: config.maxStowedAmmo ?? 0 };
    if (gadgetId === "ammo-bag")
      return { title: "Type", max: config.maxBatches ?? 0 };
    if (isExpendable) return { title: "Munitions", max: effectiveMax };
    return { title: "Consumables", max: 0 };
  }, [gadgetId, config, isExpendable, effectiveMax]);

  const headerText = useMemo(() => {
    if (!config) return null;
    if (gadgetId === "ugl" && config.maxGrenades != null)
      return `Max ${config.maxGrenades} rounds.`;
    if (gadgetId === "x89-ams" && config.maxRounds != null)
      return `Choose up to ${config.maxRounds} shells.`;
    if (gadgetId === "stim-pouch" && config.maxStims != null)
      return `Choose up to ${config.maxStims} stims. `;
    if (gadgetId === "spec-ammo" && config.maxSpecAmmo != null)
      return `Choose up to ${config.maxSpecAmmo} rounds `;
    if (gadgetId === "demo-dog")
      return `Select a variant. [increase to magazine size for selected variant.]`;
    if (gadgetId === "ammo-bag" && config.maxBatches != null)
      return `Choose up to ${config.maxBatches} charges`;
    if (isExpendable) return `Max: ${effectiveMax}x rounds/grenades/charges.`;
    return null;
  }, [config, gadgetId, isExpendable, effectiveMax]);

  // ---- localStorage key ----
  const localStorageKey = useMemo(
    () => `gadgetAmmo_${characterCallsign}_${gadgetId}`,
    [characterCallsign, gadgetId]
  );

  // ---- sanitize based on type of munitions ----
  const sanitize = (obj) => {
    const out = {};
    if (!obj || typeof obj !== "object") return out;

    if (isMixed) {
      for (const [k, v] of Object.entries(obj)) {
        if (!optionIds.has(k)) continue;
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : -1; // -1 check to hide in non-edit mode
      }
      return out;
    }

    if (isExpendable) {
      if (Object.prototype.hasOwnProperty.call(obj, EX_KEY)) {
        const n = Number(obj[EX_KEY]);
        out[EX_KEY] = Number.isFinite(n)
          ? clamp0(Math.min(n, effectiveMax))
          : 0;
        return out;
      }
      // Legacy reloadable shape -> migrate to pooled uses
      const mag = clamp0(obj[MAG_KEY]);
      const res = clamp0(obj[RES_KEY]);
      const total = Math.min(mag + res, effectiveMax);
      out[EX_KEY] = total;
      return out;
    }

    // default
    return out;
  };

  const sumNonNeg = (obj) =>
    Object.values(obj || {}).reduce(
      (a, n) => a + Math.max(0, Number(n || 0)),
      0
    );

  // ---- Load from localStorage when gadget/callsign changes ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Back-compat: if someone stored a bare number for expendables, convert to { __uses: n } and cap
        if (isExpendable && typeof parsed === "number") {
          setGadgetAmmo({
            [EX_KEY]: Math.max(0, Math.min(parsed, effectiveMax)),
          });
          return;
        }

        setGadgetAmmo(sanitize(parsed));
      } else {
        // init parent state
        if (isExpendable) {
          setGadgetAmmo({ [EX_KEY]: effectiveMax });
        } else if (isMixed) {
          // keep whatever parent has but drop unknown ids
          setGadgetAmmo(sanitize(gadgetAmmo || {}));
        } else {
          setGadgetAmmo({});
        }
      }
    } catch (e) {
      console.error("GadgetAmmo parse error:", e);
      if (isExpendable) setGadgetAmmo({ [EX_KEY]: effectiveMax });
      else setGadgetAmmo({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorageKey, isMixed, isExpendable, effectiveMax]);

  // ---- Persist to localStorage whenever ammo map changes (only while active) ----
  useEffect(() => {
    try {
      if (!isActive) return;
      const clean = sanitize(gadgetAmmo || {});
      localStorage.setItem(localStorageKey, JSON.stringify(clean));
    } catch (e) {
      console.error("GadgetAmmo save error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gadgetAmmo, isActive, localStorageKey, effectiveMax]);

  // ---- Prune unknown keys if options change (mixed munitions) ----
  useEffect(() => {
    if (!isMixed) return;
    const pruned = sanitize(gadgetAmmo || {});
    if (JSON.stringify(pruned) !== JSON.stringify(gadgetAmmo || {})) {
      setGadgetAmmo(pruned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionIds, isMixed, effectiveMax]);

  //console.log(max)

  const setMixedValue = (id, nextVal) => {
    const next = { ...(gadgetAmmo || {}), [id]: nextVal };

    if (max > 0 && sumNonNeg(next) > max) return; // pool cap

    setGadgetAmmo(next);
    try {
      if (isActive) {
        localStorage.setItem(localStorageKey, JSON.stringify(sanitize(next)));
      }
    } catch {}
  };

  // ------- Render -------
  return (
    <div className="mt-1 rounded border border-orange-500/40 bg-neutral-900/50 p-3">
      <h4 className="text-orange-300 font-semibold mb-2">{title}</h4>
      {headerText && <p className="text-xs text-gray-400 mb-2">{headerText}</p>}

      {/* MIXED MUNITIONS (UBGL / AMS / Spec / Stims/ Demo Dogs) */}
      {isMixed && (
        <div className="text-xs">
          {options.map((opt) => {
            const rules = itemById?.[opt.id]?.rulesText;
            const count = Number.isFinite(gadgetAmmo?.[opt.id])
              ? gadgetAmmo[opt.id]
              : 0;
            if (!isEditing && count <= -1) return null;
            if (
              campActive &&
              itemById?.[opt.id]?.cost !== 0 &&
              campaignId
                ?.replace(/\s/g, "")
                ?.split(",")
                ?.includes("Siberia2022")
            )
            return null; //Specific to the current campaign where it will filter out gadgets based on cost.

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

                {/* Input in edit / live readout while not editing */}
                {isActive || isEditing ? (
                  <div className="flex items-center gap-1">
                    {/* Decrement */}
                    <button
                      onClick={() => setMixedValue(opt.id, count - 1)}
                      disabled={count <= -1}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-40"
                    >
                      −
                    </button>

                    {/* Value */}
                    <div
                      className={`w-8 text-center text-xs font-mono rounded ${
                        count <= -1
                          ? "bg-neutral-900 text-gray-500"
                          : "bg-neutral-900 text-yellow-400"
                      }`}
                    >
                      {count <= -1 ? "—" : count}
                    </div>

                    {/* Increment */}
                    <button
                      onClick={() => setMixedValue(opt.id, count + 1)}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
                    >
                      +
                    </button>

                    {/* Deselect */}
                    <button
                      onClick={() => setMixedValue(opt.id, -1)}
                      className="ml-1 px-2 h-6 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] text-gray-400"
                      title="Deselect"
                    >
                      OFF
                    </button>
                  </div>
                ) : (
                  <p className="px-2 py-1 rounded bg-neutral-900">
                    <span className="text-yellow-400">{count}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trapper Hacks */}
      {gadgetId === "thinkpad" && (
        <div className="text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt) => {
              const rules = itemById?.[opt.id]?.rulesText;
              if (
                campActive &&
                itemById?.[opt.id]?.cost != 0 &&
                campaignId
                  ?.replace(/\s/g, "")
                  ?.split(",")
                  ?.includes("Siberia2022")
              )
                return null; //Specific to the current campaign where it will filter out gadgets based on cost.
              return (
                <div
                  key={opt.id}
                  className="p-3 rounded border border-neutral-700 bg-neutral-900/40"
                >
                  <div className="text-orange-300 font-semibold">
                    {opt.label}
                  </div>
                  {rules && (
                    <p className="mt-1 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {rules}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXPENDABLES (pooled counter with Use/Resupply) */}
      {isExpendable && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl px-2 py-1 rounded bg-neutral-900 text-yellow-400 shadow">
            <span>
              {Math.max(
                0,
                Number.isFinite(gadgetAmmo?.[EX_KEY])
                  ? gadgetAmmo[EX_KEY]
                  : effectiveMax
              )}
            </span>{" "}
            / {effectiveMax}
            <div className="text-[10px] text-gray-400 italic">Uses</div>
          </div>

          {isActive && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const cur =
                    Number.isFinite(gadgetAmmo?.[EX_KEY]) &&
                    gadgetAmmo[EX_KEY] >= 0
                      ? gadgetAmmo[EX_KEY]
                      : effectiveMax;
                  if (cur <= 0) return;
                  const next = { ...(gadgetAmmo || {}), [EX_KEY]: cur - 1 };
                  setGadgetAmmo(next);
                  try {
                    localStorage.setItem(
                      localStorageKey,
                      JSON.stringify(sanitize(next))
                    );
                  } catch {}
                }}
                disabled={
                  !isActive ||
                  (Number.isFinite(gadgetAmmo?.[EX_KEY])
                    ? gadgetAmmo[EX_KEY] <= 0
                    : false)
                }
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded disabled:opacity-40 text-sm"
              >
                Use
              </button>

              <button
                onClick={() => {
                  const refill = effectiveMax;
                  const next = { ...(gadgetAmmo || {}), [EX_KEY]: refill };
                  setGadgetAmmo(next);
                  try {
                    localStorage.setItem(
                      localStorageKey,
                      JSON.stringify(sanitize(next))
                    );
                  } catch {}
                }}
                className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm"
              >
                Resupply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
