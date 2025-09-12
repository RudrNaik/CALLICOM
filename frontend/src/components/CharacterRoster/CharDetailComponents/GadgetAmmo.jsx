// src/components/SpecialAmmoPanel.jsx
import React, { useMemo } from "react";

// Utility
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sum = (obj) => Object.values(obj || {}).reduce((a, b) => a + (b || 0), 0);

export default function GadgetAmmo({
  title = "Special Ammo",
  isEditing,
  gadgetId,                // e.g., "ugl", "x89-ams"
  config,                  // { options: [{id,label}], and one of: maxTotal | maxTypes | maxRounds; optional perTypeMax }
  gadgetAmmo,              // Record<string, number>
  setGadgetAmmo,           // (next: Record<string, number>) => void
  itemById,                // Map or object: id -> { rulesText, ... } from your equipmentData
  className = "",
}) {
  const options = config?.options || [];
  const perTypeMax = config?.perTypeMax ?? 8; // sensible default

  const headerText = useMemo(() => {
    if (!config) return null;
    if (config.maxTotal != null) return `Max ${config.maxTotal} rounds.`;
    if (config.maxTypes != null) return `Choose ${config.maxTypes} shell types.`;
    if (config.maxRounds != null) return `Choose up to ${config.maxRounds} shells.`; // alias for total
    return null;
  }, [config]);

  if (!config) return null;

  const applyChange = (optId, nextVal) => {
    const v = Math.max(0, nextVal | 0);
    const next = { ...(gadgetAmmo || {}), [optId]: v };

    // 1) Total rounds limit (UGL, or if you pass maxRounds)
    if (config.maxTotal != null || config.maxRounds != null) {
      const cap = config.maxTotal ?? config.maxRounds;
      if (sum(next) <= cap) setGadgetAmmo(next);
      return;
    }

    // 2) Max types limit (X-89 default)
    if (config.maxTypes != null) {
      const types = Object.keys(next).filter((k) => (next[k] ?? 0) > 0);
      if (types.length <= config.maxTypes) setGadgetAmmo(next);
      return;
    }

    // Fallback (no constraint provided)
    setGadgetAmmo(next);
  };

  return (
    <div className={`mt-1 rounded border border-orange-500/40 bg-neutral-900/50 p-3 ${className}`}>
      <h4 className="text-orange-300 font-semibold mb-2">{title}</h4>
      {headerText && <p className="text-xs text-gray-400 mb-2">{headerText}</p>}

      <div className="text-xs">
        {options.map((opt) => {
          const count = gadgetAmmo?.[opt.id] ?? 0;

          // Hide zero-count options when NOT editing
          if (!isEditing && count <= 0) return null;

          const rules = itemById?.[opt.id]?.rulesText;

          // For maxTypes mode, prevent enabling new types past the cap
          let disableForMaxTypes = false;
          if (isEditing && config.maxTypes != null) {
            const selectedKeys = Object.keys(gadgetAmmo || {}).filter(
              (k) => (gadgetAmmo[k] ?? 0) > 0
            );
            disableForMaxTypes =
              !gadgetAmmo?.[opt.id] && selectedKeys.length >= config.maxTypes;
          }

          return (
            <div key={opt.id} className="flex items-start justify-between gap-2 mb-1">
              {/* Label + rulesText */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {rules && (
                    <span className="text-[10px] text-gray-400">
                      {rules}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: input in edit mode, badge in view mode */}
                <input
                  type="number"
                  min={0}
                  max={
                    config.maxTotal != null || config.maxRounds != null
                      ? (config.maxTotal ?? config.maxRounds)
                      : perTypeMax
                  }
                  value={count}
                  disabled={disableForMaxTypes}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value) || 0;
                    const cap =
                      config.maxTotal != null || config.maxRounds != null
                        ? (config.maxTotal ?? config.maxRounds)
                        : perTypeMax;
                    const clamped = clamp(raw, 0, cap);
                    applyChange(opt.id, clamped);
                  }}
                  className="w-16 text-center bg-neutral-800 text-white rounded disabled:opacity-40"
                />
            </div>
          );
        })}
      </div>
    </div>
  );
}
