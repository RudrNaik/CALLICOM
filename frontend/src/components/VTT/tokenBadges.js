import CombatEngineer from "../../assets/classIcons/Combat_Engineer.png";
import Medic from "../../assets/classIcons/Medic.png";
import Raider from "../../assets/classIcons/Raider.png";
import Rifleman from "../../assets/classIcons/Rifleman.png";
import Sharpshooter from "../../assets/classIcons/Sharpshooter.png";
import Support from "../../assets/classIcons/Support.png";
import TechnicalEngineer from "../../assets/classIcons/Technical_Engineer.png";
import Trapper from "../../assets/classIcons/Trapper.png";
import EliteIcon from "../../assets/classIcons/modifiers/Elite_Icon.png";
import ArmorIcon from "../../assets/classIcons/modifiers/Armor_Icon.png";
import FastIcon from "../../assets/classIcons/modifiers/Fast_Icon.png";
import RezIcon from "../../assets/classIcons/modifiers/Rez_Icon.png";
import ArmoredLightFriendly from "../../assets/classIcons/vehicles/friendlies/ArmoredLight_Friendly.png";
import GunADFriendly from "../../assets/classIcons/vehicles/friendlies/GunAD_Friendly.png";
import IFVFriendly from "../../assets/classIcons/vehicles/friendlies/IFV_Friendly.png";
import LightFriendly from "../../assets/classIcons/vehicles/friendlies/Light_Friendly.png";
import MBTFriendly from "../../assets/classIcons/vehicles/friendlies/MBT_Friendly.png";
import RotorWingFriendly from "../../assets/classIcons/vehicles/friendlies/RotorWing_Friendly.png";
import SAMADFriendly from "../../assets/classIcons/vehicles/friendlies/SAMAD_friendly.png";
import ArmoredLightEnemy from "../../assets/classIcons/vehicles/enemies/ArmoredLight_Enemy.png";
import GunADEnemy from "../../assets/classIcons/vehicles/enemies/GunAD_Enemy.png";
import IFVEnemy from "../../assets/classIcons/vehicles/enemies/IFV_enemy.png";
import LightEnemy from "../../assets/classIcons/vehicles/enemies/Light_Enemy.png";
import MBTEnemy from "../../assets/classIcons/vehicles/enemies/MBT_Enemy.png";
import RotorWingEnemy from "../../assets/classIcons/vehicles/enemies/RotorWing_Enemy.png";
import SAMADEnemy from "../../assets/classIcons/vehicles/enemies/SAMAD_Enemy.png";

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

// Vehicles share the token's classKey field with infantry classes, so a
// token becomes a vehicle just by picking one of these keys. Unlike class
// icons, each vehicle PNG is the complete badge (border included), with a
// separate friendly and enemy version.
export const VEHICLE_ICONS = {
  MBT: { label: "MBT", friendly: MBTFriendly, enemy: MBTEnemy },
  IFV: { label: "IFV", friendly: IFVFriendly, enemy: IFVEnemy },
  ArmoredLight: { label: "Armored Vehicle", friendly: ArmoredLightFriendly, enemy: ArmoredLightEnemy },
  Light: { label: "Unarmored Vehicle", friendly: LightFriendly, enemy: LightEnemy },
  GunAD: { label: "AA GUN", friendly: GunADFriendly, enemy: GunADEnemy },
  SAMAD: { label: "SAM", friendly: SAMADFriendly, enemy: SAMADEnemy },
  RotorWing: { label: "Rotary Wing", friendly: RotorWingFriendly, enemy: RotorWingEnemy },
};

export const VEHICLE_KEYS = Object.keys(VEHICLE_ICONS);

export function isVehicleKey(classKey) {
  return Object.hasOwn(VEHICLE_ICONS, classKey);
}

export function classLabel(classKey) {
  return isVehicleKey(classKey) ? VEHICLE_ICONS[classKey].label : classKey.replaceAll("_", " ");
}

export const MODIFIER_ICONS = {
  Elite: EliteIcon,
  Armor: ArmorIcon,
  Light: FastIcon,
  Rez: RezIcon,
};

export const MODIFIER_KEYS = Object.keys(MODIFIER_ICONS);

// Each entry is { img, sx, sy, sw, sh } where the rect is the icon's opaque
// pixel bounds — the source PNGs share one canvas size but have different
// amounts of transparent padding, so drawing them untrimmed makes some look
// thinner (and spaced further apart) than others.
const modifierImages = new Map();
function opaqueBounds(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cctx = c.getContext("2d", { willReadFrequently: true });
  cctx.drawImage(img, 0, 0);
  const data = cctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { img, sx: 0, sy: 0, sw: w, sh: h };
  return { img, sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
}
export function preloadModifierIcons() {
  return Promise.all(
    MODIFIER_KEYS.map((key) =>
      loadImage(MODIFIER_ICONS[key]).then((img) => {
        if (!modifierImages.has(key)) modifierImages.set(key, opaqueBounds(img));
      })
    )
  );
}
export function getModifierImage(key) {
  return modifierImages.get(key);
}

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

  if (isVehicleKey(classKey)) {
    const canvas = await buildVehicleBadge(classKey, type, resolvedColor);
    badgeCache.set(cacheKey, canvas);
    return canvas;
  }

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
  ctx.lineWidth = size * 0.04;
  ctx.strokeStyle = resolvedColor;
  ctx.stroke();
  ctx.restore();

  const iconSize = size * (isEnemy ? 0.42 : 0.6);
  ctx.drawImage(img, (size - iconSize) / 2, (size - iconSize) / 2, iconSize, iconSize);

  badgeCache.set(cacheKey, canvas);
  return canvas;
}

// Extra line thickness (in badge-canvas pixels) added around every stroke
// of a vehicle PNG. The source art is scaled down to fit the badge, which
// thins its lines below the class badges' border width.
const VEHICLE_LINE_BOOST = 0.5;

// Vehicle PNGs already carry their border, so the badge is the PNG itself,
// trimmed to its opaque pixels and fitted into the same 0.84-of-canvas box
// the class badges' shapes occupy (keeping modifier icon placement and
// on-map size consistent). Built in two layers:
//  1. Outline: the PNG thickened by stamping it at small offsets in a ring
//     (a cheap dilation). The PNGs are single-color, so a "source-in" fill
//     then recolors them to the token's resolved color — the friendly's
//     assigned color, or ENEMY_COLOR so enemy vehicles match enemy infantry.
//  2. Fill: the same dark backing + color tint as the class badges, filled
//     across each row between the outline's leftmost and rightmost pixel.
//     Unlike a flood fill, this also fills the rotor-wing shapes, which
//     are open at the bottom.
async function buildVehicleBadge(classKey, type, color) {
  const isEnemy = type === "enemy";
  const vehicle = VEHICLE_ICONS[classKey];
  const img = await loadImage(isEnemy ? vehicle.enemy : vehicle.friendly);
  const { sx, sy, sw, sh } = opaqueBounds(img);

  const size = 160;
  const outline = document.createElement("canvas");
  outline.width = size;
  outline.height = size;
  const octx = outline.getContext("2d", { willReadFrequently: true });

  const box = size * 0.84;
  const fit = Math.min(box / sw, box / sh);
  const dw = sw * fit;
  const dh = sh * fit;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    octx.drawImage(
      img, sx, sy, sw, sh,
      dx + Math.cos(a) * VEHICLE_LINE_BOOST, dy + Math.sin(a) * VEHICLE_LINE_BOOST, dw, dh
    );
  }
  octx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, size, size);
  octx.globalCompositeOperation = "source-over";

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const data = octx.getImageData(0, 0, size, size).data;
  const fillPath = new Path2D();
  for (let y = 0; y < size; y++) {
    let minX = -1, maxX = -1;
    for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 4 + 3] > 64) {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
    if (maxX > minX) fillPath.rect(minX, y, maxX - minX + 1, 1);
  }
  ctx.fillStyle = "rgba(10, 10, 16, 0.42)";
  ctx.fill(fillPath);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.fill(fillPath);
  ctx.globalAlpha = 1;

  ctx.drawImage(outline, 0, 0);
  return canvas;
}
