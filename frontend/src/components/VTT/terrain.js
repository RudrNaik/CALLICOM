// Terrain on the VTT hex board is two independent layers per hex, per the
// Calamari map rules:
//
//   elevation — the hex's height, painted with the Elevation brush:
//     - normal: flat, no height difference
//     - highGround: fully filled cyan-tinted hex, elevated ground
//       characters can stand on
//     - highGroundStep: same tint as highGround but hashed, not filled — a
//       transition hex (steps/ladder/incline) leading up to high ground
//     - lowGround: fully filled hex sharing cover's color, sunken ground
//       characters can stand on
//     - lowGroundStep: same tint as lowGround but hashed, not filled — a
//       transition hex leading down to low ground
//
//   obstacle — what's sitting on the hex, painted with the Obstacle brush:
//     - none: nothing blocking the tile
//     - cover: green border inset from the hex edge
//     - tallCover: white border inset from the hex edge (same thickness as
//       cover)
//     - softWall: white border same as tall cover, with a hashed interior
//     - wall: fully filled white hex (full wall, blocks line of
//       sight/movement)
//     - inaccessible: fully filled hex matching the board background (off-
//       map / unusable area)
//
// Any obstacle can sit on any elevation — e.g. a soft wall on a hex of high
// ground — so a hex's terrain is the pair { elevation, obstacle }, not a
// single value. A wall or inaccessible obstacle fully covers the hex, so
// its elevation tint doesn't render underneath it, but the elevation value
// is still stored (e.g. so the wall can later be removed without losing
// the high-ground data).

export const ELEVATION = {
  normal: {
    id: "normal",
    label: "Normal Ground",
    hotkey: "1",
    swatch: "#3a3f36",
  },
  highGround: {
    id: "highGround",
    label: "High Ground",
    hotkey: "2",
    swatch: "rgba(40, 194, 211, 0.55)",
  },
  highGroundStep: {
    id: "highGroundStep",
    label: "High Ground (Step)",
    hotkey: "3",
    swatch: "rgba(40, 194, 211, 0.28)",
  },
  lowGround: {
    id: "lowGround",
    label: "Low Ground",
    hotkey: "4",
    swatch: "rgba(34, 197, 94, 0.55)",
  },
  lowGroundStep: {
    id: "lowGroundStep",
    label: "Low Ground (Step)",
    hotkey: "5",
    swatch: "rgba(34, 197, 94, 0.28)",
  },
};

export const ELEVATION_ORDER = ["normal", "highGround", "highGroundStep", "lowGround", "lowGroundStep"];

export const OBSTACLE = {
  none: {
    id: "none",
    label: "No Obstacle",
    hotkey: "1",
    swatch: "#3a3f36",
  },
  cover: {
    id: "cover",
    label: "Cover",
    hotkey: "2",
    swatch: "#22c55e",
  },
  tallCover: {
    id: "tallCover",
    label: "Tall Cover",
    hotkey: "3",
    swatch: "#f4f4f5",
  },
  softWall: {
    id: "softWall",
    label: "Soft Wall",
    hotkey: "4",
    swatch: "#a1a1aa",
  },
  wall: {
    id: "wall",
    label: "Full Wall",
    hotkey: "5",
    swatch: "#f4f4f5",
  },
  inaccessible: {
    id: "inaccessible",
    label: "Inaccessible",
    hotkey: "6",
    swatch: "#15171a",
  },
};

export const OBSTACLE_ORDER = ["none", "cover", "tallCover", "softWall", "wall", "inaccessible"];

export const DEFAULT_HEX_STATE = { elevation: "normal", obstacle: "none" };

// Hex terrain used to be a single mutually-exclusive value (one of the ids
// above). Maps saved before the elevation/obstacle split still store that
// shape in localStorage or in exported JSON, so normalize on read rather
// than migrating storage up front.
export function normalizeHexState(raw) {
  if (!raw) return DEFAULT_HEX_STATE;
  if (typeof raw === "string") {
    if (raw in ELEVATION && raw !== "normal") return { elevation: raw, obstacle: "none" };
    if (raw in OBSTACLE) return { elevation: "normal", obstacle: raw };
    return DEFAULT_HEX_STATE;
  }
  return {
    elevation: raw.elevation && raw.elevation in ELEVATION ? raw.elevation : "normal",
    obstacle: raw.obstacle && raw.obstacle in OBSTACLE ? raw.obstacle : "none",
  };
}

export const GROUND_COLOR = "#484848";
export const GROUND_LINE_COLOR = "#00000055";
export const WALL_FILL_COLOR = "#f5f5f5";
// Matches the board background exactly — an inaccessible hex should read
// as "not part of the map" rather than as a distinct dark terrain color.
export const INACCESSIBLE_FILL_COLOR = "#15171a";
export const COVER_BORDER_COLOR = "#22c55e";
export const TALL_COVER_BORDER_COLOR = "#f5f5f5";
// Soft wall's hashed interior is the same white as a full wall's fill, by
// definition, so the two always read as the same "wall" color.
export const SOFT_WALL_BORDER_COLOR = WALL_FILL_COLOR;

// High ground: fully filled cyan tint. Low ground shares cover's green, by
// definition, so the two always read as the same "steppable" color pairing.
export const HIGH_GROUND_COLOR = "#28C2D3";
export const HIGH_GROUND_FILL_ALPHA = 0.2;
export const LOW_GROUND_COLOR = COVER_BORDER_COLOR;
export const LOW_GROUND_FILL_ALPHA = 0.2;

// Border thickness as a fraction of the hex radius, measured inward from
// the edge.
export const BORDER_THICKNESS_RATIO = 0.10;

// How far the cover/tall-cover/soft-wall border ring extends past the true
// hex edge (as a fraction of hex radius) — lets two adjacent same-type
// borders overlap slightly instead of just touching, so no seam/gap shows
// between them (anti-aliasing otherwise leaves a hairline gap).
export const BORDER_OVERLAP_RATIO = 0.05;
