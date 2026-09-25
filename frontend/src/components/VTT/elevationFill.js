import { axialToOddq, hexKey } from "../../utils/hexGrid";
import { normalizeHexState } from "./terrain";

// Paint-bucket fill for the elevation layer: every on-map hex connected to
// the start hex (through its six neighbors) that has the same elevation as
// the start hex. Obstacles don't block it — only a change in elevation
// does — so an area is "closed" by outlining it in a different elevation.

const NEIGHBORS = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
];

// Fills larger than this ask for confirmation first: there's no undo, and
// a gap in an outline lets a fill spread across the whole map.
export const FILL_CONFIRM_THRESHOLD = 1000;

export function elevationFillRegion(map, start) {
  const inBounds = (q, r) => {
    const { col, row } = axialToOddq(q, r);
    return col >= 0 && col < map.cols && row >= 0 && row < map.rows;
  };
  if (!inBounds(start.q, start.r)) return [];
  const elevationAt = (q, r) => normalizeHexState(map.hexes?.[hexKey(q, r)]).elevation;
  const target = elevationAt(start.q, start.r);

  const seen = new Set([hexKey(start.q, start.r)]);
  const stack = [start];
  const cells = [];
  while (stack.length) {
    const { q, r } = stack.pop();
    cells.push({ q, r });
    for (const [dq, dr] of NEIGHBORS) {
      const nq = q + dq;
      const nr = r + dr;
      const key = hexKey(nq, nr);
      if (seen.has(key) || !inBounds(nq, nr)) continue;
      seen.add(key);
      if (elevationAt(nq, nr) === target) stack.push({ q: nq, r: nr });
    }
  }
  return cells;
}
