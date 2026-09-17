import { useMemo, useState } from "react";
import useVTTMap from "./hooks/useVTTMap";
import VTTCanvas from "./components/VTT/VTTCanvas";
import VTTToolbar from "./components/VTT/VTTToolbar";
import MapManagerPanel from "./components/VTT/MapManagerPanel";
import TokenListPanel from "./components/VTT/TokenListPanel";
import { CLASS_KEYS, DEFAULT_FRIENDLY_COLOR } from "./components/VTT/tokenBadges";

const DEFAULT_FRIENDLY_SCALE = 1.5;
const DEFAULT_ENEMY_SCALE = 2;

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
    updateToken,
    moveToken,
    removeToken,
    addLine,
    removeLine,
    exportMap,
    importMap,
  } = useVTTMap();

  const [mode, setMode] = useState("select");
  const [paintLayer, setPaintLayer] = useState("obstacle");
  const [elevationBrush, setElevationBrush] = useState("normal");
  const [obstacleBrush, setObstacleBrush] = useState("none");
  const [addClassKey, setAddClassKey] = useState(CLASS_KEYS[0]);
  const [addName, setAddName] = useState("");
  const [addColor, setAddColor] = useState(DEFAULT_FRIENDLY_COLOR);
  const [addAoeRadius, setAddAoeRadius] = useState(0);
  const [addScale, setAddScale] = useState(DEFAULT_FRIENDLY_SCALE);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [showRangeOverlay, setShowRangeOverlay] = useState(true);

  const tokensById = useMemo(() => new Map(allTokens.map((t) => [t.id, t])), [allTokens]);

  const handleHexClick = (q, r, erase) => {
    if (mode === "paint") {
      const defaultValue = paintLayer === "elevation" ? "normal" : "none";
      const brushValue = paintLayer === "elevation" ? elevationBrush : obstacleBrush;
      setTerrain(q, r, paintLayer, erase ? defaultValue : brushValue);
      return;
    }
    if (mode === "addFriendly" || mode === "addEnemy") {
      const type = mode === "addFriendly" ? "friendly" : "enemy";
      const count = allTokens.filter((t) => t.type === type).length + 1;
      const id = addToken({
        name: addName.trim() || `${type === "friendly" ? "Friendly" : "Enemy"} ${count}`,
        type,
        classKey: addClassKey,
        color: type === "friendly" ? addColor : undefined,
        aoeRadius: addAoeRadius,
        scale: addScale,
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
    if (mode === "line") {
      if (tokenId === null) return;
      if (!selectedTokenId) {
        setSelectedTokenId(tokenId);
        return;
      }
      if (tokenId === selectedTokenId) {
        setSelectedTokenId(null);
        return;
      }
      addLine(selectedTokenId, tokenId);
      return;
    }
    if (mode === "select" || tokenId === null) {
      setSelectedTokenId(tokenId);
    }
  };

  const handleModeChange = (nextMode) => {
    // Enemies default a bit bigger than friendlies; only nudge the scale
    // field when it's still at one of the two defaults, so a deliberately
    // customized size survives switching modes and back.
    if (nextMode === "addEnemy" && addScale === DEFAULT_FRIENDLY_SCALE) setAddScale(DEFAULT_ENEMY_SCALE);
    else if (nextMode === "addFriendly" && addScale === DEFAULT_ENEMY_SCALE) setAddScale(DEFAULT_FRIENDLY_SCALE);
    setMode(nextMode);
  };

  return (
    <div className="relative w-full h-screen bg-neutral-950 text-white font-mono overflow-hidden">
      <div className="absolute inset-0">
        {activeMap && (
          <VTTCanvas
            map={activeMap}
            tokens={allTokens}
            lines={activeMap.lines || []}
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
          setMode={handleModeChange}
          paintLayer={paintLayer}
          setPaintLayer={setPaintLayer}
          elevationBrush={elevationBrush}
          setElevationBrush={setElevationBrush}
          obstacleBrush={obstacleBrush}
          setObstacleBrush={setObstacleBrush}
          addClassKey={addClassKey}
          setAddClassKey={setAddClassKey}
          addName={addName}
          setAddName={setAddName}
          addColor={addColor}
          setAddColor={setAddColor}
          addAoeRadius={addAoeRadius}
          setAddAoeRadius={setAddAoeRadius}
          addScale={addScale}
          setAddScale={setAddScale}
          showRangeOverlay={showRangeOverlay}
          setShowRangeOverlay={setShowRangeOverlay}
          selectedTokenId={selectedTokenId}
          onDeselect={() => setSelectedTokenId(null)}
          lines={activeMap?.lines || []}
          tokensById={tokensById}
          onRemoveLine={removeLine}
        />
      </div>

      <div className="absolute top-24 right-4 z-10 w-72 max-h-[calc(100%-7rem)] overflow-y-auto pointer-events-none [&>*]:pointer-events-auto">
        <TokenListPanel
          friendlies={activeMap?.friendlies || []}
          enemies={activeMap?.enemies || []}
          selectedTokenId={selectedTokenId}
          onSelect={setSelectedTokenId}
          onUpdate={updateToken}
          onRemove={(id) => {
            removeToken(id);
            if (id === selectedTokenId) setSelectedTokenId(null);
          }}
          onDeselect={() => setSelectedTokenId(null)}
        />
      </div>
    </div>
  );
}
