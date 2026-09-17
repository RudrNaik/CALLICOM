import CombatEngineer from "../../assets/classIcons/Combat_Engineer.png";
import Medic from "../../assets/classIcons/Medic.png";
import Raider from "../../assets/classIcons/Raider.png";
import Rifleman from "../../assets/classIcons/Rifleman.png";
import Sharpshooter from "../../assets/classIcons/Sharpshooter.png";
import Support from "../../assets/classIcons/Support.png";
import TechnicalEngineer from "../../assets/classIcons/Technical_Engineer.png";
import Trapper from "../../assets/classIcons/Trapper.png";

export const CLASS_ICONS = {
  Combat_Engineer: CombatEngineer,
  Medic,
  Raider,
  Rifleman,
  Sharpshooter,
  Support,
  Technical_Engineer: TechnicalEngineer,
  Trapper,
};

export const CLASS_KEYS = Object.keys(CLASS_ICONS);

// Enemies always render this red, so friendly colors are chosen from a
// palette that deliberately excludes red — friend/foe should always be
// distinguishable by color alone, never just by badge shape.
export const ENEMY_COLOR = "#ef4444";
export const DEFAULT_FRIENDLY_COLOR = "#38bdf8";
export const FRIENDLY_COLOR_PRESETS = [
  "#38bdf8", // sky
  "#003FFF",  // navy
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#f8fafc", // white
];

const imageCache = new Map();
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

export const badgeCache = new Map();

// Enemies are always the fixed enemy color; friendlies use their assigned
// color (falling back to the default) — this is the one place that
// resolution happens, so the badge cache and the draw loop never disagree.
export function resolveTokenColor(token) {
  return token.type === "enemy" ? ENEMY_COLOR : token.color || DEFAULT_FRIENDLY_COLOR;
}

export function tokenBadgeKey(token) {
  return `${token.classKey}-${token.type}-${resolveTokenColor(token)}`;
}

// Builds (and caches) an offscreen badge canvas for a token: a colored
// border shape (diamond for enemies, square for friendlies) with the class
// icon centered inside. Drawn once per class+type+color, then blitted with
// drawImage wherever that token appears — cheap regardless of grid size.
export async function getTokenBadge(classKey, type, color) {
  const isEnemy = type === "enemy";
  const resolvedColor = isEnemy ? ENEMY_COLOR : color || DEFAULT_FRIENDLY_COLOR;
  const cacheKey = `${classKey}-${type}-${resolvedColor}`;
  if (badgeCache.has(cacheKey)) return badgeCache.get(cacheKey);

  const src = CLASS_ICONS[classKey] || CLASS_ICONS.Rifleman;
  const img = await loadImage(src);

  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.translate(size / 2, size / 2);
  if (isEnemy) ctx.rotate(Math.PI / 4);
  // A square badge can safely use up to ~0.42 of the canvas half-width.
  // A diamond's *corners* sit sqrt(2) further out than its edges once
  // rotated 45°, so it needs a smaller half-size or its tips clip past
  // the canvas edge — this is what was happening before.
  const half = size * (isEnemy ? 0.3 : 0.42);
  ctx.beginPath();
  ctx.rect(-half, -half, half * 2, half * 2);
  ctx.closePath();
  // A fixed dark backing (not the team color itself) so the white icon
  // stays legible no matter which color a friendly is assigned — a
  // bright yellow/white badge would otherwise wash the icon out.
  ctx.fillStyle = "rgba(10, 10, 16, 0.42)";
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = resolvedColor;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = size * 0.02;
  ctx.strokeStyle = resolvedColor;
  ctx.stroke();
  ctx.restore();

  const iconSize = size * (isEnemy ? 0.42 : 0.6);
  ctx.drawImage(img, (size - iconSize) / 2, (size - iconSize) / 2, iconSize, iconSize);

  badgeCache.set(cacheKey, canvas);
  return canvas;
}
