import { HEX_SIZE, axialToWorld, axialToOddq, hexCorners, hexKey, nearestVertex, parseHexKey } from "../../utils/hexGrid";
import { normalizeHexState, normalizeDoor } from "./terrain";

// Copy/paste ("stamping") of terrain. A clipboard holds the copied hexes'
// terrain as offsets from an anchor hex, plus the doors that belong to them,
// as world-space offsets from the anchor's center. Axial offsets are a
// true translation of the hex lattice, so a stamp keeps its exact shape
// wherever it is placed.

const UNIT_CORNERS = hexCorners(HEX_SIZE);

// Same rounding nearestVertex applies to door endpoints, so a corner
// computed here and a stored door endpoint compare equal as strings.
function round3(v) {
  return Math.round(v * 1000) / 1000;
}

export function vertexKey(point) {
  return `${point[0]},${point[1]}`;
}

// Keys of every corner of the given hexes. A region "owns" a door when both
// of the door's endpoints are among these.
function cornerKeys(hexes) {
  const keys = new Set();
  for (const { q, r } of hexes) {
    const [cx, cz] = axialToWorld(q, r);
    for (const [ux, uz] of UNIT_CORNERS) keys.add(`${round3(cx + ux)},${round3(cz + uz)}`);
  }
  return keys;
}

function ownsDoor(keys, door) {
  return keys.has(vertexKey(door.a)) && keys.has(vertexKey(door.b));
}

// Builds a clipboard from the selected hex keys. Every selected hex is
// copied, plain ground included, so pasting reproduces the area exactly.
// The anchor (the hex that lands under the cursor when pasting) is the
// selected hex nearest the selection's center.
export function copyHexes(map, selectionKeys) {
  const hexes = [...selectionKeys].map(parseHexKey);
  if (hexes.length === 0) return null;

  let sx = 0, sz = 0;
  for (const { q, r } of hexes) {
    const [x, z] = axialToWorld(q, r);
    sx += x;
    sz += z;
  }
  const mx = sx / hexes.length;
  const mz = sz / hexes.length;
  let anchor = hexes[0];
  let best = Infinity;
  for (const h of hexes) {
    const [x, z] = axialToWorld(h.q, h.r);
    const d = (x - mx) ** 2 + (z - mz) ** 2;
    if (d < best) {
      best = d;
      anchor = h;
    }
  }
  const [ax, az] = axialToWorld(anchor.q, anchor.r);

  const cells = hexes.map(({ q, r }) => ({
    dq: q - anchor.q,
    dr: r - anchor.r,
    state: normalizeHexState(map.hexes?.[hexKey(q, r)]),
  }));

  const keys = cornerKeys(hexes);
  const doors = (Array.isArray(map.doors) ? map.doors : [])
    .filter((d) => ownsDoor(keys, d))
    .map((d) => {
      const { type, state } = normalizeDoor(d);
      return { a: [d.a[0] - ax, d.a[1] - az], b: [d.b[0] - ax, d.b[1] - az], type, state };
    });

  return { cells, doors };
}

// Places a clipboard with its anchor on hex (q, r): the target cells that
// fall on the map, the doors whose endpoints both land on corners of those
// cells, and the corner keys of the stamped area (so the paste can replace
// whatever doors the area already had).
export function placeClipboard(clipboard, q, r, map) {
  const cells = [];
  for (const c of clipboard.cells) {
    const tq = q + c.dq;
    const tr = r + c.dr;
    const { col, row } = axialToOddq(tq, tr);
    if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) continue;
    cells.push({ q: tq, r: tr, state: c.state });
  }
  const vertexKeys = cornerKeys(cells);
  const [ax, az] = axialToWorld(q, r);
  const doors = [];
  for (const d of clipboard.doors) {
    // Snap back onto the exact lattice corner (the offsets carry rounding).
    const a = nearestVertex(ax + d.a[0], az + d.a[1]);
    const b = nearestVertex(ax + d.b[0], az + d.b[1]);
    if (vertexKeys.has(vertexKey(a)) && vertexKeys.has(vertexKey(b))) {
      doors.push({ a, b, type: d.type, state: d.state });
    }
  }
  return { cells, doors, vertexKeys };
}

// Existing doors a stamp replaces: the ones owned by the stamped area.
export function isDoorReplacedByStamp(door, vertexKeys) {
  return ownsDoor(vertexKeys, door);
}
