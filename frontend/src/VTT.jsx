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
    <div className="relative w-full h-screen bg-neutral-950 text-white font-mono overflow-hidden">
      <div className="absolute inset-0">
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

      <div className="absolute top-24 left-4 z-10 w-72 max-h-[calc(100%-7rem)] overflow-y-auto flex flex-col gap-4 pointer-events-none [&>*]:pointer-events-auto">
        <div className="px-1">
          <h1 className="text-sm font-bold tracking-widest text-orange-400">
            CALLI/COM — TACTICAL MAP
          </h1>
          <p className="text-[11px] text-neutral-400">
            Right/middle-click or shift-drag to pan, scroll to zoom.
          </p>
        </div>
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
          selectedTokenId={selectedTokenId}
          onDeselect={() => setSelectedTokenId(null)}
        />
      </div>

      <div className="absolute top-24 right-4 z-10 w-72 max-h-[calc(100%-7rem)] overflow-y-auto pointer-events-none [&>*]:pointer-events-auto">
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
  );
}
