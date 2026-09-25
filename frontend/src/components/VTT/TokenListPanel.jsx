import { useState } from "react";
import { hexDistance, rangeBand, rangeBandLabel } from "../../utils/hexGrid";
import { FRIENDLY_COLOR_PRESETS, MODIFIER_ICONS, MODIFIER_KEYS, classLabel, resolveTokenColor } from "./tokenBadges";
import ClassOptions from "./ClassOptions";
import EffectControls from "./EffectControls";

function TokenRow({ token, selected, batchMate, onSelect, onRemove, onUpdate }) {
  const isEffect = token.type === "effect";
  const color = isEffect ? token.color : resolveTokenColor(token);
  const detail = isEffect ? `Radius ${token.radius ?? 0}` : classLabel(token.classKey);
  return (
    <div
      onClick={() => onSelect(selected ? null : token.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-xs border cursor-pointer text-xs ${
        selected
          ? "border-orange-400 bg-orange-400/10"
          : batchMate
            ? "border-green-500 bg-green-500/10"
            : "border-white/10 hover:border-white/30"
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
      <span className="text-neutral-400 truncate max-w-[40%]" title={detail}>
        {detail}
      </span>
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

// Which panel sections are collapsed, remembered per browser. A convenience
// only: if storage is unavailable, every section just starts expanded.
const COLLAPSED_KEY = "calamari_vtt_token_panel_collapsed_v1";
function loadCollapsed() {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || {};
  } catch {
    return {};
  }
}

// A panel section whose title toggles its body. `action` sits on the right
// of the header (e.g. the Batches "+ New" button) and stays usable while
// collapsed.
function Section({ title, color, count, collapsed, onToggle, action, children }) {
  return (
    <div>
      <div className={`flex items-center justify-between ${collapsed ? "" : "mb-2"}`}>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 text-xs uppercase tracking-widest ${color}`}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span className="w-3 text-[10px]">{collapsed ? "▸" : "▾"}</span>
          {title}
          <span className="text-neutral-500 normal-case tracking-normal">({count})</span>
        </button>
        {action}
      </div>
      {!collapsed && children}
    </div>
  );
}

export default function TokenListPanel({
  friendlies,
  enemies,
  effects,
  batches,
  selectedTokenId,
  onSelect,
  onUpdate,
  onRemove,
  onAddBatch,
  onRenameBatch,
  onRemoveBatch,
  onMoveBatch,
}) {
  const selected = [...friendlies, ...enemies, ...effects].find((t) => t.id === selectedTokenId);
  // Batch of the selected token: its batch-mates get a green highlight here
  // and a green underline on the map.
  const selectedBatchId = selected && selected.type !== "effect" ? selected.batchId ?? null : null;
  const combatants = [...friendlies, ...enemies];

  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: the toggle still works for this session */
      }
      return next;
    });

  return (
    <div className="flex flex-col gap-4 p-4 bg-gradient-to-t from-neutral-800 to-neutral-900 border border-r-4 border-r-orange-500 border-white/10 rounded-xs text-white text-sm font-mono">
      <Section
        title="Friendlies"
        color="text-sky-400"
        count={friendlies.length}
        collapsed={!!collapsed.friendlies}
        onToggle={() => toggle("friendlies")}
      >
        <div className="flex flex-col gap-1">
          {friendlies.length === 0 && <p className="text-xs text-neutral-500">None placed.</p>}
          {friendlies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              batchMate={selectedBatchId != null && t.batchId === selectedBatchId}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Contacts"
        color="text-red-400"
        count={enemies.length}
        collapsed={!!collapsed.contacts}
        onToggle={() => toggle("contacts")}
      >
        <div className="flex flex-col gap-1">
          {enemies.length === 0 && <p className="text-xs text-neutral-500">None placed.</p>}
          {enemies.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              batchMate={selectedBatchId != null && t.batchId === selectedBatchId}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Batches"
        color="text-green-400"
        count={batches.length}
        collapsed={!!collapsed.batches}
        onToggle={() => toggle("batches")}
        action={
          <button
            onClick={() => onAddBatch()}
            className="px-1.5 py-0.5 rounded-xs border border-white/15 hover:border-green-400/60 text-[11px]"
          >
            + New
          </button>
        }
      >
        <div className="flex flex-col gap-1.5">
          {batches.length === 0 && (
            <p className="text-xs text-neutral-500">None. Group tokens that act on the same initiative.</p>
          )}
          {batches.map((b, i) => {
            const members = combatants.filter((t) => t.batchId === b.id);
            const active = b.id === selectedBatchId;
            return (
              <div
                key={b.id}
                className={`flex flex-col gap-1 px-2 py-1.5 rounded-xs border text-xs ${
                  active ? "border-green-500 bg-green-500/10" : "border-white/10"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 w-4 shrink-0 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => onRenameBatch(b.id, e.target.value)}
                    className="flex-1 min-w-0 bg-neutral-800 border border-white/15 rounded-xs px-1.5 py-0.5 text-xs"
                  />
                  <button
                    onClick={() => onMoveBatch(b.id, -1)}
                    disabled={i === 0}
                    className="px-1 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30"
                    title="Earlier in initiative"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onMoveBatch(b.id, 1)}
                    disabled={i === batches.length - 1}
                    className="px-1 border border-white/20 text-neutral-300 hover:text-white disabled:opacity-30"
                    title="Later in initiative"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => onRemoveBatch(b.id)}
                    className="text-red-400 hover:text-red-300 px-1 border border-red-400"
                    title="Delete batch (its tokens stay on the map)"
                  >
                    ×
                  </button>
                </div>
                {members.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 pl-5">No tokens yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1 pl-5">
                    {members.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[11px] ${
                          t.id === selectedTokenId ? "border-orange-400" : "border-white/15 hover:border-white/40"
                        } ${t.hidden ? "opacity-50 italic" : ""}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 shrink-0 ${t.type === "enemy" ? "rotate-45" : ""}`}
                          style={{ background: resolveTokenColor(t) }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Effects"
        color="text-orange-400"
        count={effects.length}
        collapsed={!!collapsed.effects}
        onToggle={() => toggle("effects")}
      >
        <div className="flex flex-col gap-1">
          {effects.length === 0 && <p className="text-xs text-neutral-500">None placed.</p>}
          {effects.map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              selected={t.id === selectedTokenId}
              batchMate={selectedBatchId != null && t.batchId === selectedBatchId}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </Section>

      {selected && selected.type === "effect" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => toggle("editing")}
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-orange-400 text-left"
          >
            <span className="w-3 text-[10px]">{collapsed.editing ? "▸" : "▾"}</span>
            <span className="truncate">Editing {selected.name}</span>
          </button>
          {!collapsed.editing && (
            <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Name</label>
            <input
              type="text"
              value={selected.name}
              onChange={(e) => onUpdate(selected.id, { name: e.target.value })}
              className="flex-1 min-w-0 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>
          <EffectControls effect={selected} onChange={(patch) => onUpdate(selected.id, patch)} />
            </>
          )}
        </div>
      )}

      {selected && selected.type !== "effect" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => toggle("editing")}
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-orange-400 text-left"
          >
            <span className="w-3 text-[10px]">{collapsed.editing ? "▸" : "▾"}</span>
            <span className="truncate">Editing {selected.name}</span>
          </button>
          {!collapsed.editing && (
            <>

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
              className="flex-1 min-w-0 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            >
              <ClassOptions />
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-16 shrink-0">Batch</label>
            <select
              value={selected.batchId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__new__") {
                  const id = onAddBatch();
                  if (id) onUpdate(selected.id, { batchId: id });
                } else {
                  onUpdate(selected.id, { batchId: value || undefined });
                }
              }}
              className="flex-1 min-w-0 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            >
              <option value="">None</option>
              {batches.map((b, i) => (
                <option key={b.id} value={b.id}>
                  {i + 1}. {b.name}
                </option>
              ))}
              <option value="__new__">+ New batch</option>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
