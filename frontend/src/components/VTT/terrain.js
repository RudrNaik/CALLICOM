// Terrain types for the VTT hex board, per the Calamari map rules:
// - normal: open ground, move freely
// - cover: green border inset from the hex edge
// - tallCover: white border inset from the hex edge (same thickness as cover)
// - softWall: white hashed border, same thickness as cover
// - wall: fully filled hex (full wall, blocks line of sight/movement)

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
    swatch: "#0a0a0a",
  },
};

export const TERRAIN_ORDER = ["normal", "cover", "tallCover", "softWall", "wall"];

export const GROUND_COLOR = "#3a3f36";
export const GROUND_LINE_COLOR = "#00000055";
export const WALL_FILL_COLOR = "#141414";
export const COVER_BORDER_COLOR = "#22c55e";
export const TALL_COVER_BORDER_COLOR = "#f5f5f5";
export const SOFT_WALL_BORDER_COLOR = "#f5f5f5";

// Border thickness as a fraction of the hex radius, measured inward from
// the edge.
export const BORDER_THICKNESS_RATIO = 0.22;
