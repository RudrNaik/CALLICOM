// Flat-top hex grid math (axial coordinates), based on the standard
// redblobgames formulas. World space: hexes lie flat on the XZ plane,
// Y is up.

export const HEX_SIZE = 1; // center-to-corner radius, in world units

export function hexKey(q, r) {
  return `${q},${r}`;
}

export function parseHexKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

// Offset (odd-q, vertical layout) -> axial. Lets a GM think in simple
// "column/row" terms while we store true axial coordinates internally.
export function oddqToAxial(col, row) {
  const q = col;
  const r = row - (col - (col & 1)) / 2;
  return { q, r };
}

export function axialToOddq(q, r) {
  const col = q;
  const row = r + (q - (q & 1)) / 2;
  return { col, row };
}

export function axialToWorld(q, r, size = HEX_SIZE) {
  const x = size * (1.5 * q);
  const z = size * (Math.sqrt(3) * (r + q / 2));
  return [x, z];
}

// Corner points of a flat-top hex centered at the origin, in XZ plane.
export function hexCorners(size = HEX_SIZE) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push([size * Math.cos(angle), size * Math.sin(angle)]);
  }
  return corners;
}

function axialToCube(q, r) {
  return { x: q, z: r, y: -q - r };
}

function cubeRound(x, y, z) {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);

  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;

  return { q: rx, r: rz };
}

// Inverse of axialToWorld: find the axial hex containing world point (x, z).
export function worldToAxial(x, z, size = HEX_SIZE) {
  const q = (2 / 3) * (x / size);
  const r = ((-1 / 3) * (x / size)) + ((Math.sqrt(3) / 3) * (z / size));
  return cubeRound(q, -q - r, r);
}

// Every hex on the straight line from a to b, inclusive, in order. Used to
// fill the gap when a paint drag jumps several hexes between pointer events.
// Endpoints are nudged by a tiny epsilon so a line running exactly along a
// hex edge rounds consistently to one side instead of zig-zagging.
export function hexLine(a, b) {
  const n = hexDistance(a, b);
  if (n === 0) return [{ q: a.q, r: a.r }];
  const eps = 1e-6;
  const aq = a.q + eps, ar = a.r + eps;
  const bq = b.q + eps, br = b.r + eps;
  const results = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const q = aq + (bq - aq) * t;
    const r = ar + (br - ar) * t;
    results.push(cubeRound(q, -q - r, r));
  }
  return results;
}

export function hexDistance(a, b) {
  const ac = axialToCube(a.q, a.r);
  const bc = axialToCube(b.q, b.r);
  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  );
}

// Range bands are increments of 8 hexes, starting after the hex the
// player occupies. Distance 0 -> band 0 (same hex), 1-8 -> band 1
// (Close Range), 9-16 -> band 2 (Medium Range), etc.
export const RANGE_BAND_SIZE = 8;

export function rangeBand(distance) {
  if (distance <= 0) return 0;
  return Math.ceil(distance / RANGE_BAND_SIZE);
}

export function rangeBandLabel(band) {
  if (band === 0) return "Same Hex";
  const names = ["Close", "Medium", "Long", "Extreme"];
  return names[band - 1] || `Band ${band}`;
}

// All axial hexes within `radius` hex-steps of (q, r), inclusive — used for
// AOE rings. O(radius^2) rather than scanning the whole map.
export function hexesInRadius(q, r, radius) {
  const results = [];
  for (let dx = -radius; dx <= radius; dx++) {
    const dzMin = Math.max(-radius, -dx - radius);
    const dzMax = Math.min(radius, -dx + radius);
    for (let dz = dzMin; dz <= dzMax; dz++) {
      results.push({ q: q + dx, r: r + dz });
    }
  }
  return results;
}

// The hex corner (vertex) nearest a world-space point. The nearest vertex
// of a hex tiling is always a corner of the hex containing the point, so
// only that hex's six corners need checking. Coordinates are rounded so the
// same physical vertex always yields identical values whichever adjacent
// hex it was found from.
export function nearestVertex(wx, wz, size = HEX_SIZE) {
  const { q, r } = worldToAxial(wx, wz, size);
  const [cx, cz] = axialToWorld(q, r, size);
  let best = null;
  let bestDist = Infinity;
  for (const [ux, uz] of hexCorners(size)) {
    const vx = cx + ux;
    const vz = cz + uz;
    const dist = Math.hypot(wx - vx, wz - vz);
    if (dist < bestDist) {
      bestDist = dist;
      best = [vx, vz];
    }
  }
  return [Math.round(best[0] * 1000) / 1000, Math.round(best[1] * 1000) / 1000];
}

// Distance from point p to the segment a-b, all in world space.
export function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const lenSq = dx * dx + dz * dz;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / lenSq));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz));
}

// Generate a rectangular hex grid of `cols` x `rows` hexes (odd-q offset),
// returning axial coordinates for each hex.
export function generateRectGrid(cols, rows) {
  const hexes = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      hexes.push(oddqToAxial(col, row));
    }
  }
  return hexes;
}
