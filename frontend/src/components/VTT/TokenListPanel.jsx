import { hexDistance, rangeBand, rangeBandLabel } from "../../utils/hexGrid";
import { FRIENDLY_COLOR_PRESETS, resolveTokenColor } from "./tokenBadges";

function TokenRow({ token, selected, onSelect, onRemove }) {
  const color = resolveTokenColor(token);
  return (
    <div
      onClick={() => onSelect(token.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer text-xs ${
        selected ? "border-orange-400 bg-orange-400/10" : "border-white/10 hover:border-white/30"
      }`}
    >
      <span
        className={`w-3 h-3 shrink-0 ${token.type === "enemy" ? "rotate-45" : ""}`}
        style={{ background: color }}
      />
      <span className="truncate flex-1">{token.name}</span>
      {token.aoeRadius > 0 && (
        <span className="text-[10px] text-neutral-400" title="AOE radius">
          AOE {token.aoeRadius}
        </span>
      )}
      <span className="text-neutral-400">{token.classKey.replaceAll("_", " ")}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(token.id);
        }}
        className="text-red-400 hover:text-red-300 px-1"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

export default function TokenListPanel({ friendlies, enemies, selectedTokenId, onSelect, onUpdate, onRemove, onDeselect }) {
  const selected = [...friendlies, ...enemies].find((t) => t.id === selectedTokenId);

  return (
    <div className="flex flex-col gap-4 p-4 bg-neutral-900/80 border border-white/10 rounded-lg text-white text-sm font-mono">
      <div>
        {selectedTokenId && (
          <button
            onClick={onDeselect}
            className="px-2 py-1.5 rounded-md border border-white/15 hover:border-orange-400/60 text-xs mb-2 text-left"
          >
            Deselect token
          </button>
        )}
        <p className="text-xs uppercase tracking-widest text-sky-400 mb-2">Friendlies</p>
        <div className="flex flex-col gap-1">
          {friendlies.length === 0 && <p className="text-[11px] text-neutral-500">None placed.</p>}
          {friendlies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-red-400 mb-2">Enemies</p>
        <div className="flex flex-col gap-1">
          {enemies.length === 0 && <p className="text-[11px] text-neutral-500">None placed.</p>}
          {enemies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-orange-400">Editing {selected.name}</p>

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
            <label className="text-[11px] text-neutral-400 w-16 shrink-0">AOE radius</label>
            <input
              type="number"
              min={0}
              max={10}
              value={selected.aoeRadius || 0}
              onChange={(e) => onUpdate(selected.id, { aoeRadius: Math.max(0, Number(e.target.value)) })}
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
              value={selected.scale || 1}
              onChange={(e) => onUpdate(selected.id, { scale: Math.max(0.5, Number(e.target.value)) })}
              className="w-16 bg-neutral-800 border border-white/15 rounded-md px-2 py-1 text-xs"
            />
          </div>

          <div>
            <p className="text-[11px] text-neutral-400 mb-1">Ranges</p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {[...friendlies, ...enemies]
                .filter((t) => t.id !== selected.id)
                .map((t) => {
                  const dist = hexDistance(selected, t);
                  const band = rangeBand(dist);
                  return (
                    <div key={t.id} className="flex justify-between text-[11px] text-neutral-300">
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
