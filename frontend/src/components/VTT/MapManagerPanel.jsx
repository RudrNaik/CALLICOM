import { useEffect, useRef, useState } from "react";

export default function MapManagerPanel({
  maps,
  activeMap,
  onNew,
  onLoad,
  onRename,
  onDuplicate,
  onDelete,
  onResize,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null);
  const [cols, setCols] = useState(activeMap?.cols ?? 12);
  const [rows, setRows] = useState(activeMap?.rows ?? 10);
  const [mapsOpen, setMapsOpen] = useState(!activeMap);

  useEffect(() => {
    if (activeMap) {
      setCols(activeMap.cols);
      setRows(activeMap.rows);
    }
  }, [activeMap?.id]);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(reader.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-sm font-bold tracking-widest text-orange-400">
          TACMAP/MAP BUILDER
        </h1>
        <p className="text-[11px] text-neutral-400">
          Right/middle-click or shift-drag to pan, scroll to zoom.
        </p>
        <br></br>
        <button
          onClick={() => setMapsOpen((o) => !o)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-widest text-orange-400 mb-2"
        >
          <span>Maps{!mapsOpen && activeMap ? `: ${activeMap.name}` : ""}</span>
          <span>{mapsOpen ? "▾" : "▸"}</span>
        </button>
        {mapsOpen && (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {maps.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onLoad(m.id);
                setMapsOpen(false);
              }}
              className={`text-left px-2 py-1.5 rounded-xs border text-xs truncate ${
                activeMap?.id === m.id
                  ? "border-orange-400 bg-orange-400/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
        )}
        {mapsOpen && (
        <button
          onClick={() => onNew("New Map", 12, 10)}
          className="mt-2 w-full px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
        >
          + New Map
        </button>
        )}
      </div>

      {activeMap && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-orange-400">
            Active Map
          </p>
          <input
            value={activeMap.name}
            onChange={(e) => onRename(activeMap.id, e.target.value)}
            className="bg-neutral-800 border border-white/15 rounded-xs px-2 py-1.5 text-xs outline-none focus:border-orange-400"
          />

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 w-10">Cols</label>
            <input
              type="number"
              min={1}
              max={60}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
            <label className="text-xs text-neutral-400 w-10">Rows</label>
            <input
              type="number"
              min={1}
              max={60}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-16 bg-neutral-800 border border-white/15 rounded-xs px-2 py-1 text-xs"
            />
          </div>
          <button
            onClick={() => onResize(cols, rows)}
            className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
          >
            Resize Grid
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onDuplicate(activeMap.id)}
              className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
            >
              Duplicate
            </button>
            <button
              onClick={() => onDelete(activeMap.id)}
              className="px-2 py-1.5 rounded-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
            >
              Delete
            </button>
            <button
              onClick={onExport}
              className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
            >
              Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1.5 rounded-xs border border-white/15 hover:border-orange-400/60 text-xs"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
