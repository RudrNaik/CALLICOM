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
