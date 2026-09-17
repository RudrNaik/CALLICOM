import { useEffect, useRef, useState } from "react";
import {
  HEX_SIZE,
  axialToWorld,
  worldToAxial,
  hexCorners,
  hexKey,
  hexDistance,
  rangeBand,
  generateRectGrid,
} from "../../utils/hexGrid";
import {
  GROUND_COLOR,
  WALL_FILL_COLOR,
  COVER_BORDER_COLOR,
  TALL_COVER_BORDER_COLOR,
  SOFT_WALL_BORDER_COLOR,
  BORDER_THICKNESS_RATIO,
} from "./terrain";
import { getTokenBadge, badgeCache } from "./tokenBadges";

// Plain Canvas2D renderer — no WebGL/scene-graph, just imperative draw
// calls. Drawing the whole board is O(hexes + tokens) per frame and only
// happens on an actual state/camera change, which is far cheaper than a
// react-three-fiber scene with a component (and several materials) per hex.
//
// The board is projected isometrically (rotate 30° + squash), so hex rows
// run diagonally like a physical hex mat viewed from above. Tokens are
// drawn as plain axis-aligned images — only their anchor point moves
// through the iso transform, so they always stay flat and face the screen.
const ISO_COS = Math.cos(Math.PI / 6); // 0.866
const ISO_SIN = Math.sin(Math.PI / 6); // 0.5
const STAND_HEIGHT = 0.45; // world units a token badge floats above its hex, purely visual
const MIN_ZOOM = 14;
const MAX_ZOOM = 140;
const BAND_TINTS = [null, "59,130,246", "168,85,247", "236,72,153", "249,115,22"];
const BAND_TINT_ALPHA = 0.16;
const BG_COLOR = "#15171a";

const UNIT_CORNERS = hexCorners(HEX_SIZE);

// Rotate+squash a world-space (x, z) offset into isometric screen space,
// before pan/zoom are applied.
function isoProject(x, z) {
  return [(x - z) * ISO_COS, (x + z) * ISO_SIN];
}

function isoUnproject(isoX, isoY) {
  const a = isoX / ISO_COS; // x - z
  const b = isoY / ISO_SIN; // x + z
  return [(a + b) / 2, (b - a) / 2];
}

function project(x, z, camera) {
  const [ix, iy] = isoProject(x, z);
  return [camera.x + ix * camera.zoom, camera.y + iy * camera.zoom];
}

function unproject(px, py, camera) {
  const ix = (px - camera.x) / camera.zoom;
  const iy = (py - camera.y) / camera.zoom;
  return isoUnproject(ix, iy);
}

function hexPath(ctx, cx, cy, size, zoom) {
  ctx.beginPath();
  UNIT_CORNERS.forEach(([ux, uz], i) => {
    const [ix, iy] = isoProject(ux * size, uz * size);
    const px = cx + ix * zoom;
    const py = cy + iy * zoom;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function strokeHexBorder(ctx, cx, cy, zoom, color, dashed) {
  const midSize = HEX_SIZE * (1 - BORDER_THICKNESS_RATIO / 2);
  const lineWidth = HEX_SIZE * BORDER_THICKNESS_RATIO * zoom;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashed ? [lineWidth * 0.9, lineWidth * 0.9] : []);
  hexPath(ctx, cx, cy, midSize, zoom);
  ctx.stroke();
  ctx.restore();
}

export default function VTTCanvas({
  map,
  tokens,
  mode,
  selectedTokenId,
  showRangeOverlay,
  onHexClick,
  onTokenClick,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 55 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredHex, setHoveredHex] = useState(null);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const dragState = useRef(null);

  // Size the canvas to its container (with DPR for crispness).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Center the camera on the grid once per map (or when its size changes).
  useEffect(() => {
    if (!map || size.width === 0) return;
    const hexes = generateRectGrid(map.cols, map.rows);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const { q, r } of hexes) {
      const [x, z] = axialToWorld(q, r);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const [icx, icy] = isoProject(cx, cz);
    setCamera((cam) => ({
      ...cam,
      x: size.width / 2 - icx * cam.zoom,
      y: size.height / 2 - icy * cam.zoom,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map?.id, map?.cols, map?.rows, size.width, size.height]);

  // Preload every badge this map's tokens need, then trigger a redraw.
  useEffect(() => {
    let cancelled = false;
    Promise.all(tokens.map((t) => getTokenBadge(t.classKey, t.type))).then(() => {
      if (!cancelled) setBadgeVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  // Draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map || size.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, size.width, size.height);

    const hexes = generateRectGrid(map.cols, map.rows);
    const selectedToken = tokens.find((t) => t.id === selectedTokenId) || null;
    const margin = HEX_SIZE * camera.zoom * 1.5;

    for (const { q, r } of hexes) {
      const [wx, wz] = axialToWorld(q, r);
      const [cx, cy] = project(wx, wz, camera);
      if (cx < -margin || cx > size.width + margin || cy < -margin || cy > size.height + margin) continue;

      const terrain = map.hexes[hexKey(q, r)] || "normal";
      const baseColor = terrain === "wall" ? WALL_FILL_COLOR : GROUND_COLOR;

      hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
      ctx.fillStyle = baseColor;
      ctx.fill();

      if (showRangeOverlay && selectedToken) {
        const band = rangeBand(hexDistance(selectedToken, { q, r }));
        const tint = BAND_TINTS[Math.min(band, BAND_TINTS.length - 1)];
        if (tint) {
          hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
          ctx.fillStyle = `rgba(${tint}, ${BAND_TINT_ALPHA})`;
          ctx.fill();
        }
      }

      if (hoveredHex && hoveredHex.q === q && hoveredHex.r === r && mode === "paint") {
        hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
        ctx.fillStyle = "rgba(255, 183, 3, 0.3)";
        ctx.fill();
      }

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      hexPath(ctx, cx, cy, HEX_SIZE * 0.998, camera.zoom);
      ctx.stroke();

      if (terrain === "cover") strokeHexBorder(ctx, cx, cy, camera.zoom, COVER_BORDER_COLOR, false);
      else if (terrain === "tallCover") strokeHexBorder(ctx, cx, cy, camera.zoom, TALL_COVER_BORDER_COLOR, false);
      else if (terrain === "softWall") strokeHexBorder(ctx, cx, cy, camera.zoom, SOFT_WALL_BORDER_COLOR, true);
    }

    // Tokens, sorted so ones "further back" on screen draw first — in the
    // isometric projection, screen depth order follows (x + z), not raw z.
    const sorted = [...tokens].sort((a, b) => {
      const [ax, az] = axialToWorld(a.q, a.r);
      const [bx, bz] = axialToWorld(b.q, b.r);
      return (ax + az) - (bx + bz);
    });

    for (const token of sorted) {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      const cy = cyBase - STAND_HEIGHT * camera.zoom;
      const badgeSize = HEX_SIZE * 0.9 * camera.zoom;

      const img = badgeCache.get(`${token.classKey}-${token.type}`);
      if (img) {
        ctx.drawImage(img, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize);
      }

      if (token.id === selectedTokenId) {
        ctx.save();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = Math.max(2, camera.zoom * 0.04);
        ctx.beginPath();
        ctx.moveTo(cx - badgeSize * 0.55, cy + badgeSize / 2 + 4);
        ctx.lineTo(cx + badgeSize * 0.55, cy + badgeSize / 2 + 4);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = "#e5e5e5";
      ctx.font = `${Math.max(10, camera.zoom * 0.16)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(token.name, cx, cy - badgeSize / 2 - 4);
    }
  }, [map, tokens, camera, size, mode, selectedTokenId, showRangeOverlay, hoveredHex, badgeVersion]);

  const getHexUnderPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const [wx, wz] = unproject(px, py, camera);
    return worldToAxial(wx, wz, HEX_SIZE);
  };

  const getTokenUnderPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hitRadius = HEX_SIZE * 0.5 * camera.zoom;
    let closest = null;
    let closestDist = Infinity;
    for (const token of tokens) {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      const cy = cyBase - STAND_HEIGHT * camera.zoom;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < hitRadius && dist < closestDist) {
        closest = token;
        closestDist = dist;
      }
    }
    return closest;
  };

  const handlePointerDown = (e) => {
    const isPanButton = e.button === 2 || e.button === 1 || e.shiftKey;
    dragState.current = {
      panning: isPanButton,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const drag = dragState.current;
    if (drag) {
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      if (Math.abs(e.clientX - drag.startX) > 3 || Math.abs(e.clientY - drag.startY) > 3) drag.moved = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      if (drag.panning) {
        setCamera((cam) => ({ ...cam, x: cam.x + dx, y: cam.y + dy }));
        return;
      }
    }
    if (mode === "paint") {
      const hex = getHexUnderPointer(e);
      setHoveredHex((prev) => (prev && prev.q === hex.q && prev.r === hex.r ? prev : hex));
    }
  };

  const handlePointerUp = (e) => {
    const drag = dragState.current;
    dragState.current = null;
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (!drag || drag.panning || drag.moved) return;
    if (e.button !== 0) return;

    if (mode === "select") {
      const token = getTokenUnderPointer(e);
      if (token) {
        onTokenClick?.(token.id === selectedTokenId ? null : token.id);
        return;
      }
      // No token under the pointer: fall through to onHexClick, which
      // moves the currently-selected token (if any) to this hex.
    }

    const hex = getHexUnderPointer(e);
    onHexClick?.(hex.q, hex.r);
  };

  // React's synthetic onWheel listener is passive by default, so
  // preventDefault() inside it throws — attach a native listener instead.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setCamera((cam) => {
        const [wx, wz] = unproject(px, py, cam);
        const [ix, iy] = isoProject(wx, wz);
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom - e.deltaY * 0.08));
        return {
          zoom: nextZoom,
          x: px - ix * nextZoom,
          y: py - iy * nextZoom,
        };
      });
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ cursor: mode === "paint" ? "crosshair" : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
