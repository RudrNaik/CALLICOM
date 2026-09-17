import { hexDistance, rangeBand, rangeBandLabel } from "../../utils/hexGrid";

function TokenRow({ token, selected, onSelect, onRemove }) {
  return (
    <div
      onClick={() => onSelect(token.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer text-xs ${
        selected ? "border-orange-400 bg-orange-400/10" : "border-white/10 hover:border-white/30"
      }`}
    >
      <span
        className={`w-3 h-3 shrink-0 ${
          token.type === "enemy" ? "bg-red-500 rotate-45" : "bg-sky-400"
        }`}
      />
      <span className="truncate flex-1">{token.name}</span>
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

export default function TokenListPanel({ friendlies, enemies, selectedTokenId, onSelect, onRemove }) {
  const selected = [...friendlies, ...enemies].find((t) => t.id === selectedTokenId);

  return (
    <div className="flex flex-col gap-4 p-4 bg-neutral-900/80 border border-white/10 rounded-lg text-white text-sm font-mono">
      <div>
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
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">Ranges from {selected.name}</p>
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
      )}
    </div>
  );
}
