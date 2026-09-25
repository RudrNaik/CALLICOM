// Area effects (fire, smoke, gas, ...) are map tokens with type "effect":
// a center hex plus a radius, drawn as a colored area like an AOO ring
// rather than as a badge. Presets just seed the name/color/hatch — every
// field stays editable afterwards.
export const EFFECT_PRESETS = [
  { id: "fire", label: "Fire", color: "#f97316", hatched: false },
  { id: "smoke", label: "Smoke", color: "#9ca3af", hatched: true },
  { id: "gas", label: "Gas", color: "#84cc16", hatched: true },
];

export const EFFECT_COLOR_PRESETS = [
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#84cc16", // lime
  "#0ea5e9", // blue
  "#a855f7", // purple
  "#9ca3af", // gray
  "#f8fafc", // white
];

export const DEFAULT_EFFECT = {
  name: "",
  color: EFFECT_PRESETS[1].color,
  hatched: EFFECT_PRESETS[1].hatched,
  radius: 1,
  opacity: 0.3,
};

export const MAX_EFFECT_RADIUS = 10;
