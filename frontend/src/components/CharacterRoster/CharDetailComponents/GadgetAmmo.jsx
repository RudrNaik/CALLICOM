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
  charClass, // reserved
  characterCallsign, // for per-character storage key
}) {
  if (!config) return null;

  const options = config?.options || [];
  const optionIds = useMemo(() => new Set(options.map((o) => o.id)), [options]);

  // ---- classify gadget modes ----
  const isMixed = useMemo(
    () => ["spec-ammo", "stim-pouch", "x89-ams", "ugl"].includes(gadgetId),
    [gadgetId]
  );
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
      ].includes(gadgetId),
    [gadgetId]
  );

  // ---- title + header + max (mixed) ----
  const { title, max } = useMemo(() => {
    if (gadgetId === "stim-pouch")
      return { title: "Stimulants", max: config.maxStims ?? 0 };
    if (gadgetId === "ugl")
      return { title: "40mm Rounds", max: config.maxGrenades ?? 0 };
    if (gadgetId === "x89-ams")
      return { title: "Mortar Shells", max: config.maxRounds ?? 0 };
    if (gadgetId === "spec-ammo")
      return { title: "Special Ammo", max: config.maxSpecAmmo ?? 0 };
    if (gadgetId === "thinkpad") return { title: "Hacks" };
    if (isExpendable)
      return { title: "Expendable Munitions", max: config.max ?? 0 };
    return { title: "Consumables", max: 0 };
  }, [gadgetId, config, isExpendable]);

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
    if (isExpendable && config.max != null)
      return `You can carry up to ${config.max}.`;
    return null;
  }, [config, gadgetId, isExpendable]);

  // ---- localStorage  ----
  const localStorageKey = useMemo(
    () => `gadgetAmmo_${characterCallsign}_${gadgetId}`,
    [characterCallsign, gadgetId]
  );

  const EX_KEY = "__uses"; // internal key for expendables stored inside gadgetAmmo

  // sanitize based on type of munitions
  const sanitize = (obj) => {
    const out = {};
    if (!obj || typeof obj !== "object") return out;

    if (isMixed) {
      for (const [k, v] of Object.entries(obj)) {
        if (!optionIds.has(k)) continue;
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : -1; // keep -1 for mixed so we can hide some munitions.
      }
      return out;
    }

    if (isExpendable) {
      const n = Number(obj[EX_KEY]);
      out[EX_KEY] = Number.isFinite(n) ? Math.max(0, n) : 0; // 0 -> max range
      return out;
    }

    // default: nothing
    return out;
  };

  const sumNonNeg = (obj) =>
    Object.values(obj || {}).reduce(
      (a, n) => a + Math.max(0, Number(n || 0)),
      0
    );

  // Load from localStorage when gadget/callsign changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Back-compat: if someone stored a bare number for expendables, convert to { __uses: n }
        if (isExpendable && typeof parsed === "number") {
          setGadgetAmmo({ [EX_KEY]: Math.max(0, parsed) });
          return;
        }

        setGadgetAmmo(sanitize(parsed));
      } else {
        // init parent state
        if (isExpendable) {
          setGadgetAmmo({ [EX_KEY]: config.max ?? 0 });
        } else if (isMixed) {
          // keep whatever parent has but drop unknown ids
          setGadgetAmmo(sanitize(gadgetAmmo || {}));
        } else {
          setGadgetAmmo({});
        }
      }
    } catch (e) {
      console.error("GadgetAmmo parse error:", e);
      if (isExpendable) setGadgetAmmo({ [EX_KEY]: config.max ?? 0 });
      else setGadgetAmmo({});
    }
  }, [localStorageKey, isMixed, isExpendable]);

  // Persist to localStorage whenever ammo map changes (only while active)
  useEffect(() => {
    try {
      if (!isActive) return;
      const clean = sanitize(gadgetAmmo || {});
      localStorage.setItem(localStorageKey, JSON.stringify(clean));
    } catch (e) {
      console.error("GadgetAmmo save error:", e);
    }
  }, [gadgetAmmo, isActive, localStorageKey]);

  // Prune unknown keys if options change (mixed munitions)
  useEffect(() => {
    if (!isMixed) return;
    const pruned = sanitize(gadgetAmmo || {});
    if (JSON.stringify(pruned) !== JSON.stringify(gadgetAmmo || {})) {
      setGadgetAmmo(pruned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionIds, isMixed]);

  // ------- Render -------
  return (
    <div className="mt-1 rounded border border-orange-500/40 bg-neutral-900/50 p-3">
      <h4 className="text-orange-300 font-semibold mb-2">{title}</h4>
      {headerText && <p className="text-xs text-gray-400 mb-2">{headerText}</p>}

      {/* MIXED MUNITIONS (UBGL / AMS / Spec / Stims) */}
      {isMixed && (
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

                {/* Input in edit / live readout while not editing */}
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

                      if (max > 0 && sumNonNeg(next) > max) return; // cap

                      setGadgetAmmo(next);
                      // optional immediate write (useEffect also saves)
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

      {/* EXPENDABLES (one pooled counter with Use/Resupply) */}
      {isExpendable && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl px-2 py-1 rounded bg-neutral-900 text-yellow-400 shadow">
            <span>
              {Math.max(
                0,
                Number.isFinite(gadgetAmmo?.[EX_KEY])
                  ? gadgetAmmo[EX_KEY]
                  : config.max ?? 0
              )}
            </span>{" "}
            / {config.max ?? 0}
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
                      : config.max ?? 0;
                  if (cur <= 0) return;
                  const next = { ...(gadgetAmmo || {}), [EX_KEY]: cur - 1 };
                  setGadgetAmmo(next);
                  try {
                    if (isActive) {
                      localStorage.setItem(
                        localStorageKey,
                        JSON.stringify(sanitize(next))
                      );
                    }
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
                  const refill = config.max ?? 0;
                  const next = { ...(gadgetAmmo || {}), [EX_KEY]: refill };
                  setGadgetAmmo(next);
                  try {
                    if (isActive) {
                      localStorage.setItem(
                        localStorageKey,
                        JSON.stringify(sanitize(next))
                      );
                    }
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
