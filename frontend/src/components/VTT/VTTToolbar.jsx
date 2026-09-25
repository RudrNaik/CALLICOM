import {
  ELEVATION,
  ELEVATION_ORDER,
  OBSTACLE,
  OBSTACLE_ORDER,
  DOOR_TYPES,
  DOOR_TYPE_ORDER,
  DOOR_STATES,
  DOOR_STATE_ORDER,
} from "./terrain";
import { FRIENDLY_COLOR_PRESETS, resolveTokenColor } from "./tokenBadges";
import ClassOptions from "./ClassOptions";
import EffectControls from "./EffectControls";

const MODES = [
  { id: "select", label: "Select/ Move" },
  { id: "paint", label: "Paint Terrain" },
  { id: "door", label: "Place Doors" },
  { id: "copy", label: "Copy / Paste" },
  { id: "addToken", label: "Place Token" },
  { id: "addEffect", label: "Place Effect" },
  { id: "line", label: "Draw Line" },
];

const PAINT_LAYERS = [
  { id: "elevation", label: "Elevation", dict: ELEVATION, order: ELEVATION_ORDER },
  { id: "obstacle", label: "Obstacle", dict: OBSTACLE, order: OBSTACLE_ORDER },
];

export default function VTTToolbar({
  mode,
  setMode,
  paintLayer,
  setPaintLayer,
  elevationBrush,
  setElevationBrush,
  obstacleBrush,
  setObstacleBrush,
  doorType,
  setDoorType,
  doorState,
  setDoorState,
  addType,
  setAddType,
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
  effectDraft,
  onEffectDraftChange,
  hexSelectionCount,
  clipboard,
  pasting,
  onCopy,
  onClearSelection,
  onSetPasting,
  selectTool,
  setSelectTool,
  showRangeOverlay,
  setShowRangeOverlay,
  selectedTokenId,
  onDeselect,
  lines,
  tokensById,
  onRemoveLine,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-2 py-2 rounded-xs border transition text-xs ${
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
          <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Terrain Layer</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PAINT_LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setPaintLayer(l.id)}
                className={`px-2 py-2 rounded-xs border transition text-xs ${
                  paintLayer === l.id
                    ? "bg-orange-400 text-black border-orange-400"
                    : "border-white/15 hover:border-orange-400/60"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {PAINT_LAYERS.filter((l) => l.id === paintLayer).map((l) => {
            const brush = l.id === "elevation" ? elevationBrush : obstacleBrush;
            const setBrush = l.id === "elevation" ? setElevationBrush : setObstacleBrush;
            return (
              <div key={l.id} className="flex flex-col gap-1">
                {l.order.map((key) => {
                  const t = l.dict[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setBrush(key)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-xs border transition ${
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
                    </button>
                  );
                })}
              </div>
            );
          })}
          <p className="text-[11px] text-neutral-400 mt-2">
            Click paints the active layer only. An obstacle painted onto high ground keeps that elevation. Right-click (or right-drag) clears the active layer on a hex.
          </p>
        </div>
      )}

      {mode === "door" && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Door Type</p>
            <div className="flex flex-col gap-1">
              {DOOR_TYPE_ORDER.map((key) => {
                const t = DOOR_TYPES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setDoorType(key)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xs border transition ${
                      doorType === key
                        ? "border-orange-400 bg-orange-400/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span className="flex flex-col gap-[2px] w-6 shrink-0">
                      {Array.from({ length: t.lines }).map((_, i) => (
                        <span
                          key={i}
                          className="h-[2px] w-full"
                          style={{ background: DOOR_STATES[doorState].color }}
                        />
                      ))}
                    </span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Door State</p>
            <div className="grid grid-cols-3 gap-2">
              {DOOR_STATE_ORDER.map((key) => {
                const s = DOOR_STATES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setDoorState(key)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xs border transition text-xs ${
                      doorState === key
                        ? "border-orange-400 bg-orange-400/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-neutral-400">
            Click a hex corner to start a door, then click another corner to finish it. Click the same corner again or press Escape to cancel. Right-click near a door to remove it.
          </p>
        </div>
      )}

      {mode === "copy" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">
            {pasting ? "Pasting" : "Select Hexes"}
          </p>
          {pasting ? (
            <>
              <p className="text-[11px] text-neutral-400">
                Click a hex to stamp the copied area there, centered on the cursor. Stamp as many times as you
                like. Esc goes back to selecting.
              </p>
              <button
                onClick={() => onSetPasting(false)}
                className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
              >
                Back to Selecting
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "brush", label: "Brush" },
                  { id: "box", label: "Box" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectTool(t.id)}
                    className={`px-2 py-1.5 rounded-xs border transition text-xs ${
                      selectTool === t.id
                        ? "border-orange-400 bg-orange-400/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">
                {selectTool === "box"
                  ? "Drag a box to add every hex inside it; right-drag a box to deselect."
                  : "Drag to select hexes, right-drag to deselect."}{" "}
                Both add to the same selection. Copy (Ctrl+C) takes their terrain and the doors between them.
              </p>
              <p className="text-xs">{hexSelectionCount} hex{hexSelectionCount === 1 ? "" : "es"} selected</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onCopy}
                  disabled={hexSelectionCount === 0}
                  className="px-2 py-1.5 rounded-xs border transition text-xs border-orange-400 bg-orange-400/10 disabled:opacity-40 disabled:border-white/15 disabled:bg-transparent"
                >
                  Copy
                </button>
                <button
                  onClick={onClearSelection}
                  disabled={hexSelectionCount === 0}
                  className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-white/40 transition text-xs disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
              {clipboard && (
                <button
                  onClick={() => onSetPasting(true)}
                  className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
                >
                  Paste Last Copy (Ctrl+V)
                </button>
              )}
            </>
          )}
          {clipboard && (
            <p className="text-[11px] text-neutral-500">
              Clipboard: {clipboard.cells.length} hex{clipboard.cells.length === 1 ? "" : "es"}
              {clipboard.doors.length > 0 &&
                `, ${clipboard.doors.length} door${clipboard.doors.length === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
      )}

      {mode === "addToken" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">New Token</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "friendly", label: "Friendly", active: "border-sky-400 bg-sky-400/10 text-sky-300" },
              { id: "enemy", label: "Contact", active: "border-red-400 bg-red-400/10 text-red-300" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAddType(t.id)}
                className={`px-2 py-1.5 rounded-xs border transition text-xs ${
                  addType === t.id ? t.active : "border-white/10 hover:border-white/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name"
            className="bg-neutral-800 border border-white/15 rounded-xs px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          />
          <select
            value={addClassKey}
            onChange={(e) => setAddClassKey(e.target.value)}
            className="bg-neutral-800 border border-white/15 rounded-xs px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          >
            <ClassOptions />
          </select>

          {addType === "friendly" && (
            <div>
              <p className="text-xs text-neutral-400 mb-1">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {FRIENDLY_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAddColor(c)}
                    className={`w-6 h-6 rounded-md border-2 ${
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
            <label className="text-xs text-neutral-400 w-16 shrink-0">AOO radius</label>
            <input
              type="number"
              min={0}
              max={10}
              value={addAoeRadius}
              onChange={(e) => setAddAoeRadius(Math.max(0, Number(e.target.value)))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Size</label>
            <input
              type="number"
              min={0.5}
              max={4}
              step={0.5}
              value={addScale}
              onChange={(e) => setAddScale(Math.max(0.5, Number(e.target.value)))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>

          <p className="text-[11px] text-neutral-400">Click a hex to place the token.</p>
        </div>
      )}

      {mode === "addEffect" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">New Effect</p>
          <input
            value={effectDraft.name}
            onChange={(e) => onEffectDraftChange({ name: e.target.value })}
            placeholder="Name (e.g. Fire, Smoke)"
            className="bg-neutral-800 border border-white/15 rounded-xs px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          />
          <EffectControls effect={effectDraft} onChange={onEffectDraftChange} showPresets />
          <p className="text-[11px] text-neutral-400">
            Click a hex to place the effect's center. Select it later by its dot to move or edit it.
          </p>
        </div>
      )}

      {mode === "line" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">LOS / Suppression Line</p>
          <p className="text-[11px] text-neutral-400">
            {selectedTokenId
              ? "Click another token to draw a line from the selected token, in its color. Click the selected token again to cancel."
              : "Click a token to start a line from it."}
          </p>
          {lines && lines.length > 0 && (
            <div className="flex flex-col gap-1">
              {lines.map((l) => {
                const from = tokensById?.get(l.fromId);
                const to = tokensById?.get(l.toId);
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xs border border-white/10 text-xs"
                  >
                    <span
                      className="w-2 h-2 shrink-0 rounded-full"
                      style={{ background: from ? resolveTokenColor(from) : "#888" }}
                    />
                    <span className="truncate flex-1">
                      {from?.name || "?"} → {to?.name || "?"}
                    </span>
                    <button
                      onClick={() => onRemoveLine?.(l.id)}
                      className="text-red-400 hover:text-red-300 px-1 border border-red-400"
                      title="Remove line"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
