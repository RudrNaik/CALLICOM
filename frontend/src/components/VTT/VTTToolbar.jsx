import { TERRAIN, TERRAIN_ORDER } from "./terrain";
import { CLASS_KEYS, FRIENDLY_COLOR_PRESETS } from "./tokenBadges";

const MODES = [
  { id: "select", label: "Select / Move" },
  { id: "paint", label: "Paint Terrain" },
  { id: "addFriendly", label: "Place Friendly" },
  { id: "addEnemy", label: "Place Enemy" },
];

export default function VTTToolbar({
  mode,
  setMode,
  brush,
  setBrush,
  addClassKey,
  setAddClassKey,
  addName,
  setAddName,
  addColor,
  setAddColor,
  addAoeRadius,
  setAddAoeRadius,
  addScale,
  setAddScale,
  showRangeOverlay,
  setShowRangeOverlay,
  selectedTokenId,
  onDeselect,
}) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-neutral-900/80 border border-white/10 rounded-lg text-white text-sm font-mono">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-2 py-2 rounded-md border transition text-xs ${
                mode === m.id
                  ? "bg-orange-400 text-black border-orange-400"
                  : "border-white/15 hover:border-orange-400/60"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "paint" && (
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Terrain Brush</p>
          <div className="flex flex-col gap-1">
            {TERRAIN_ORDER.map((key) => {
              const t = TERRAIN[key];
              return (
                <button
                  key={key}
                  onClick={() => setBrush(key)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition ${
                    brush === key
                      ? "border-orange-400 bg-orange-400/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-sm border border-white/30 shrink-0"
                    style={{ background: t.swatch }}
                  />
                  <span className="text-xs">{t.label}</span>
                  <span className="ml-auto text-[10px] text-neutral-400">[{t.hotkey}]</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">Click a hex to paint it. Right/middle-drag (or shift-drag) to pan, wheel to zoom.</p>
        </div>
      )}

      {(mode === "addFriendly" || mode === "addEnemy") && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">
            {mode === "addFriendly" ? "New Friendly" : "New Enemy"}
          </p>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name"
            className="bg-neutral-800 border border-white/15 rounded-md px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          />
          <select
            value={addClassKey}
            onChange={(e) => setAddClassKey(e.target.value)}
            className="bg-neutral-800 border border-white/15 rounded-md px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          >
            {CLASS_KEYS.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          {mode === "addFriendly" && (
            <div>
              <p className="text-[11px] text-neutral-400 mb-1">Color (kept distinct from enemy red)</p>
              <div className="flex flex-wrap gap-1.5">
                {FRIENDLY_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAddColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      addColor === c ? "border-orange-400" : "border-white/20"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-400 w-16 shrink-0">AOE radius</label>
            <input
              type="number"
              min={0}
              max={10}
              value={addAoeRadius}
              onChange={(e) => setAddAoeRadius(Math.max(0, Number(e.target.value)))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-md px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-400 w-16 shrink-0">Size</label>
            <input
              type="number"
              min={0.5}
              max={4}
              step={0.5}
              value={addScale}
              onChange={(e) => setAddScale(Math.max(0.5, Number(e.target.value)))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-md px-2 py-1 text-xs"
            />
          </div>

          <p className="text-[11px] text-neutral-400">Click a hex to place the token.</p>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showRangeOverlay}
            onChange={(e) => setShowRangeOverlay(e.target.checked)}
          />
          Show range bands from selected token
        </label>
        {selectedTokenId && (
          <button
            onClick={onDeselect}
            className="px-2 py-1.5 rounded-md border border-white/15 hover:border-orange-400/60 text-xs text-left"
          >
            Deselect token
          </button>
        )}
      </div>
    </div>
  );
}
