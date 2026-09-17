import { useEffect, useRef, useState } from "react";
import {
  HEX_SIZE,
  axialToWorld,
  worldToAxial,
  hexCorners,
  hexKey,
  hexDistance,
  hexesInRadius,
  rangeBand,
  generateRectGrid,
} from "../../utils/hexGrid";
import {
  GROUND_COLOR,
  WALL_FILL_COLOR,
  INACCESSIBLE_FILL_COLOR,
  COVER_BORDER_COLOR,
  TALL_COVER_BORDER_COLOR,
  BORDER_THICKNESS_RATIO,
  BORDER_OVERLAP_RATIO,
  HIGH_GROUND_COLOR,
  HIGH_GROUND_FILL_ALPHA,
  LOW_GROUND_COLOR,
  LOW_GROUND_FILL_ALPHA,
  normalizeHexState,
} from "./terrain";
import { getTokenBadge, badgeCache, resolveTokenColor, tokenBadgeKey } from "./tokenBadges";

// Plain Canvas2D renderer — no WebGL/scene-graph, just imperative draw
// calls. Drawing the whole board is O(hexes + tokens) per frame and only
// happens on an actual state/camera change, which is far cheaper than a
// react-three-fiber scene with a component (and several materials) per hex.
//
// The board is projected isometrically (rotate + squash), so hex rows run
// diagonally like a physical hex mat viewed from above, with hex tips
// pointing due north. Tokens are drawn as plain axis-aligned images — only
// their anchor point moves through the projection, so they always stay
// flat and face the screen.
const ISO_COS = Math.cos(Math.PI / 6); // 0.866
const ISO_SIN = Math.sin(Math.PI / 6); // 0.5
// Rotates the whole board (both hex centers and hex corners, rigidly) so a
// hex vertex — rather than an edge — points due north on screen. See the
// derivation note: a flat-top hex corner at local angle 180° lands exactly
// on screen-north once rotated 45° and passed through the iso projection.
const WORLD_ROTATION = Math.PI / 4;
// Shears the projected board so higher points lean right relative to lower
// ones — like grabbing a hex's tip and dragging it right in a free
// transform. Applied inside isoProject, so it's baked into both hex
// centers and corners consistently and the grid still tiles seamlessly.
const SHEAR_X_PER_Y = 0.35;
const STAND_HEIGHT = 0.45; // world units a token badge floats above its hex, purely visual
const MIN_ZOOM = 5;
const MAX_ZOOM = 140;
const ZOOM_WHEEL_SENSITIVITY = 0.18;
// Close = blue, medium = green, long = yellow. Anything past long range
// (band 4+) gets no tint at all.
const BAND_TINTS = [null, "59,130,246", "34,197,94", "234,179,8", null];
const BAND_TINT_ALPHA = 0.10;
const BG_COLOR = "#15171a";
// Wider line spacing than fillHexHatch's default (stepRatio 0.22), used for
// soft wall and the high/low ground step hexes' hatched interiors.
const STEP_HATCH_STEP_RATIO = 0.30;

const UNIT_CORNERS = hexCorners(HEX_SIZE);

function rotate(x, z, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - z * s, x * s + z * c];
}

// Rotate+squash a world-space (x, z) offset into isometric screen space,
// before pan/zoom are applied. The x-component is negated so the board
// skews toward the right rather than the left — this mirrors the lean
// without disturbing the north/south tips (they sit at x=0, which a sign
// flip leaves untouched). A shear is then applied on top so higher points
// lean further right, like the whole hex was dragged over from its tip.
function isoProject(x, z) {
  const [rx, rz] = rotate(x, z, WORLD_ROTATION);
  const ix0 = -(rx - rz) * ISO_COS;
  const iy0 = (rx + rz) * ISO_SIN;
  return [ix0 - SHEAR_X_PER_Y * iy0, iy0];
}

function isoUnproject(isoX, isoY) {
  const iy0 = isoY;
  const ix0 = isoX + SHEAR_X_PER_Y * iy0;
  const a = -ix0 / ISO_COS; // rx - rz
  const b = iy0 / ISO_SIN; // rx + rz
  const rx = (a + b) / 2;
  const rz = (b - a) / 2;
  return rotate(rx, rz, -WORLD_ROTATION);
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

// Precomputed once: the six hex corners (unit size) already rotated and
// iso-projected, so drawing a hex per-frame is just a scale + add.
const PROJECTED_UNIT_CORNERS = UNIT_CORNERS.map(([ux, uz]) => isoProject(ux, uz));

function hexPath(ctx, cx, cy, size, zoom) {
  ctx.beginPath();
  PROJECTED_UNIT_CORNERS.forEach(([ix, iy], i) => {
    const px = cx + ix * size * zoom;
    const py = cy + iy * size * zoom;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function addHexToPath2D(path, cx, cy, size, zoom) {
  PROJECTED_UNIT_CORNERS.forEach(([ix, iy], i) => {
    const px = cx + ix * size * zoom;
    const py = cy + iy * size * zoom;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  });
  path.closePath();
}

// Strokes every accumulated hex border ring in one call. Independently
// stroking each hex (the old approach) makes shared edges between two
// same-type neighbors look thicker than unshared ones: each stroke is
// anti-aliased and composited onto the canvas separately, so two opaque
// AA'd strokes overlapping at a seam blend into something visibly more
// solid than either stroke alone. Merging them into one Path2D and
// stroking once means the overlap is resolved during rasterization of a
// single draw call, so it stays uniform — which also makes it safe to
// extend the ring slightly past the true hex edge (closing the
// anti-aliasing gap that otherwise shows between two touching hexes).
function strokeHexBorderBatch(ctx, path, zoom, color, dashed) {
  if (!path) return;
  const lineWidth = HEX_SIZE * BORDER_THICKNESS_RATIO * zoom;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter"; // sharp, unrounded corners
  ctx.setLineDash(dashed ? [lineWidth * 0.9, lineWidth * 0.9] : []);
  ctx.stroke(path);
  ctx.restore();
}

// Diagonal hatch fill, clipped to the hex — used for the soft wall's
// interior, and for the range-band overlay.
function fillHexHatch(ctx, cx, cy, size, zoom, color, { alpha = 0.7, lineWidthRatio = 0.09, stepRatio = 0.22 } = {}) {
  const radius = size * zoom;
  ctx.save();
  hexPath(ctx, cx, cy, size, zoom);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, radius * lineWidthRatio);
  ctx.globalAlpha = alpha;
  const step = Math.max(3, radius * stepRatio);
  ctx.beginPath();
  for (let d = -radius * 2; d <= radius * 2; d += step) {
    ctx.moveTo(cx - radius + d, cy - radius);
    ctx.lineTo(cx + radius + d, cy + radius);
  }
  ctx.stroke();
  ctx.restore();
}

export default function VTTCanvas({
  map,
  tokens,
  lines,
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
    Promise.all(tokens.map((t) => getTokenBadge(t.classKey, t.type, t.color))).then(() => {
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
    const borderSize = HEX_SIZE * (1 - BORDER_THICKNESS_RATIO / 2 + BORDER_OVERLAP_RATIO);

    let coverPath = null;
    let tallCoverPath = null;
    let softWallPath = null;

    // AOE rings: precompute hex -> [colors] once per token (O(tokens *
    // radius^2)) rather than testing every hex against every token.
    const aoeColors = new Map();
    for (const token of tokens) {
      if (!token.aoeRadius) continue;
      const color = resolveTokenColor(token);
      for (const h of hexesInRadius(token.q, token.r, token.aoeRadius)) {
        const key = hexKey(h.q, h.r);
        const list = aoeColors.get(key);
        if (list) list.push(color);
        else aoeColors.set(key, [color]);
      }
    }

    for (const { q, r } of hexes) {
      const [wx, wz] = axialToWorld(q, r);
      const [cx, cy] = project(wx, wz, camera);
      if (cx < -margin || cx > size.width + margin || cy < -margin || cy > size.height + margin) continue;

      const { elevation, obstacle } = normalizeHexState(map.hexes[hexKey(q, r)]);
      // A full wall or inaccessible obstacle fully covers the hex, so it
      // wins over whatever elevation tint would otherwise show through.
      const obstacleFillsHex = obstacle === "wall" || obstacle === "inaccessible";
      const baseColor =
        obstacle === "wall"
          ? WALL_FILL_COLOR
          : obstacle === "inaccessible"
          ? INACCESSIBLE_FILL_COLOR
          : GROUND_COLOR;

      hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
      ctx.fillStyle = baseColor;
      ctx.fill();

      const aoeHere = aoeColors.get(hexKey(q, r));
      if (aoeHere) {
        ctx.globalAlpha = 0.28;
        for (const color of aoeHere) {
          hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (showRangeOverlay && selectedToken) {
        const band = rangeBand(hexDistance(selectedToken, { q, r }));
        const tint = BAND_TINTS[Math.min(band, BAND_TINTS.length - 1)];
        if (tint) {
          // Plain solid fill, not a hatch — the hatch's per-hex clip+stroke
          // loop is expensive across a whole visible grid and was
          // measurably hurting frame time.
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

      // Elevation tint/hatch draws first (skipped under a wall/inaccessible
      // obstacle, since that fully covers the hex anyway), then the
      // obstacle's own border/hatch draws on top — so e.g. a soft wall on
      // high ground shows the cyan tint with the wall's hatch over it.
      if (!obstacleFillsHex) {
        if (elevation === "highGround") {
          hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
          ctx.fillStyle = HIGH_GROUND_COLOR;
          ctx.globalAlpha = HIGH_GROUND_FILL_ALPHA;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (elevation === "highGroundStep") {
          fillHexHatch(ctx, cx, cy, HEX_SIZE, camera.zoom, HIGH_GROUND_COLOR, {
            alpha: HIGH_GROUND_FILL_ALPHA,
            stepRatio: STEP_HATCH_STEP_RATIO,
          });
        } else if (elevation === "lowGround") {
          hexPath(ctx, cx, cy, HEX_SIZE, camera.zoom);
          ctx.fillStyle = LOW_GROUND_COLOR;
          ctx.globalAlpha = LOW_GROUND_FILL_ALPHA;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (elevation === "lowGroundStep") {
          fillHexHatch(ctx, cx, cy, HEX_SIZE, camera.zoom, LOW_GROUND_COLOR, {
            alpha: LOW_GROUND_FILL_ALPHA,
            stepRatio: STEP_HATCH_STEP_RATIO,
          });
        }
      }

      if (obstacle === "cover") {
        coverPath ??= new Path2D();
        addHexToPath2D(coverPath, cx, cy, borderSize, camera.zoom);
      } else if (obstacle === "tallCover") {
        tallCoverPath ??= new Path2D();
        addHexToPath2D(tallCoverPath, cx, cy, borderSize, camera.zoom);
      } else if (obstacle === "softWall") {
        fillHexHatch(ctx, cx, cy, HEX_SIZE, camera.zoom, WALL_FILL_COLOR, { stepRatio: STEP_HATCH_STEP_RATIO });
        softWallPath ??= new Path2D();
        addHexToPath2D(softWallPath, cx, cy, borderSize, camera.zoom);
      }
    }

    strokeHexBorderBatch(ctx, coverPath, camera.zoom, COVER_BORDER_COLOR, false);
    strokeHexBorderBatch(ctx, tallCoverPath, camera.zoom, TALL_COVER_BORDER_COLOR, false);
    strokeHexBorderBatch(ctx, softWallPath, camera.zoom, WALL_FILL_COLOR, false);

    // Sightline/suppression lines between token pairs — colored by the
    // source token, drawn under the token badges so the badges still read
    // clearly at each end.
    const tokenAnchor = (token) => {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      return [cx, cyBase - STAND_HEIGHT * camera.zoom];
    };
    for (const line of lines || []) {
      const from = tokens.find((t) => t.id === line.fromId);
      const to = tokens.find((t) => t.id === line.toId);
      if (!from || !to) continue;
      const [fx, fy] = tokenAnchor(from);
      const [tx, ty] = tokenAnchor(to);
      ctx.save();
      ctx.strokeStyle = resolveTokenColor(from);
      ctx.lineWidth = Math.max(2, camera.zoom * 0.045);
      ctx.setLineDash([camera.zoom * 0.25, camera.zoom * 0.18]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
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
      const badgeSize = HEX_SIZE * 0.95 * (token.scale || 1) * camera.zoom;

      const img = badgeCache.get(tokenBadgeKey(token));
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
  }, [map, tokens, lines, camera, size, mode, selectedTokenId, showRangeOverlay, hoveredHex, badgeVersion]);

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
    let closest = null;
    let closestDist = Infinity;
    for (const token of tokens) {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      const cy = cyBase - STAND_HEIGHT * camera.zoom;
      const hitRadius = HEX_SIZE * 0.5 * (token.scale || 1) * camera.zoom;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < hitRadius && dist < closestDist) {
        closest = token;
        closestDist = dist;
      }
    }
    return closest;
  };

  // Paints (or erases, clearing just the active layer) the hex under the
  // pointer, deduping against the last hex painted this drag so a slow
  // drag across one hex doesn't spam setTerrain calls.
  const paintAtPointer = (e, erase) => {
    const hex = getHexUnderPointer(e);
    const key = hexKey(hex.q, hex.r);
    const drag = dragState.current;
    if (drag) {
      if (drag.lastPaintedKey === key) return;
      drag.lastPaintedKey = key;
    }
    onHexClick?.(hex.q, hex.r, erase);
  };

  const handlePointerDown = (e) => {
    // Right-click erases (paints normal ground) while in paint mode
    // instead of panning; middle-click and shift-click still pan.
    const isEraseButton = mode === "paint" && e.button === 2;
    const isPanButton = !isEraseButton && (e.button === 2 || e.button === 1 || e.shiftKey);
    const isPaintButton = mode === "paint" && !isPanButton && (e.button === 0 || isEraseButton);

    dragState.current = {
      panning: isPanButton,
      painting: isPaintButton,
      erasing: isEraseButton,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
      lastPaintedKey: null,
    };
    canvasRef.current.setPointerCapture(e.pointerId);

    if (isPaintButton) paintAtPointer(e, isEraseButton);
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
      if (drag.painting) {
        paintAtPointer(e, drag.erasing);
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
    // Painting (and erasing) already happened live on pointerdown/move.
    if (!drag || drag.panning || drag.painting) return;
    if (drag.moved) return;
    if (e.button !== 0) return;

    if (mode === "select" || mode === "line") {
      const token = getTokenUnderPointer(e);
      if (token) {
        onTokenClick?.(mode === "select" && token.id === selectedTokenId ? null : token.id);
        return;
      }
      // No token under the pointer, in select mode: fall through to
      // onHexClick, which moves the currently-selected token (if any) to
      // this hex.
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
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom - e.deltaY * ZOOM_WHEEL_SENSITIVITY));
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
        onPointerLeave={() => setHoveredHex(null)}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
