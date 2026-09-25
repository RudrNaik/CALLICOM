import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HEX_SIZE,
  axialToWorld,
  worldToAxial,
  hexCorners,
  hexKey,
  parseHexKey,
  oddqToAxial,
  hexDistance,
  hexesInRadius,
  hexLine,
  axialToOddq,
  rangeBand,
  RANGE_BAND_SIZE,
  generateRectGrid,
  nearestVertex,
  distanceToSegment,
} from "../../utils/hexGrid";
import {
  GROUND_COLOR,
  WALL_FILL_COLOR,
  INACCESSIBLE_FILL_COLOR,
  COVER_BORDER_COLOR,
  TALL_COVER_BORDER_COLOR,
  BORDER_THICKNESS_RATIO,
  BORDER_OVERLAP_RATIO,
  EFFECT_BORDER_THICKNESS_RATIO,
  HIGH_GROUND_COLOR,
  HIGH_GROUND_FILL_ALPHA,
  LOW_GROUND_COLOR,
  LOW_GROUND_FILL_ALPHA,
  normalizeHexState,
  DOOR_TYPES,
  DOOR_STATES,
  normalizeDoor,
  ELEVATION,
  OBSTACLE,
} from "./terrain";
import { placeClipboard } from "./hexClipboard";
import {
  getTokenBadge,
  badgeCache,
  resolveTokenColor,
  tokenBadgeKey,
  preloadModifierIcons,
  getModifierImage,
  MODIFIER_KEYS,
} from "./tokenBadges";

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
const SHEAR_X_PER_Y = 0.20;
const STAND_HEIGHT = 0.45; // world units a token badge floats above its hex, purely visual
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 140;
// Wheel zoom is multiplicative (zoom *= exp(-delta * k)) so each notch is the
// same percentage change at any zoom level; deltaY is clamped so a fast
// scroll or a big trackpad flick can't jump too far in one event.
const ZOOM_WHEEL_SENSITIVITY = 0.0006;
const ZOOM_WHEEL_MAX_DELTA = 120;
// Close = blue, medium = green, long = yellow. Anything past long range
// (band 4+) gets no tint at all.
const BAND_TINTS = [null, "59,130,246", "34,197,94", "234,179,8", null];
const BAND_TINT_ALPHA = 0.10;
const BG_COLOR = "#15171a";
// Line spacing (as a fraction of hex radius) for the soft wall and the
// high/low ground step hexes' hatched interiors.
const STEP_HATCH_STEP_RATIO = 0.30;
const HATCH_LINE_WIDTH_RATIO = 0.09;
// Cap the backing-store pixel ratio; past 2x the fill cost grows with little
// visible gain.
const MAX_DPR = 2;
// Extra terrain rendered past each viewport edge (CSS px), so panning can
// reuse the cached terrain until the pan exceeds it.
const TERRAIN_CACHE_PAD = 256;
// Larger padding used while a zoom is in progress (still capped by the pixel
// budget below).
const TERRAIN_CACHE_ZOOM_PAD = 768;
// If the whole map fits in this many device pixels, cache all of it (so panning
// never re-renders); beyond that, cache just the viewport plus padding.
const TERRAIN_CACHE_MAX_PIXELS = 16_000_000;
// How long after the last zoom change before the terrain cache is re-rendered
// crisply at the new zoom.
const ZOOM_SETTLE_MS = 150;
// When the terrain cache is rebuilt after zooming settles or a pan outruns the
// padding, it is drawn in strips of this many columns, for at most this many ms
// per frame, so input stays responsive on big maps.
const TERRAIN_STRIP_COLS = 6;
const TERRAIN_SLICE_MS = 8;
// Terrain edits (painting) patch just the changed area of the terrain cache
// instead of re-rendering all of it — unless more than this many hexes
// changed at once, or the patch would cover more than this fraction of the
// cache, where a full render costs about the same.
const MAX_PATCH_CELLS = 2000;
const MAX_PATCH_AREA_FRACTION = 0.5;

// Grid-cell indexes (col * rows + row) whose terrain differs between two
// terrainStates arrays of the same grid, or null if more than
// MAX_PATCH_CELLS differ. Compares the two layer values rather than object
// identity, since the states are rebuilt (as new objects) on every edit.
function diffTerrainCells(a, b) {
  const cells = [];
  for (let i = 0; i < b.length; i++) {
    if (a[i].elevation !== b[i].elevation || a[i].obstacle !== b[i].obstacle) {
      cells.push(i);
      if (cells.length > MAX_PATCH_CELLS) return null;
    }
  }
  return cells;
}

const UNIT_CORNERS = hexCorners(HEX_SIZE);

const ROT_COS = Math.cos(WORLD_ROTATION);
const ROT_SIN = Math.sin(WORLD_ROTATION);

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
  const rx = x * ROT_COS - z * ROT_SIN;
  const rz = x * ROT_SIN + z * ROT_COS;
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

function addHexToPath2D(path, cx, cy, size, zoom) {
  const scale = size * zoom;
  for (let i = 0; i < 6; i++) {
    const [ix, iy] = PROJECTED_UNIT_CORNERS[i];
    const px = cx + ix * scale;
    const py = cy + iy * scale;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();
}

// Adds a hex's outline to `path` as open segments, skipping any edge already
// added by a neighbor (tracked in `seen`). Thin (<= ~1px) strokes are drawn
// hairline-style, so a shared edge submitted twice gets blended twice and
// looks darker; which edges double up depends on sub-pixel alignment, so it
// shows as a periodic pattern of heavier lines when zoomed out.
//
// Corners are also snapped to the device-pixel grid (to a pixel centre for an
// odd device line width, a pixel boundary for an even one). Otherwise each
// row of roughly horizontal edges lands at a different sub-pixel offset: some
// rows fall on one crisp pixel row, others smear across two at half alpha, and
// the crisp ones read as periodic darker rows of hexes.
function addHexEdgesDeduped(path, seen, cx, cy, size, zoom, dpr, lineWidthCss) {
  const scale = size * zoom;
  const Q = 16; // quantize to 1/16 px so neighbors' shared corners compare equal
  const phase = Math.round(lineWidthCss * dpr) % 2 ? 0.5 : 0;
  const snap = (v) => (Math.floor(v * dpr) + phase) / dpr;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const [ix, iy] = PROJECTED_UNIT_CORNERS[i];
    pts.push([snap(cx + ix * scale), snap(cy + iy * scale)]);
  }
  for (let i = 0; i < 6; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 6];
    const a = `${Math.round(ax * Q)},${Math.round(ay * Q)}`;
    const b = `${Math.round(bx * Q)},${Math.round(by * Q)}`;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    path.moveTo(ax, ay);
    path.lineTo(bx, by);
  }
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
function strokeHexBorderBatch(ctx, path, zoom, color, dashed, thicknessRatio = BORDER_THICKNESS_RATIO) {
  if (!path) return;
  const lineWidth = HEX_SIZE * thicknessRatio * zoom;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter"; // sharp, unrounded corners
  ctx.setLineDash(dashed ? [lineWidth * 0.9, lineWidth * 0.9] : []);
  ctx.stroke(path);
  ctx.restore();
}

// Hatched hexes are collected into one bucket (a union of hex outlines), then
// hatched with a single clip + a single stroke of screen-aligned diagonal
// lines, instead of a clip and stroke per hex. The line phase is therefore
// global, so the hatching runs continuously across neighboring hexes.
function makeBucket() {
  return { path: new Path2D(), used: false };
}

function addToBucket(bucket, cx, cy, zoom) {
  addHexToPath2D(bucket.path, cx, cy, HEX_SIZE, zoom);
  bucket.used = true;
}

// `bounds` ({ minX, maxX, minY, maxY }, screen px) limits the sweep to the
// area the bucket can cover. `reverse` flips the slant (lines rising to the
// right instead of falling), which area effects use so their hatching never
// blends into terrain's. `anchor` ({ x, y }, screen px) is a point the line
// pattern is pinned to: hatching drawn fresh every frame passes the camera
// offset, so the lines move with the map while panning instead of sliding
// across it.
function fillHatchedBucket(ctx, bucket, bounds, zoom, color, alpha, reverse = false, anchor = null) {
  if (!bucket.used) return;
  const radius = HEX_SIZE * zoom;
  const step = Math.max(3, radius * STEP_HATCH_STEP_RATIO);
  const { minX, maxX, minY, maxY } = bounds;
  // Each line satisfies x - y = c (or x + y = c when reversed); sweep c
  // across the bounds.
  const cMin = reverse ? minX + minY : minX - maxY;
  const cMax = reverse ? maxX + maxY : maxX - minY;
  const dir = reverse ? -1 : 1;
  const phase = anchor ? (reverse ? anchor.x + anchor.y : anchor.x - anchor.y) : 0;
  ctx.save();
  ctx.clip(bucket.path);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, radius * HATCH_LINE_WIDTH_RATIO);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let c = Math.ceil((cMin - phase) / step) * step + phase; c <= cMax; c += step) {
    ctx.moveTo(c + dir * minY, minY);
    ctx.lineTo(c + dir * maxY, maxY);
  }
  ctx.stroke();
  ctx.restore();
}

// Draws one door: a straight line between two world-space points (hex
// vertices), as 1-3 parallel lines. Extra lines are offset sideways
// (perpendicular to the door, in world space) so the set stays centered on
// the door's own line, and each runs the door's full length.
const DOOR_LINE_SPACING = 0.13; // world units between parallel lines
function drawDoor(ctx, camera, a, b, lineCount, color, alpha = 1) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len;
  const nz = dx / len;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, camera.zoom * 0.05);
  ctx.lineCap = "butt";
  for (let i = 0; i < lineCount; i++) {
    const off = (i - (lineCount - 1) / 2) * DOOR_LINE_SPACING;
    const [x1, y1] = project(a[0] + nx * off, a[1] + nz * off, camera);
    const [x2, y2] = project(b[0] + nx * off, b[1] + nz * off, camera);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// Area effects: fill alpha when an effect has no stored opacity, and the
// share of that alpha a hatched effect's background tint gets.
const DEFAULT_EFFECT_OPACITY = 0.4;
const EFFECT_HATCH_TINT = 0.25;
// Fill alpha of a token's AOO area.
const AOE_FILL_ALPHA = 0.28;
// The farthest range band that gets a tint; hexes past it are left clear,
// so the range overlay only ever visits hexes within this many bands.
const LAST_TINTED_BAND = BAND_TINTS.findLastIndex(Boolean);
// Ring centerline radius so the ring's outer edge lands on the hex edge. A
// lone ring has no same-type neighbor to seam against, so it skips the
// cover borders' overlap.
const EFFECT_CENTER_BORDER_SIZE = HEX_SIZE * (1 - EFFECT_BORDER_THICKNESS_RATIO / 2);
function effectOpacity(effect) {
  return effect.opacity ?? DEFAULT_EFFECT_OPACITY;
}
function effectAnchor(effect, camera) {
  const [wx, wz] = axialToWorld(effect.q, effect.r);
  return project(wx, wz, camera);
}

// Copy/paste: how selected hexes are highlighted, and the color a hex shows
// in the paste preview (its obstacle, else its elevation, else a faint
// wash for plain ground, which the paste still overwrites).
const SELECTION_FILL = "rgba(250, 204, 21, 0.28)";
const SELECTION_STROKE = "rgba(250, 204, 21, 0.9)";
const PASTE_PREVIEW_ALPHA = 0.6;
const BOX_SELECT_FILL = "rgba(250, 204, 21, 0.08)";
const BOX_DESELECT_FILL = "rgba(239, 68, 68, 0.08)";
const BOX_DESELECT_STROKE = "rgba(239, 68, 68, 0.9)";
function stampSwatch(state) {
  if (state.obstacle !== "none") return OBSTACLE[state.obstacle].swatch;
  if (state.elevation !== "normal") return ELEVATION[state.elevation].swatch;
  return "rgba(255, 255, 255, 0.12)";
}

export default function VTTCanvas({
  map,
  tokens,
  effects,
  lines,
  mode,
  selectedTokenId,
  showRangeOverlay,
  doors,
  onHexClick,
  onHexPaint,
  hexSelection,
  pastePreview,
  selectTool,
  onDoorAdd,
  onDoorRemove,
  doorType,
  doorState,
  onTokenClick,
  zoomRequest,
  onZoomChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  // The camera lives in a ref, not state: pan/zoom events mutate it and ask
  // for a redraw (coalesced to one per animation frame) without re-rendering
  // React at all.
  const cameraRef = useRef({ x: 0, y: 0, zoom: 55 });
  const rafRef = useRef(0);
  const drawRef = useRef(null);
  const lastReportedZoom = useRef(null);
  const terrainCacheRef = useRef(null);
  const lastSeenZoom = useRef(null);
  const zoomChangedAt = useRef(0);
  const settleTimer = useRef(0);
  const terrainJobRef = useRef(null);
  const spareCanvasRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredHex, setHoveredHex] = useState(null);
  // Door tool: the first vertex clicked (world coords), waiting for the
  // second, and the vertex currently under the pointer for the preview.
  const [doorStart, setDoorStart] = useState(null);
  const [hoveredVertex, setHoveredVertex] = useState(null);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const dragState = useRef(null);
  // Copy mode's box select: the rectangle being dragged, in canvas-local
  // CSS px ({ x0, y0, x1, y1, erase }), or null. A ref (plus scheduleDraw)
  // rather than state, so dragging it doesn't re-render React.
  const boxRef = useRef(null);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      drawRef.current?.();
    });
  }, []);

  // Reset the handle too: under StrictMode this cleanup runs between the
  // dev double-mount, and a stale non-zero handle would block every later
  // scheduleDraw.
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clearTimeout(settleTimer.current);
    },
    []
  );

  const updateCamera = useCallback(
    (fn) => {
      const next = fn(cameraRef.current);
      if (next === cameraRef.current) return;
      cameraRef.current = next;
      scheduleDraw();
    },
    [scheduleDraw]
  );

  // Terrain state per grid cell (index col * rows + row), normalized once per
  // terrain change instead of once per hex per frame. Keyed on the hexes
  // object and grid size only, not the whole map: every map edit (moving a
  // token, renaming it, tweaking an effect) makes a new map object, but
  // leaves `hexes` untouched unless terrain was painted. Since the terrain
  // cache is invalidated whenever this array changes, depending on `map`
  // would rebuild all the terrain for edits that can't affect it.
  const hexes = map?.hexes;
  const cols = map?.cols;
  const rows = map?.rows;
  const terrainStates = useMemo(() => {
    if (!hexes) return null;
    const states = new Array(cols * rows);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const { q, r } = oddqToAxial(col, row);
        states[col * rows + row] = normalizeHexState(hexes[hexKey(q, r)]);
      }
    }
    return states;
  }, [hexes, cols, rows]);

  const tokensById = useMemo(() => new Map(tokens.map((t) => [t.id, t])), [tokens]);

  const visibleEffects = useMemo(() => (effects || []).filter((e) => !e.hidden), [effects]);

  // Tokens sorted so ones "further back" on screen draw first — in the
  // isometric projection, screen depth order follows (x + z), not raw z.
  // Copy/paste: the selection as parsed hexes (parsed once per change, not
  // every frame), and where the clipboard would land under the cursor —
  // recomputed only when the hovered hex moves, so panning over a large
  // paste preview doesn't redo it every frame.
  const selectionHexes = useMemo(() => (hexSelection ? [...hexSelection].map(parseHexKey) : []), [hexSelection]);
  const pastePlacement = useMemo(
    () =>
      pastePreview && hoveredHex && cols
        ? placeClipboard(pastePreview, hoveredHex.q, hoveredHex.r, { cols, rows })
        : null,
    [pastePreview, hoveredHex, cols, rows]
  );

  const sortedTokens = useMemo(() => {
    const depth = (t) => {
      const [x, z] = axialToWorld(t.q, t.r);
      return x + z;
    };
    return [...tokens].sort((a, b) => depth(a) - depth(b));
  }, [tokens]);

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

  // Resize the backing store only when the container changes size. Assigning
  // canvas.width/height reallocates and clears it, so it must not happen per
  // draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    scheduleDraw();
  }, [size, scheduleDraw]);

  // Center the camera on the grid once per map (or when its size changes).
  useEffect(() => {
    if (!map || size.width === 0) return;
    const gridHexes = generateRectGrid(map.cols, map.rows);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const { q, r } of gridHexes) {
      const [x, z] = axialToWorld(q, r);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const [icx, icy] = isoProject(cx, cz);
    updateCamera((cam) => ({
      ...cam,
      x: size.width / 2 - icx * cam.zoom,
      y: size.height / 2 - icy * cam.zoom,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map?.id, map?.cols, map?.rows, size.width, size.height]);

  // Preload every badge (and the modifier icons) this map's tokens need,
  // then trigger a redraw. Skipped when everything is already cached, so a
  // plain token move doesn't cost an extra redraw.
  useEffect(() => {
    const modifiersLoaded = MODIFIER_KEYS.every((key) => getModifierImage(key));
    if (modifiersLoaded && tokens.every((t) => badgeCache.has(tokenBadgeKey(t)))) return;
    let cancelled = false;
    Promise.all([
      preloadModifierIcons(),
      ...tokens.map((t) => getTokenBadge(t.classKey, t.type, t.color)),
    ]).then(() => {
      if (!cancelled) setBadgeVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  // Terrain, in three steps: collectTerrain() gathers the visible hexes (of a
  // column range) into Path2Ds, drawTerrainPhase() paints one layer group of
  // that, and renderTerrain() does both for the whole map. The cache holds
  // only terrain: hex fills, grid lines, elevation, and obstacle
  // hatches/borders — everything that changes only with the terrain or zoom.
  // Token-driven overlays (AOO, range bands, effects) are drawn per frame on
  // top of it by drawOverlays(), so moving/selecting tokens or editing
  // effects never invalidates this cache.
  // `camera` here is the cache's own camera (offset by the cache padding) and
  // width/height the cache canvas's size in CSS pixels.
  const collectTerrain = (camera, width, height, colFrom = 0, colTo = Infinity, gridEdgesSeen = new Set()) => {
    const zoom = camera.zoom;
    const margin = HEX_SIZE * zoom * 1.5;
    const borderSize = HEX_SIZE * (1 - BORDER_THICKNESS_RATIO / 2 + BORDER_OVERLAP_RATIO);

    // Visible axial range: unproject the (margin-expanded) viewport corners
    // and take their q/r bounding box, so off-screen hexes are never even
    // visited.
    let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
    for (const [px, py] of [
      [-margin, -margin],
      [width + margin, -margin],
      [width + margin, height + margin],
      [-margin, height + margin],
    ]) {
      const [wx, wz] = unproject(px, py, camera);
      const q = (2 / 3) * (wx / HEX_SIZE);
      const r = (-1 / 3) * (wx / HEX_SIZE) + (Math.sqrt(3) / 3) * (wz / HEX_SIZE);
      qMin = Math.min(qMin, q); qMax = Math.max(qMax, q);
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
    }

    // Every visible hex is appended to a shared Path2D for its color/kind,
    // and each path is then filled or stroked once. That's a handful of draw
    // calls per frame rather than several per hex.
    const groundPath = new Path2D();
    const wallPath = new Path2D();
    const inaccessiblePath = new Path2D();
    const gridPath = new Path2D();
    const gridDpr = canvasRef.current && size.width ? canvasRef.current.width / size.width : 1;
    const highGroundPath = new Path2D();
    const lowGroundPath = new Path2D();
    const highStepHatch = makeBucket();
    const lowStepHatch = makeBucket();
    const softWallHatch = makeBucket();
    let coverPath = null;
    let tallCoverPath = null;
    let softWallPath = null;

    const colStart = Math.max(0, colFrom, Math.floor(qMin) - 1);
    const colEnd = Math.min(map.cols - 1, colTo, Math.ceil(qMax) + 1);
    for (let col = colStart; col <= colEnd; col++) {
      const rowOffset = (col - (col & 1)) / 2;
      const rowStart = Math.max(0, Math.floor(rMin) - 1 + rowOffset);
      const rowEnd = Math.min(map.rows - 1, Math.ceil(rMax) + 1 + rowOffset);
      const q = col;
      for (let row = rowStart; row <= rowEnd; row++) {
        const r = row - rowOffset;
        const [wx, wz] = axialToWorld(q, r);
        const [cx, cy] = project(wx, wz, camera);
        if (cx < -margin || cx > width + margin || cy < -margin || cy > height + margin) continue;

        const { elevation, obstacle } = terrainStates[col * map.rows + row];
        // A full wall or inaccessible obstacle fully covers the hex, so it
        // wins over whatever elevation tint would otherwise show through.
        const obstacleFillsHex = obstacle === "wall" || obstacle === "inaccessible";
        addHexToPath2D(
          obstacle === "wall" ? wallPath : obstacle === "inaccessible" ? inaccessiblePath : groundPath,
          cx, cy, HEX_SIZE, zoom
        );

        // Exactly HEX_SIZE (not slightly smaller): neighbors' shared edges must
        // coincide so the single stroke merges them into one line. Shrinking
        // leaves a sub-pixel gap that, zoomed out, makes some edges render as
        // a thicker/darker double line at a regular interval (moiré).
        addHexEdgesDeduped(gridPath, gridEdgesSeen, cx, cy, HEX_SIZE, zoom, gridDpr, 1);

        if (!obstacleFillsHex) {
          if (elevation === "highGround") addHexToPath2D(highGroundPath, cx, cy, HEX_SIZE, zoom);
          else if (elevation === "highGroundStep") addToBucket(highStepHatch, cx, cy, zoom);
          else if (elevation === "lowGround") addHexToPath2D(lowGroundPath, cx, cy, HEX_SIZE, zoom);
          else if (elevation === "lowGroundStep") addToBucket(lowStepHatch, cx, cy, zoom);
        }

        if (obstacle === "cover") {
          coverPath ??= new Path2D();
          addHexToPath2D(coverPath, cx, cy, borderSize, zoom);
        } else if (obstacle === "tallCover") {
          tallCoverPath ??= new Path2D();
          addHexToPath2D(tallCoverPath, cx, cy, borderSize, zoom);
        } else if (obstacle === "softWall") {
          addToBucket(softWallHatch, cx, cy, zoom);
          softWallPath ??= new Path2D();
          addHexToPath2D(softWallPath, cx, cy, borderSize, zoom);
        }
      }
    }

    return {
      zoom, margin, width, height,
      groundPath, wallPath, inaccessiblePath, gridPath, highGroundPath, lowGroundPath,
      highStepHatch, lowStepHatch, softWallHatch,
      coverPath, tallCoverPath, softWallPath,
    };
  };

  // Phases must run in order across the WHOLE map, never strip by strip:
  // later fills would otherwise paint over the grid lines and obstacle
  // borders of an earlier strip's hexes along the seam (borders extend past
  // the hex edge), which shows up as clipped hex edges.
  //   1: base fills
  //   2: grid lines, elevation tints and hatches
  //   3: obstacle borders
  const drawTerrainPhase = (ctx, b, phase) => {
    const { zoom, groundPath, wallPath, inaccessiblePath, gridPath, highGroundPath, lowGroundPath,
      highStepHatch, lowStepHatch, softWallHatch,
      coverPath, tallCoverPath, softWallPath } = b;
    if (phase === 1) {
    ctx.fillStyle = GROUND_COLOR;
    ctx.fill(groundPath);
    ctx.fillStyle = WALL_FILL_COLOR;
    ctx.fill(wallPath);
    ctx.fillStyle = INACCESSIBLE_FILL_COLOR;
    ctx.fill(inaccessiblePath);
    } else if (phase === 2) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke(gridPath);

    // Elevation tint/hatch draws first, then the obstacle's own hatch/border
    // on top — so e.g. a soft wall on high ground shows the cyan tint with
    // the wall's hatch over it.
    ctx.globalAlpha = HIGH_GROUND_FILL_ALPHA;
    ctx.fillStyle = HIGH_GROUND_COLOR;
    ctx.fill(highGroundPath);
    ctx.globalAlpha = LOW_GROUND_FILL_ALPHA;
    ctx.fillStyle = LOW_GROUND_COLOR;
    ctx.fill(lowGroundPath);
    ctx.globalAlpha = 1;

    const bounds = {
      minX: -b.margin, maxX: b.width + b.margin,
      minY: -b.margin, maxY: b.height + b.margin,
    };
    // A cache patch renders with a camera offset to the patch's corner, so it
    // passes an anchor that keeps its hatch lines in phase with the rest of
    // the cache (a full render needs none).
    const anchor = b.hatchAnchor ?? null;
    fillHatchedBucket(ctx, highStepHatch, bounds, zoom, HIGH_GROUND_COLOR, HIGH_GROUND_FILL_ALPHA, false, anchor);
    fillHatchedBucket(ctx, lowStepHatch, bounds, zoom, LOW_GROUND_COLOR, LOW_GROUND_FILL_ALPHA, false, anchor);
    fillHatchedBucket(ctx, softWallHatch, bounds, zoom, WALL_FILL_COLOR, 0.7, false, anchor);
    } else {
    strokeHexBorderBatch(ctx, coverPath, zoom, COVER_BORDER_COLOR, false);
    strokeHexBorderBatch(ctx, tallCoverPath, zoom, TALL_COVER_BORDER_COLOR, false);
    strokeHexBorderBatch(ctx, softWallPath, zoom, WALL_FILL_COLOR, false);
    }
  };

  // Token-driven overlays, drawn straight onto the screen every frame on top
  // of the terrain cache: AOO areas, the selected token's range bands, and
  // effect areas. Each only visits the hexes it covers (hexesInRadius), never
  // the whole map, so the cost is bounded by the overlays' own size — at
  // most a few thousand hexes even with the range overlay's 3 bands.
  const drawOverlays = (ctx, camera, width, height) => {
    const zoom = camera.zoom;
    const margin = HEX_SIZE * zoom * 1.5;

    // Adds each hex in `list` that is on the map and on screen to `path`,
    // growing `box` (screen-space bounds of what was added) if given.
    const addHexes = (path, list, box) => {
      let added = false;
      for (const { q, r } of list) {
        const row = r + (q - (q & 1)) / 2;
        if (q < 0 || q >= map.cols || row < 0 || row >= map.rows) continue;
        const [wx, wz] = axialToWorld(q, r);
        const [cx, cy] = project(wx, wz, camera);
        if (cx < -margin || cx > width + margin || cy < -margin || cy > height + margin) continue;
        addHexToPath2D(path, cx, cy, HEX_SIZE, zoom);
        added = true;
        if (box) {
          box.minX = Math.min(box.minX, cx - margin); box.maxX = Math.max(box.maxX, cx + margin);
          box.minY = Math.min(box.minY, cy - margin); box.maxY = Math.max(box.maxY, cy + margin);
        }
      }
      return added;
    };

    // AOO: one fill per token, so overlapping areas stack.
    ctx.globalAlpha = AOE_FILL_ALPHA;
    for (const token of tokens) {
      if (!token.aoeRadius || token.hidden) continue;
      const path = new Path2D();
      if (!addHexes(path, hexesInRadius(token.q, token.r, token.aoeRadius))) continue;
      ctx.fillStyle = resolveTokenColor(token);
      ctx.fill(path);
    }
    ctx.globalAlpha = 1;

    // Range bands around the selected token: plain tints, one path per band.
    const selectedToken = showRangeOverlay && selectedTokenId != null ? tokensById.get(selectedTokenId) : null;
    if (selectedToken) {
      const bandHexes = new Map(); // tint -> hexes
      for (const h of hexesInRadius(selectedToken.q, selectedToken.r, LAST_TINTED_BAND * RANGE_BAND_SIZE)) {
        const tint = BAND_TINTS[rangeBand(hexDistance(selectedToken, h))];
        if (!tint) continue;
        const list = bandHexes.get(tint);
        if (list) list.push(h);
        else bandHexes.set(tint, [h]);
      }
      for (const [tint, list] of bandHexes) {
        const path = new Path2D();
        if (!addHexes(path, list)) continue;
        ctx.fillStyle = `rgba(${tint}, ${BAND_TINT_ALPHA})`;
        ctx.fill(path);
      }
    }

    // Effect areas, in list order so later-placed effects stack on top.
    // Hatched effects get a faint tint under their lines so the area reads
    // as one region; the hatch sweep is limited to the effect's own screen
    // bounds and pinned to the camera so it pans with the map.
    for (const effect of visibleEffects) {
      const bucket = makeBucket();
      const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      bucket.used = addHexes(bucket.path, hexesInRadius(effect.q, effect.r, effect.radius ?? 0), box);
      if (!bucket.used) continue;
      const alpha = effectOpacity(effect);
      ctx.fillStyle = effect.color;
      ctx.globalAlpha = effect.hatched ? alpha * EFFECT_HATCH_TINT : alpha;
      ctx.fill(bucket.path);
      ctx.globalAlpha = 1;
      if (effect.hatched) {
        fillHatchedBucket(ctx, bucket, box, zoom, effect.color, alpha, true, camera);
      }
    }
  };

  const renderTerrain = (ctx, camera, width, height) => {
    const bundle = collectTerrain(camera, width, height);
    for (let phase = 1; phase <= 3; phase++) drawTerrainPhase(ctx, bundle, phase);
  };

  // Re-renders just the part of the terrain cache that `cells` (grid-cell
  // indexes whose terrain changed) can affect, in place. The patch is the
  // changed hexes' bounding box, padded by a hex and a half so neighbors'
  // borders (which reach past their own hex edge) are included, and snapped
  // to whole device pixels: an unaliased rectangular clip means the redrawn
  // area meets the untouched cache with no seam. Inside it, every hex that
  // can reach the rectangle is rendered through all three phases, exactly as
  // a full render would, so layering and grid lines come out identical.
  // Returns false when the patch would be too large to be worth it.
  const patchCache = (cache, cells, dpr) => {
    const cacheCamera = { x: cache.camX - cache.originX, y: cache.camY - cache.originY, zoom: cache.zoom };
    const pad = HEX_SIZE * cache.zoom * 1.5 + 2;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const i of cells) {
      const { q, r } = oddqToAxial(Math.floor(i / map.rows), i % map.rows);
      const [wx, wz] = axialToWorld(q, r);
      const [cx, cy] = project(wx, wz, cacheCamera);
      minX = Math.min(minX, cx - pad); maxX = Math.max(maxX, cx + pad);
      minY = Math.min(minY, cy - pad); maxY = Math.max(maxY, cy + pad);
    }
    const x0 = Math.max(0, Math.floor(minX * dpr));
    const y0 = Math.max(0, Math.floor(minY * dpr));
    const x1 = Math.min(cache.pixelW, Math.ceil(maxX * dpr));
    const y1 = Math.min(cache.pixelH, Math.ceil(maxY * dpr));
    // Changed hexes entirely outside the cached area: nothing to redraw.
    if (x1 <= x0 || y1 <= y0) return true;
    if ((x1 - x0) * (y1 - y0) > cache.pixelW * cache.pixelH * MAX_PATCH_AREA_FRACTION) return false;

    const cctx = cache.canvas.getContext("2d", { alpha: false });
    cctx.save();
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.beginPath();
    cctx.rect(x0, y0, x1 - x0, y1 - y0);
    cctx.clip();
    cctx.fillStyle = BG_COLOR;
    cctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // Render in patch-local CSS coords (origin at the patch corner). The
    // offset is a whole number of device pixels, so the grid lines' pixel
    // snapping lands exactly where the full render put it.
    const ox = x0 / dpr;
    const oy = y0 / dpr;
    cctx.setTransform(dpr, 0, 0, dpr, x0, y0);
    const bundle = collectTerrain(
      { x: cacheCamera.x - ox, y: cacheCamera.y - oy, zoom: cache.zoom },
      (x1 - x0) / dpr,
      (y1 - y0) / dpr
    );
    bundle.hatchAnchor = { x: -ox, y: -oy };
    for (let phase = 1; phase <= 3; phase++) drawTerrainPhase(cctx, bundle, phase);
    cctx.restore();
    return true;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !map || !terrainStates || size.width === 0 || canvas.width === 0) return;
    const camera = cameraRef.current;
    const zoom = camera.zoom;
    const dpr = canvas.width / size.width;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (lastReportedZoom.current !== zoom) {
      lastReportedZoom.current = zoom;
      onZoomChange?.(zoom);
    }

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, size.width, size.height);

    // Terrain comes from an offscreen cache a bit larger than the viewport.
    // Panning just blits it at an offset; it's only re-rendered when the
    // terrain, zoom or viewport size changes, or the pan outruns the
    // padding. While zoom is actively changing, the stale cache is blitted
    // scaled (slightly soft) and the real re-render waits until it settles.
    const now = performance.now();
    if (lastSeenZoom.current !== zoom) {
      lastSeenZoom.current = zoom;
      zoomChangedAt.current = now;
    }
    let cache = terrainCacheRef.current;
    const zooming = now - zoomChangedAt.current < ZOOM_SETTLE_MS;

    // Chooses the rectangle (in current-camera screen coords) to cache. If
    // the whole map fits in a sane pixel budget, cache all of it: panning
    // never needs a re-render then. Otherwise cache the viewport plus
    // padding (more of it while a zoom is in progress, so the scaled cache
    // keeps covering the viewport for longer).
    const makePlan = () => {
      let pad = zooming ? TERRAIN_CACHE_ZOOM_PAD : TERRAIN_CACHE_PAD;
      while (
        pad > TERRAIN_CACHE_PAD &&
        (size.width + pad * 2) * (size.height + pad * 2) * dpr * dpr > TERRAIN_CACHE_MAX_PIXELS
      ) {
        pad -= 64;
      }
      pad = Math.max(pad, TERRAIN_CACHE_PAD);
      const plan = {
        originX: -pad,
        originY: -pad,
        cssWidth: size.width + pad * 2,
        cssHeight: size.height + pad * 2,
        coversMap: false,
      };
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [col, row] of [[0, 0], [map.cols - 1, 0], [0, map.rows - 1], [map.cols - 1, map.rows - 1]]) {
        const { q, r } = oddqToAxial(col, row);
        const [wx, wz] = axialToWorld(q, r);
        const [px, py] = project(wx, wz, camera);
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
      const hexPad = HEX_SIZE * zoom * 2;
      const mapWidth = maxX - minX + hexPad * 2;
      const mapHeight = maxY - minY + hexPad * 2;
      if (mapWidth * mapHeight * dpr * dpr <= TERRAIN_CACHE_MAX_PIXELS) {
        plan.originX = Math.floor(minX - hexPad);
        plan.originY = Math.floor(minY - hexPad);
        plan.cssWidth = Math.ceil(mapWidth);
        plan.cssHeight = Math.ceil(mapHeight);
        plan.coversMap = true;
      }
      return plan;
    };

    // Gets a cleared canvas big enough for the plan, reusing `candidate`
    // unless it is too small or wastefully large (reallocating is costly).
    const prepareCanvas = (plan, candidate) => {
      const pixelW = Math.round(plan.cssWidth * dpr);
      const pixelH = Math.round(plan.cssHeight * dpr);
      let offscreen = candidate;
      if (
        !offscreen ||
        offscreen.width < pixelW ||
        offscreen.height < pixelH ||
        offscreen.width * offscreen.height > pixelW * pixelH * 4
      ) {
        offscreen = document.createElement("canvas");
        offscreen.width = pixelW;
        offscreen.height = pixelH;
      }
      const cctx = offscreen.getContext("2d", { alpha: false });
      // Clear the entire canvas, not just the used region: a reused canvas
      // can be larger than this render, and the blit's smoothing samples a
      // pixel or two past the source rect — stale content there shows up as
      // a line along the cache's edge.
      cctx.setTransform(1, 0, 0, 1, 0, 0);
      cctx.fillStyle = BG_COLOR;
      cctx.fillRect(0, 0, offscreen.width, offscreen.height);
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { canvas: offscreen, cctx, pixelW, pixelH };
    };

    const toCache = (job) => ({
      canvas: job.canvas,
      originX: job.plan.originX,
      originY: job.plan.originY,
      cssWidth: job.plan.cssWidth,
      cssHeight: job.plan.cssHeight,
      pixelW: job.pixelW,
      pixelH: job.pixelH,
      coversMap: job.plan.coversMap,
      camX: job.camX,
      camY: job.camY,
      zoom: job.zoom,
      terrainStates,
      cols: map.cols,
      rows: map.rows,
      width: size.width,
      height: size.height,
      dpr,
    });

    const jobCamera = (job) => ({
      x: job.camX - job.plan.originX,
      y: job.camY - job.plan.originY,
      zoom: job.zoom,
    });

    const startJob = (candidate) => {
      const plan = makePlan();
      return {
        plan,
        ...prepareCanvas(plan, candidate),
        camX: camera.x,
        camY: camera.y,
        zoom,
        nextCol: 0,
        phase: 1,
        index: 0,
        bundles: [],
        // Shared by every strip so seam edges are stroked once, not per strip.
        gridEdgesSeen: new Set(),
      };
    };

    // Renders the whole terrain in one go (used when the map itself changed,
    // so the stale cache must not be shown for even a few frames).
    const renderNow = () => {
      terrainJobRef.current = null;
      const job = startJob(cache?.canvas);
      renderTerrain(job.cctx, jobCamera(job), job.plan.cssWidth, job.plan.cssHeight);
      return toCache(job);
    };

    // Terrain edited but nothing else changed: patch the cache in place
    // instead of re-rendering it. Skipped while a sliced rebuild is in
    // progress (its strips would be stale), which falls through to a full
    // render as before.
    if (
      cache &&
      cache.terrainStates !== terrainStates &&
      !terrainJobRef.current &&
      cache.cols === map.cols &&
      cache.rows === map.rows &&
      cache.width === size.width &&
      cache.height === size.height &&
      cache.dpr === dpr
    ) {
      const cells = diffTerrainCells(cache.terrainStates, terrainStates);
      if (cells && patchCache(cache, cells, dpr)) cache.terrainStates = terrainStates;
    }

    const matches =
      cache &&
      cache.terrainStates === terrainStates &&
      cache.width === size.width &&
      cache.height === size.height &&
      cache.dpr === dpr;
    let scale = 1;
    if (!matches) {
      cache = terrainCacheRef.current = renderNow();
    } else {
      let reuse;
      scale = zoom / cache.zoom;
      if (scale === 1) {
        // A cache covering the whole map is valid for any pan; otherwise the
        // (panned) viewport must still lie inside the cached rectangle.
        const sx = camera.x - cache.camX;
        const sy = camera.y - cache.camY;
        reuse =
          cache.coversMap ||
          (cache.originX <= -sx &&
            cache.originY <= -sy &&
            cache.originX + cache.cssWidth >= size.width - sx &&
            cache.originY + cache.cssHeight >= size.height - sy);
      } else {
        reuse = zooming && scale >= 0.5 && scale <= 2;
        if (reuse && !cache.coversMap) {
          // A viewport-sized cache only holds part of the map, so scaling it
          // (especially down) can leave the viewport's edges uncovered —
          // parts of the map would vanish. Only reuse it while it still
          // covers the whole viewport.
          const left = camera.x + (cache.originX - cache.camX) * scale;
          const top = camera.y + (cache.originY - cache.camY) * scale;
          reuse =
            left <= 0 &&
            top <= 0 &&
            left + cache.cssWidth * scale >= size.width &&
            top + cache.cssHeight * scale >= size.height;
        }
        if (zooming) {
          clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(scheduleDraw, ZOOM_SETTLE_MS + 20);
        }
      }
      if (reuse) {
        terrainJobRef.current = null;
      } else if (zooming && scale !== 1) {
        // Mid-zoom and the stale cache cannot cover the screen: re-render now.
        cache = terrainCacheRef.current = renderNow();
        scale = 1;
      } else {
        // The zoom has settled (or a pan outran the padding): rebuild the
        // cache in time-boxed slices over the next few frames, so the app
        // stays responsive. Meanwhile the stale cache keeps being blitted
        // (scaled to the current zoom, and following pans).
        let job = terrainJobRef.current;
        if (!job || job.zoom !== zoom) {
          job = terrainJobRef.current = startJob(spareCanvasRef.current);
        }
        const sliceStart = performance.now();
        // Phase 1 collects each strip and paints its base fills; phases 2 and 3
        // then walk the stored strips, so layers still stack in the right
        // order across strip seams.
        do {
          if (job.phase === 1) {
            const last = Math.min(job.nextCol + TERRAIN_STRIP_COLS - 1, map.cols - 1);
            const bundle = collectTerrain(jobCamera(job), job.plan.cssWidth, job.plan.cssHeight, job.nextCol, last, job.gridEdgesSeen);
            drawTerrainPhase(job.cctx, bundle, 1);
            job.bundles.push(bundle);
            job.nextCol = last + 1;
            if (job.nextCol >= map.cols) {
              job.phase = 2;
              job.index = 0;
            }
          } else {
            drawTerrainPhase(job.cctx, job.bundles[job.index++], job.phase);
            if (job.index >= job.bundles.length) {
              job.phase += 1;
              job.index = 0;
            }
          }
        } while (job.phase <= 3 && performance.now() - sliceStart < TERRAIN_SLICE_MS);
        if (job.phase > 3) {
          spareCanvasRef.current = cache.canvas;
          cache = terrainCacheRef.current = toCache(job);
          terrainJobRef.current = null;
          scale = 1;
        } else {
          scheduleDraw();
        }
      }
    }
    // Cache pixel (u, v) is screen point (originX + u, originY + v) under the
    // cache's camera; map it through the current camera (scaled about the
    // origin when the cache is from a different zoom).
    // At 1:1 the offset is snapped to whole device pixels so the blit is an
    // exact copy rather than a resample.
    let tx = dpr * (camera.x + (cache.originX - cache.camX) * scale);
    let ty = dpr * (camera.y + (cache.originY - cache.camY) * scale);
    if (scale === 1) {
      tx = Math.round(tx);
      ty = Math.round(ty);
    }
    // Blit in device pixels, using the canvas's real pixel size. (Sizing the
    // destination from cssWidth * dpr instead is off by a fraction of a pixel
    // whenever that isn't a whole number, which resamples the image and makes
    // some grid lines look darker or thicker than others.)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cache.canvas, 0, 0, cache.pixelW, cache.pixelH, tx, ty, cache.pixelW * scale, cache.pixelH * scale);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawOverlays(ctx, camera, size.width, size.height);

    const copySelecting = mode === "copy" && !pastePreview;
    const copyPasting = mode === "copy" && !!pastePreview;

    // Copy mode: the current selection, as one fill plus a thin outline.
    if (mode === "copy" && selectionHexes.length) {
      const margin = HEX_SIZE * zoom * 1.5;
      const sel = new Path2D();
      for (const { q, r } of selectionHexes) {
        const [sx, sz] = axialToWorld(q, r);
        const [scx, scy] = project(sx, sz, camera);
        if (scx < -margin || scx > size.width + margin || scy < -margin || scy > size.height + margin) continue;
        addHexToPath2D(sel, scx, scy, HEX_SIZE, zoom);
      }
      ctx.fillStyle = SELECTION_FILL;
      ctx.fill(sel);
      ctx.strokeStyle = SELECTION_STROKE;
      ctx.lineWidth = 1;
      ctx.stroke(sel);
    }

    // Paste mode: a ghost of the clipboard anchored on the hovered hex,
    // showing exactly what a click would stamp (off-map cells dropped).
    // The box being dragged, dashed; red when right-dragging to deselect.
    const box = boxRef.current;
    if (mode === "copy" && box) {
      const bx = Math.min(box.x0, box.x1);
      const by = Math.min(box.y0, box.y1);
      const bw = Math.abs(box.x1 - box.x0);
      const bh = Math.abs(box.y1 - box.y0);
      ctx.save();
      ctx.fillStyle = box.erase ? BOX_DESELECT_FILL : BOX_SELECT_FILL;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = box.erase ? BOX_DESELECT_STROKE : SELECTION_STROKE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      ctx.restore();
    }

    if (copyPasting && pastePlacement) {
      const stamp = pastePlacement;
      const byColor = new Map();
      const outline = new Path2D();
      for (const c of stamp.cells) {
        const [sx, sz] = axialToWorld(c.q, c.r);
        const [scx, scy] = project(sx, sz, camera);
        const color = stampSwatch(c.state);
        let path = byColor.get(color);
        if (!path) byColor.set(color, (path = new Path2D()));
        addHexToPath2D(path, scx, scy, HEX_SIZE, zoom);
        addHexToPath2D(outline, scx, scy, HEX_SIZE, zoom);
      }
      ctx.globalAlpha = PASTE_PREVIEW_ALPHA;
      for (const [color, path] of byColor) {
        ctx.fillStyle = color;
        ctx.fill(path);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = SELECTION_STROKE;
      ctx.lineWidth = 1;
      ctx.stroke(outline);
      for (const d of stamp.doors) {
        drawDoor(ctx, camera, d.a, d.b, DOOR_TYPES[d.type].lines, DOOR_STATES[d.state].color, 0.8);
      }
    }

    if ((mode === "paint" || copySelecting) && hoveredHex) {
      const [hx, hz] = axialToWorld(hoveredHex.q, hoveredHex.r);
      const [hcx, hcy] = project(hx, hz, camera);
      const hover = new Path2D();
      addHexToPath2D(hover, hcx, hcy, HEX_SIZE, zoom);
      ctx.fillStyle = "rgba(255, 183, 3, 0.3)";
      ctx.fill(hover);
    }

    for (const door of doors || []) {
      const { type, state } = normalizeDoor(door);
      drawDoor(ctx, camera, door.a, door.b, DOOR_TYPES[type].lines, DOOR_STATES[state].color);
    }
    if (mode === "door" && hoveredVertex) {
      if (doorStart) {
        drawDoor(
          ctx, camera, doorStart, hoveredVertex,
          DOOR_TYPES[normalizeDoor({ type: doorType }).type].lines,
          DOOR_STATES[normalizeDoor({ state: doorState }).state].color,
          0.6
        );
      }
      const [vx, vy] = project(hoveredVertex[0], hoveredVertex[1], camera);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(vx, vy, Math.max(3, zoom * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    if (mode === "door" && doorStart) {
      const [sx, sy] = project(doorStart[0], doorStart[1], camera);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(4, zoom * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }

    // Effect centers: the center hex gets a border ring in the effect's
    // color, drawn like a cover border (yellow while selected). Drawn here
    // rather than baked into the terrain cache so selecting an effect
    // doesn't force a terrain re-render. Under the tokens, which float above.
    for (const effect of visibleEffects) {
      const [ex, ey] = effectAnchor(effect, camera);
      const ring = new Path2D();
      addHexToPath2D(ring, ex, ey, EFFECT_CENTER_BORDER_SIZE, zoom);
      const selected = effect.id === selectedTokenId;
      ctx.globalAlpha = selected ? 1 : effect.opacity;
      strokeHexBorderBatch(
        ctx, ring, zoom,
        selected ? "#facc15" : effect.color,
        false,
        EFFECT_BORDER_THICKNESS_RATIO
      );
      ctx.globalAlpha = 1;
    }

    // Sightline/suppression lines between token pairs — colored by the
    // source token, drawn under the token badges so the badges still read
    // clearly at each end.
    const tokenAnchor = (token) => {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      return [cx, cyBase - STAND_HEIGHT * zoom];
    };
    for (const line of lines || []) {
      const from = tokensById.get(line.fromId);
      const to = tokensById.get(line.toId);
      if (!from || !to) continue;
      const [fx, fy] = tokenAnchor(from);
      const [tx, ty] = tokenAnchor(to);
      ctx.save();
      ctx.strokeStyle = resolveTokenColor(from);
      ctx.lineWidth = Math.max(2, zoom * 0.045);
      ctx.setLineDash([zoom * 0.25, zoom * 0.18]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }

    for (const token of sortedTokens) {
      const [wx, wz] = axialToWorld(token.q, token.r);
      const [cx, cyBase] = project(wx, wz, camera);
      const cy = cyBase - STAND_HEIGHT * zoom;
      const badgeSize = HEX_SIZE * 0.95 * (token.scale || 1) * zoom;

      const opacity = token.opacity ?? 1;
      const img = token.hidden ? null : badgeCache.get(tokenBadgeKey(token));
      if (img) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, cx - badgeSize / 2, cy - badgeSize / 2, badgeSize, badgeSize);
        ctx.restore();
      }

      // Modifier icons sit at the token's top-right, packed tightly and
      // extending rightward from the corner so several can be active at once.
      const modifiers = token.hidden ? [] : token.modifiers || [];
      if (modifiers.length) {
        // The badge canvas has ~8% padding around the drawn shape, so the
        // token's visible edges are at 0.42 * badgeSize from center. Icons
        // are trimmed to their opaque pixels and drawn at a fixed height
        // (width follows each icon's own aspect), with their tops aligned
        // to the token's top edge so they never rise above it.
        const visibleHalf = badgeSize * 0.42;
        const modHeight = badgeSize * 0.3;
        const gap = modHeight * 0.20;
        const top = cy - visibleHalf;
        const leftPadding = modHeight * 0.05; // space between the token's right edge and the first icon
        let mx = cx + visibleHalf + leftPadding;
        ctx.save();
        ctx.globalAlpha = opacity;
        modifiers.forEach((key) => {
          const m = getModifierImage(key);
          if (!m) return;
          const w = modHeight * (m.sw / m.sh);
          ctx.drawImage(m.img, m.sx, m.sy, m.sw, m.sh, mx, top, w, modHeight);
          mx += w + gap;
        });
        ctx.restore();
      }

      if (token.id === selectedTokenId) {
        ctx.save();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = Math.max(2, zoom * 0.04);
        ctx.beginPath();
        ctx.moveTo(cx - badgeSize * 0.55, cy + badgeSize / 2 + 4);
        ctx.lineTo(cx + badgeSize * 0.55, cy + badgeSize / 2 + 4);
        ctx.stroke();
        ctx.restore();
      }

      if (token.hidden) continue;
      ctx.fillStyle = "#e5e5e5";
      ctx.font = `${Math.max(10, zoom * 0.15)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(token.name, cx, cy - badgeSize / 2 - 4);
    }
  };
  drawRef.current = draw;

  // Redraw (at most once per frame) whenever anything but the camera
  // changes; camera changes call scheduleDraw directly.
  useEffect(() => {
    scheduleDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, terrainStates, tokens, tokensById, sortedTokens, lines, size, mode, selectedTokenId, showRangeOverlay, hoveredHex, hoveredVertex, doorStart, doorType, doorState, doors, badgeVersion, visibleEffects, selectionHexes, pastePreview, pastePlacement]);

  // On-map hexes whose centers fall inside a screen rectangle (canvas-local
  // CSS px). Only the axial bounding box of the rectangle's unprojected
  // corners is scanned — the same trick collectTerrain uses — so a small
  // box on a huge map stays cheap.
  const hexesInScreenRect = ({ x0, y0, x1, y1 }) => {
    const camera = cameraRef.current;
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
    for (const [px, py] of [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]) {
      const [wx, wz] = unproject(px, py, camera);
      const q = (2 / 3) * (wx / HEX_SIZE);
      const r = (-1 / 3) * (wx / HEX_SIZE) + (Math.sqrt(3) / 3) * (wz / HEX_SIZE);
      qMin = Math.min(qMin, q); qMax = Math.max(qMax, q);
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
    }
    const cells = [];
    const colStart = Math.max(0, Math.floor(qMin) - 1);
    const colEnd = Math.min(map.cols - 1, Math.ceil(qMax) + 1);
    for (let col = colStart; col <= colEnd; col++) {
      const rowOffset = (col - (col & 1)) / 2;
      const rowStart = Math.max(0, Math.floor(rMin) - 1 + rowOffset);
      const rowEnd = Math.min(map.rows - 1, Math.ceil(rMax) + 1 + rowOffset);
      for (let row = rowStart; row <= rowEnd; row++) {
        const r = row - rowOffset;
        const [wx, wz] = axialToWorld(col, r);
        const [cx, cy] = project(wx, wz, camera);
        if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) cells.push({ q: col, r });
      }
    }
    return cells;
  };

  const getHexUnderPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const [wx, wz] = unproject(px, py, cameraRef.current);
    return worldToAxial(wx, wz, HEX_SIZE);
  };

  const getWorldUnderPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return unproject(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current);
  };

  const getVertexUnderPointer = (e) => {
    const [wx, wz] = getWorldUnderPointer(e);
    return nearestVertex(wx, wz);
  };

  // Removes the door whose line is nearest the pointer, if one is close
  // enough (in world units) to count as a click on it.
  const DOOR_ERASE_RADIUS = 0.35;
  const eraseDoorAtPointer = (e) => {
    const p = getWorldUnderPointer(e);
    let nearest = null;
    let nearestDist = DOOR_ERASE_RADIUS;
    for (const door of doors || []) {
      const dist = distanceToSegment(p, door.a, door.b);
      if (dist < nearestDist) {
        nearest = door;
        nearestDist = dist;
      }
    }
    if (nearest) onDoorRemove?.(nearest.id);
  };

  const getTokenUnderPointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let closest = null;
    let closestDist = Infinity;
    const camera = cameraRef.current;
    for (const token of tokens) {
      if (token.hidden) continue;
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
    // An effect is selected by clicking its center hex, never in line mode
    // (lines connect tokens only), and tokens win when one sits there. While
    // a token is selected, a click on an effect center moves the token onto
    // it instead, so tokens can still be moved into fire/smoke.
    if (closest || mode === "line") return closest;
    if (selectedTokenId != null && tokensById.has(selectedTokenId)) return null;
    const hex = worldToAxial(...unproject(px, py, camera), HEX_SIZE);
    for (let i = visibleEffects.length - 1; i >= 0; i--) {
      const effect = visibleEffects[i];
      if (effect.q === hex.q && effect.r === hex.r) return effect;
    }
    return null;
  };

  // Paints (or erases, clearing just the active layer) the hex under the
  // pointer, plus every hex on the line back to the last one painted this
  // drag. On a big, zoomed-out map each paint re-renders and saves the map,
  // so pointer events arrive further apart and the cursor can cross several
  // hexes between two of them; filling the line keeps the stroke unbroken.
  // A slow drag within one hex paints nothing new. Hexes off the map are
  // skipped.
  const paintAtPointer = (e, erase) => {
    if (mode === "door") {
      // Only right-click reaches here; a right-click also cancels a
      // half-placed door.
      setDoorStart(null);
      eraseDoorAtPointer(e);
      return;
    }
    const hex = getHexUnderPointer(e);
    const drag = dragState.current;
    const last = drag?.lastPaintedHex;
    if (last && last.q === hex.q && last.r === hex.r) return;
    if (drag) drag.lastPaintedHex = hex;
    const cells = (last ? hexLine(last, hex).slice(1) : [hex]).filter(({ q, r }) => {
      const { col, row } = axialToOddq(q, r);
      return col >= 0 && col < map.cols && row >= 0 && row < map.rows;
    });
    if (cells.length) onHexPaint?.(cells, erase);
  };

  const handlePointerDown = (e) => {
    // Right-click erases (paints normal ground) while in paint mode
    // instead of panning; middle-click and shift-click still pan.
    // Copy mode's selecting step brushes a selection the way paint mode
    // paints (right-drag deselects); its pasting step is plain clicks.
    // With the box tool it drags a rectangle instead, applied on release.
    const boxSelecting = mode === "copy" && !pastePreview && selectTool === "box";
    const brushesHexes = mode === "paint" || (mode === "copy" && !pastePreview && !boxSelecting);
    const isBrushMode = brushesHexes || boxSelecting || mode === "door";
    const isEraseButton = isBrushMode && e.button === 2;
    const isPanButton = !isEraseButton && (e.button === 2 || e.button === 1 || e.shiftKey);
    // Door mode places doors with two clicks (see handlePointerUp), so
    // only its right-click erase goes through the paint path.
    const isPaintButton =
      !isPanButton && (brushesHexes ? e.button === 0 || isEraseButton : mode === "door" && isEraseButton);
    const isBoxButton = boxSelecting && !isPanButton && (e.button === 0 || isEraseButton);

    dragState.current = {
      panning: isPanButton,
      painting: isPaintButton,
      erasing: isEraseButton,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
      lastPaintedHex: null,
      boxing: isBoxButton,
    };
    canvasRef.current.setPointerCapture(e.pointerId);

    if (isBoxButton) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      boxRef.current = { x0: x, y0: y, x1: x, y1: y, erase: isEraseButton };
      scheduleDraw();
    }

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
        updateCamera((cam) => ({ ...cam, x: cam.x + dx, y: cam.y + dy }));
        return;
      }
      if (drag.painting) {
        paintAtPointer(e, drag.erasing);
      }
      if (drag.boxing && boxRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        boxRef.current = { ...boxRef.current, x1: e.clientX - rect.left, y1: e.clientY - rect.top };
        scheduleDraw();
      }
    }
    if (mode === "paint" || mode === "copy") {
      const hex = getHexUnderPointer(e);
      setHoveredHex((prev) => (prev && prev.q === hex.q && prev.r === hex.r ? prev : hex));
    } else if (mode === "door") {
      const v = getVertexUnderPointer(e);
      setHoveredVertex((prev) => (prev && prev[0] === v[0] && prev[1] === v[1] ? prev : v));
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
    // Box select applies on release: every hex whose center is inside the
    // box, or just the hex under the pointer for a click without a drag.
    if (drag?.boxing) {
      const box = boxRef.current;
      boxRef.current = null;
      scheduleDraw();
      if (!box) return;
      let cells;
      if (drag.moved) {
        cells = hexesInScreenRect(box);
      } else {
        const hex = getHexUnderPointer(e);
        const { col, row } = axialToOddq(hex.q, hex.r);
        cells = col >= 0 && col < map.cols && row >= 0 && row < map.rows ? [hex] : [];
      }
      if (cells.length) onHexPaint?.(cells, box.erase);
      return;
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

    if (mode === "door") {
      const v = getVertexUnderPointer(e);
      if (!doorStart) {
        setDoorStart(v);
      } else if (doorStart[0] === v[0] && doorStart[1] === v[1]) {
        setDoorStart(null);
      } else {
        onDoorAdd?.(doorStart, v);
        setDoorStart(null);
      }
      return;
    }

    const hex = getHexUnderPointer(e);
    onHexClick?.(hex.q, hex.r);
  };

  // Leaving door mode, or pressing Escape, drops a half-placed door.
  useEffect(() => {
    if (mode !== "door") {
      setDoorStart(null);
      setHoveredVertex(null);
      return;
    }
    const onKey = (e) => {
      if (e.key === "Escape") setDoorStart(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  // Apply explicit slider requests by zooming about the viewport center.
  // (The camera zoom is reported to the parent from draw(), at most once per
  // frame.) Requests are a one-way channel: echoing the reported zoom back
  // into the camera would race with rapid wheel events and snap the zoom
  // back and forth.
  useEffect(() => {
    if (!zoomRequest || size.width === 0) return;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRequest.zoom));
    updateCamera((cam) => {
      if (Math.abs(cam.zoom - next) < 1e-6) return cam;
      const px = size.width / 2;
      const py = size.height / 2;
      const [wx, wz] = unproject(px, py, cam);
      const [ix, iy] = isoProject(wx, wz);
      return { zoom: next, x: px - ix * next, y: py - iy * next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomRequest]);

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
      updateCamera((cam) => {
        const [wx, wz] = unproject(px, py, cam);
        const [ix, iy] = isoProject(wx, wz);
        const delta = Math.max(-ZOOM_WHEEL_MAX_DELTA, Math.min(ZOOM_WHEEL_MAX_DELTA, e.deltaY));
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom * Math.exp(-delta * ZOOM_WHEEL_SENSITIVITY)));
        return {
          zoom: nextZoom,
          x: px - ix * nextZoom,
          y: py - iy * nextZoom,
        };
      });
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [updateCamera]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ cursor: mode === "paint" || mode === "door" || mode === "copy" ? "crosshair" : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoveredHex(null);
          setHoveredVertex(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
