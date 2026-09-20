import { hexDistance, rangeBand, rangeBandLabel } from "../../utils/hexGrid";
import { CLASS_KEYS, FRIENDLY_COLOR_PRESETS, MODIFIER_ICONS, MODIFIER_KEYS, resolveTokenColor } from "./tokenBadges";

function TokenRow({ token, selected, onSelect, onRemove, onUpdate }) {
  const color = resolveTokenColor(token);
  return (
    <div
      onClick={() => onSelect(selected ? null : token.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-xs border cursor-pointer text-xs ${
        selected ? "border-orange-400 bg-orange-400/10" : "border-white/10 hover:border-white/30"
      }`}
    >
      <span
        className={`w-2 h-2 shrink-0 ${token.type === "enemy" ? "rotate-45" : ""}`}
        style={{ background: color }}
      />
      <span className={`truncate flex-1 ${token.hidden ? "opacity-50 italic" : ""}`}>{token.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpdate(token.id, { hidden: !token.hidden });
        }}
        className={`px-1 border text-[10px] ${
          token.hidden ? "border-orange-400 text-orange-400" : "border-white/20 text-neutral-400 hover:text-white"
        }`}
        title={token.hidden ? "Hidden from the map — click to show" : "Visible — click to hide from the map"}
      >
        {token.hidden ? "HIDDEN" : "SHOWN"}
      </button>
      {token.aoeRadius > 0 && (
        <span className="text-[10px] text-neutral-400" title="AOE radius">
          AOO {token.aoeRadius}
        </span>
      )}
      <span className="text-neutral-400">{token.classKey.replaceAll("_", " ")}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(token.id);
        }}
        className="text-red-400 hover:text-red-300 px-1 border border-red-400"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

export default function TokenListPanel({ friendlies, enemies, selectedTokenId, onSelect, onUpdate, onRemove }) {
  const selected = [...friendlies, ...enemies].find((t) => t.id === selectedTokenId);

  return (
    <div className="flex flex-col gap-4 p-4 bg-gradient-to-t from-neutral-800 to-neutral-900 border border-r-4 border-r-orange-500 border-white/10 rounded-xs text-white text-sm font-mono">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400 mb-2">Friendlies</p>
        <div className="flex flex-col gap-1">
          {friendlies.length === 0 && <p className="text-xs text-neutral-500">None placed.</p>}
          {friendlies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-red-400 mb-2">Contacts</p>
        <div className="flex flex-col gap-1">
          {enemies.length === 0 && <p className="text-xs text-neutral-500">None placed.</p>}
          {enemies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-orange-400">Editing {selected.name}</p>

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Name</label>
            <input
              type="text"
              value={selected.name}
              onChange={(e) => onUpdate(selected.id, { name: e.target.value })}
              className="flex-1 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Class</label>
            <select
              value={selected.classKey}
              onChange={(e) => onUpdate(selected.id, { classKey: e.target.value })}
              className="flex-1 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            >
              {CLASS_KEYS.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {selected.type === "friendly" && (
            <div>
              <p className="text-[11px] text-neutral-400 mb-1">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {FRIENDLY_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdate(selected.id, { color: c })}
                    className={`w-6 h-6 rounded-full border-2 ${
                      resolveTokenColor(selected) === c ? "border-orange-400" : "border-white/20"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">AOO</label>
            <input
              type="number"
              min={0}
              max={10}
              value={selected.aoeRadius || 0}
              onChange={(e) => onUpdate(selected.id, { aoeRadius: Math.max(0, Number(e.target.value)) })}
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
              value={selected.scale || 1}
              onChange={(e) => onUpdate(selected.id, { scale: Math.max(0.5, Number(e.target.value)) })}
              className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Opacity</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.opacity ?? 1}
              onChange={(e) => onUpdate(selected.id, { opacity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-neutral-400 w-8 text-right">
              {Math.round((selected.opacity ?? 1) * 100)}%
            </span>
          </div>

          <div>
            <p className="text-[11px] text-neutral-400 mb-1">Modifiers</p>
            <div className="flex flex-wrap gap-1.5">
              {MODIFIER_KEYS.map((key) => {
                const active = (selected.modifiers || []).includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const current = selected.modifiers || [];
                      onUpdate(selected.id, {
                        modifiers: active ? current.filter((m) => m !== key) : [...current, key],
                      });
                    }}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-xs border text-[11px] ${
                      active ? "border-orange-400 bg-orange-400/10" : "border-white/15 hover:border-white/40"
                    }`}
                    title={key}
                  >
                    <img src={MODIFIER_ICONS[key]} alt="" className="w-4 h-4" />
                    {key}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-400 mb-1">Nearby</p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {[...friendlies, ...enemies]
                .filter((t) => t.id !== selected.id)
                .map((t) => {
                  const dist = hexDistance(selected, t);
                  const band = rangeBand(dist);
                  return (
                    <div key={t.id} className="flex justify-between text-xs text-neutral-300">
                      <span>{t.name}</span>
                      <span>
                        {dist} hex — {rangeBandLabel(band)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
