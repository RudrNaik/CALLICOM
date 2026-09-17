import { useCallback, useEffect, useMemo, useState } from "react";
import { hexKey } from "../utils/hexGrid";
import { normalizeHexState } from "../components/VTT/terrain";

const MAPS_KEY = "calamari_vtt_maps_v1";
const ACTIVE_KEY = "calamari_vtt_active_map_v1";

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAllMaps() {
  try {
    const raw = localStorage.getItem(MAPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllMaps(maps) {
  try {
    localStorage.setItem(MAPS_KEY, JSON.stringify(maps));
  } catch (err) {
    console.error("Failed to save VTT maps to localStorage", err);
  }
}

function makeBlankMap(name, cols, rows) {
  const id = uid("map");
  return {
    id,
    name,
    cols,
    rows,
    hexes: {},
    friendlies: [],
    enemies: [],
    lines: [],
    updatedAt: Date.now(),
  };
}

export default function useVTTMap() {
  const [maps, setMaps] = useState(() => loadAllMaps());
  const [activeMapId, setActiveMapId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Ensure there's always at least one map to work with.
  useEffect(() => {
    if (Object.keys(maps).length === 0) {
      const blank = makeBlankMap("New Map", 12, 10);
      const next = { [blank.id]: blank };
      setMaps(next);
      saveAllMaps(next);
      setActiveMapId(blank.id);
      try {
        localStorage.setItem(ACTIVE_KEY, blank.id);
      } catch {
        /* noop */
      }
    } else if (!activeMapId || !maps[activeMapId]) {
      const firstId = Object.keys(maps)[0];
      setActiveMapId(firstId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeMapId) {
      try {
        localStorage.setItem(ACTIVE_KEY, activeMapId);
      } catch {
        /* noop */
      }
    }
  }, [activeMapId]);

  const activeMap = activeMapId ? maps[activeMapId] : null;

  const commit = useCallback((mapId, updater) => {
    setMaps((prev) => {
      const current = prev[mapId];
      if (!current) return prev;
      const updated = { ...updater(current), updatedAt: Date.now() };
      const next = { ...prev, [mapId]: updated };
      saveAllMaps(next);
      return next;
    });
  }, []);

  const newMap = useCallback((name, cols, rows) => {
    const blank = makeBlankMap(name || "New Map", cols || 12, rows || 10);
    setMaps((prev) => {
      const next = { ...prev, [blank.id]: blank };
      saveAllMaps(next);
      return next;
    });
    setActiveMapId(blank.id);
    return blank.id;
  }, []);

  const loadMap = useCallback((id) => {
    setActiveMapId(id);
  }, []);

  const renameMap = useCallback(
    (id, name) => commit(id, (m) => ({ ...m, name })),
    [commit]
  );

  const duplicateMap = useCallback((id) => {
    setMaps((prev) => {
      const source = prev[id];
      if (!source) return prev;
      const copy = { ...source, id: uid("map"), name: `${source.name} (copy)`, updatedAt: Date.now() };
      const next = { ...prev, [copy.id]: copy };
      saveAllMaps(next);
      return next;
    });
  }, []);

  const deleteMap = useCallback(
    (id) => {
      setMaps((prev) => {
        const next = { ...prev };
        delete next[id];
        saveAllMaps(next);
        if (activeMapId === id) {
          const remaining = Object.keys(next);
          setActiveMapId(remaining[0] || null);
        }
        return next;
      });
    },
    [activeMapId]
  );

  const resizeGrid = useCallback(
    (cols, rows) => {
      if (!activeMapId) return;
      commit(activeMapId, (m) => ({ ...m, cols, rows }));
    },
    [activeMapId, commit]
  );

  // `layer` is "elevation" or "obstacle" — each hex tracks both
  // independently (e.g. a soft wall obstacle sitting on a high-ground
  // elevation), so painting one leaves the other untouched.
  const setTerrain = useCallback(
    (q, r, layer, valueId) => {
      if (!activeMapId) return;
      commit(activeMapId, (m) => {
        const hexes = { ...m.hexes };
        const key = hexKey(q, r);
        const next = { ...normalizeHexState(hexes[key]), [layer]: valueId };
        if (next.elevation === "normal" && next.obstacle === "none") {
          delete hexes[key];
        } else {
          hexes[key] = next;
        }
        return { ...m, hexes };
      });
    },
    [activeMapId, commit]
  );

  const addToken = useCallback(
    (token) => {
      if (!activeMapId) return;
      const listKey = token.type === "enemy" ? "enemies" : "friendlies";
      const newToken = { id: uid("tok"), ...token };
      commit(activeMapId, (m) => ({ ...m, [listKey]: [...(m[listKey] || []), newToken] }));
      return newToken.id;
    },
    [activeMapId, commit]
  );

  const updateToken = useCallback(
    (tokenId, patch) => {
      if (!activeMapId) return;
      commit(activeMapId, (m) => {
        const updateList = (list = []) =>
          list.map((t) => (t.id === tokenId ? { ...t, ...patch } : t));
        return { ...m, friendlies: updateList(m.friendlies), enemies: updateList(m.enemies) };
      });
    },
    [activeMapId, commit]
  );

  const moveToken = useCallback(
    (tokenId, q, r) => updateToken(tokenId, { q, r }),
    [updateToken]
  );

  const removeToken = useCallback(
    (tokenId) => {
      if (!activeMapId) return;
      commit(activeMapId, (m) => ({
        ...m,
        friendlies: (m.friendlies || []).filter((t) => t.id !== tokenId),
        enemies: (m.enemies || []).filter((t) => t.id !== tokenId),
        lines: (m.lines || []).filter((l) => l.fromId !== tokenId && l.toId !== tokenId),
      }));
    },
    [activeMapId, commit]
  );

  // A sightline/suppression line between two tokens, drawn in the source
  // token's color. Referenced by token id (not fixed coords) so it tracks
  // both tokens as they move; removeToken already prunes dangling lines.
  const addLine = useCallback(
    (fromId, toId) => {
      if (!activeMapId || fromId === toId) return;
      commit(activeMapId, (m) => {
        const exists = (m.lines || []).some(
          (l) => (l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId)
        );
        if (exists) return m;
        return { ...m, lines: [...(m.lines || []), { id: uid("line"), fromId, toId }] };
      });
    },
    [activeMapId, commit]
  );

  const removeLine = useCallback(
    (lineId) => {
      if (!activeMapId) return;
      commit(activeMapId, (m) => ({ ...m, lines: (m.lines || []).filter((l) => l.id !== lineId) }));
    },
    [activeMapId, commit]
  );

  const allTokens = useMemo(() => {
    if (!activeMap) return [];
    return [...(activeMap.friendlies || []), ...(activeMap.enemies || [])];
  }, [activeMap]);

  const exportMap = useCallback(() => {
    if (!activeMap) return;
    const blob = new Blob([JSON.stringify(activeMap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeMap.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [activeMap]);

  const importMap = useCallback((jsonData) => {
    const imported = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    const id = uid("map");
    const map = {
      id,
      name: imported.name ? `${imported.name} (imported)` : "Imported Map",
      cols: imported.cols || 12,
      rows: imported.rows || 10,
      hexes: imported.hexes || {},
      friendlies: imported.friendlies || [],
      enemies: imported.enemies || [],
      lines: imported.lines || [],
      updatedAt: Date.now(),
    };
    setMaps((prev) => {
      const next = { ...prev, [id]: map };
      saveAllMaps(next);
      return next;
    });
    setActiveMapId(id);
  }, []);

  const mapList = useMemo(
    () =>
      Object.values(maps)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((m) => ({ id: m.id, name: m.name, updatedAt: m.updatedAt })),
    [maps]
  );

  return {
    maps: mapList,
    activeMap,
    activeMapId,
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
  };
}
