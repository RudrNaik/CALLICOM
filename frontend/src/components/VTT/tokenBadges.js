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

// Builds (and caches) an offscreen badge canvas for a token: a colored
// border shape (diamond for enemies, square for friendlies) with the class
// icon centered inside. Drawn once per class+type, then blitted with
// drawImage wherever that token appears — cheap regardless of grid size.
export async function getTokenBadge(classKey, type) {
  const cacheKey = `${classKey}-${type}`;
  if (badgeCache.has(cacheKey)) return badgeCache.get(cacheKey);

  const src = CLASS_ICONS[classKey] || CLASS_ICONS.Rifleman;
  const img = await loadImage(src);

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const isEnemy = type === "enemy";
  const borderColor = isEnemy ? "#ef4444" : "#38bdf8";
  const bgColor = isEnemy ? "rgba(80,10,10,0.85)" : "rgba(8,50,74,0.85)";

  ctx.save();
  ctx.translate(size / 2, size / 2);
  if (isEnemy) ctx.rotate(Math.PI / 4);
  const half = size * 0.42;
  ctx.beginPath();
  ctx.rect(-half, -half, half * 2, half * 2);
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = size * 0.06;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();

  const iconSize = size * 0.6;
  ctx.drawImage(img, (size - iconSize) / 2, (size - iconSize) / 2, iconSize, iconSize);

  badgeCache.set(cacheKey, canvas);
  return canvas;
}
