import { EFFECT_COLOR_PRESETS, EFFECT_PRESETS, MAX_EFFECT_RADIUS } from "./effects";

// Appearance and size controls for an area effect, shared by the "Place
// Effect" toolbar (editing the draft) and the token panel (editing a placed
// effect). `onChange` receives a partial patch.
export default function EffectControls({ effect, onChange, showPresets = false }) {
  return (
    <div className="flex flex-col gap-2">
      {showPresets && (
        <div>
          <p className="text-xs text-neutral-400 mb-1">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {EFFECT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onChange({ name: p.label, color: p.color, hatched: p.hatched })}
                className="flex items-center gap-1 px-1.5 py-1 rounded-xs border border-white/15 hover:border-white/40 text-[11px]"
              >
                <span className="w-2.5 h-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-neutral-400 mb-1">Color</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {EFFECT_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className={`w-6 h-6 rounded-md border-2 ${
                effect.color === c ? "border-orange-400" : "border-white/20"
              }`}
              style={{ background: c }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={effect.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-6 h-6 p-0 bg-transparent border border-white/20 rounded-md cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-neutral-400 mb-1">Fill</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { hatched: false, label: "Solid" },
            { hatched: true, label: "Hatched" },
          ].map((o) => (
            <button
              key={o.label}
              onClick={() => onChange({ hatched: o.hatched })}
              className={`px-2 py-1.5 rounded-xs border transition text-xs ${
                !!effect.hatched === o.hatched
                  ? "border-orange-400 bg-orange-400/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-400 w-16 shrink-0">Radius</label>
        <input
          type="number"
          min={0}
          max={MAX_EFFECT_RADIUS}
          value={effect.radius ?? 0}
          onChange={(e) =>
            onChange({ radius: Math.min(MAX_EFFECT_RADIUS, Math.max(0, Math.floor(Number(e.target.value) || 0))) })
          }
          className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-400 w-16 shrink-0">Opacity</label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={effect.opacity ?? 0.4}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="flex-1 min-w-0"
        />
        <span className="text-[10px] text-neutral-400 w-8 text-right">
          {Math.round((effect.opacity ?? 0.4) * 100)}%
        </span>
      </div>
    </div>
  );
}
