// Terrain types for the VTT hex board, per the Calamari map rules:
// - normal: open ground, move freely
// - cover: green border inset from the hex edge
// - tallCover: white border inset from the hex edge (same thickness as cover)
// - softWall: white border same as tall cover, with a hashed interior
// - wall: fully filled white hex (full wall, blocks line of sight/movement)
// - inaccessible: fully filled black hex (off-map / unusable area)

export const TERRAIN = {
  normal: {
    id: "normal",
    label: "Normal Ground",
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

export const TERRAIN_ORDER = ["normal", "cover", "tallCover", "softWall", "wall", "inaccessible"];

export const GROUND_COLOR = "#484848";
export const GROUND_LINE_COLOR = "#00000055";
export const WALL_FILL_COLOR = "#f5f5f5";
export const INACCESSIBLE_FILL_COLOR = "#050505";
export const COVER_BORDER_COLOR = "#22c55e";
export const TALL_COVER_BORDER_COLOR = "#f5f5f5";
// Soft wall's hashed interior is the same white as a full wall's fill, by
// definition, so the two always read as the same "wall" color.
export const SOFT_WALL_BORDER_COLOR = WALL_FILL_COLOR;

// Border thickness as a fraction of the hex radius, measured inward from
// the edge.
export const BORDER_THICKNESS_RATIO = 0.10;

// How far the cover/tall-cover/soft-wall border ring extends past the true
// hex edge (as a fraction of hex radius) — lets two adjacent same-type
// borders overlap slightly instead of just touching, so no seam/gap shows
// between them (anti-aliasing otherwise leaves a hairline gap).
export const BORDER_OVERLAP_RATIO = 0.05;
