import { useState } from "react";
import useVTTMap from "./hooks/useVTTMap";
import VTTCanvas from "./components/VTT/VTTCanvas";
import VTTToolbar from "./components/VTT/VTTToolbar";
import MapManagerPanel from "./components/VTT/MapManagerPanel";
import TokenListPanel from "./components/VTT/TokenListPanel";
import { CLASS_KEYS } from "./components/VTT/tokenBadges";

export default function VTTPage() {
  const {
    maps,
    activeMap,
    allTokens,
    newMap,
    loadMap,
    renameMap,
    duplicateMap,
    deleteMap,
    resizeGrid,
    setTerrain,
    addToken,
    moveToken,
    removeToken,
    exportMap,
    importMap,
  } = useVTTMap();

  const [mode, setMode] = useState("select");
  const [brush, setBrush] = useState("normal");
  const [addClassKey, setAddClassKey] = useState(CLASS_KEYS[0]);
  const [addName, setAddName] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [showRangeOverlay, setShowRangeOverlay] = useState(true);

  const handleHexClick = (q, r) => {
    if (mode === "paint") {
      setTerrain(q, r, brush);
      return;
    }
    if (mode === "addFriendly" || mode === "addEnemy") {
      const type = mode === "addFriendly" ? "friendly" : "enemy";
      const count = allTokens.filter((t) => t.type === type).length + 1;
      const id = addToken({
        name: addName.trim() || `${type === "friendly" ? "Friendly" : "Enemy"} ${count}`,
        type,
        classKey: addClassKey,
        q,
        r,
      });
      setSelectedTokenId(id);
      setAddName("");
      return;
    }
    if (mode === "select" && selectedTokenId) {
      moveToken(selectedTokenId, q, r);
    }
  };

  const handleTokenClick = (tokenId) => {
    if (mode === "select" || tokenId === null) {
      setSelectedTokenId(tokenId);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white font-mono">
      <div className="py-10" />
      <div className="sticky top-18 z-20 backdrop-blur bg-black/40 border-b border-white/10 px-6 py-3">
        <h1 className="text-xl font-bold tracking-widest text-orange-400">
          CALLI/COM — TACTICAL MAP
        </h1>
        <p className="text-xs text-neutral-400">
          GM hex map builder. Left-click to interact per the active mode. Right-click / middle-click / shift-drag to pan, scroll to zoom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 p-4">
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <MapManagerPanel
            maps={maps}
            activeMap={activeMap}
            onNew={newMap}
            onLoad={loadMap}
            onRename={renameMap}
            onDuplicate={duplicateMap}
            onDelete={deleteMap}
            onResize={resizeGrid}
            onExport={exportMap}
            onImport={importMap}
          />
          <VTTToolbar
            mode={mode}
            setMode={setMode}
            brush={brush}
            setBrush={setBrush}
            addClassKey={addClassKey}
            setAddClassKey={setAddClassKey}
            addName={addName}
            setAddName={setAddName}
            showRangeOverlay={showRangeOverlay}
            setShowRangeOverlay={setShowRangeOverlay}
          />
        </div>

        <div className="order-1 lg:order-2 h-[70vh] rounded-lg overflow-hidden border border-white/10">
          {activeMap && (
            <VTTCanvas
              map={activeMap}
              tokens={allTokens}
              mode={mode}
              selectedTokenId={selectedTokenId}
              showRangeOverlay={showRangeOverlay}
              onHexClick={handleHexClick}
              onTokenClick={handleTokenClick}
            />
          )}
        </div>

        <div className="order-3">
          <TokenListPanel
            friendlies={activeMap?.friendlies || []}
            enemies={activeMap?.enemies || []}
            selectedTokenId={selectedTokenId}
            onSelect={setSelectedTokenId}
            onRemove={(id) => {
              removeToken(id);
              if (id === selectedTokenId) setSelectedTokenId(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
