import equipmentData from "../../data/Equipment.json";
import classSkills from "../../data/classSkills.json";
import gearSetData from "../../data/geasrSets.json"

/**
 * geasrSets.json are in camelCase while the names in the character objects have proper titling- this serves to just map the two values together for ease of use.
 */
const CLASS_TO_GEARSET_KEY = {
  Rifleman: "rifleman",
  Raider: "raider",
  "Technical Engineer": "technicalEngineer",
  "Combat Engineer": "combatEngineer",
  "Fire Support": "fireSupport",
  Medic: "medic",
  Sharpshooter: "sharpshooter",
  Trapper: "trapper",
};

/**
 * Price curve for gear pieces, keyed by tier (see the rules text: tier 1
 * "niche use case" up to tier 4 "requires a specific gadget/equipment").
 * A piece with a null tier (several unfinished entries in geasrSets.json
 * never got one assigned) is treated as free until it's priced.
 */
export const GEAR_TIER_PRICES = {
  1: 3000,
  2: 5000,
  3: 10000,
  4: 14000,
};

/** The 4 selectable gear slots, keyed as stored on Equipment.gearSlots. */
export const GEAR_SLOT_KEYS = ["headgear", "vest", "gloves", "equipment"];

/**
 * Gets a specific gadget, including its ammo config from equipment.json.
 * @param {string} gadgetId - ID of the gadget
 * @returns {object|null} object with the equipment's items if it exists in the equipment.json. Otherwise- null.
 */
export const getGadget = (gadgetId) => {
  return equipmentData.find((item) => item.id === gadgetId) || null;
};

/**
 * creates an Id lookup table using an array of items.
 * @param {Array} items
 * @returns {object} Mapping of item id to item
 */
export const makeIdLookup = (items) => {
  const lookup = {};
  (items || []).forEach((it) => {
    lookup[it.id] = it;
  });
  return lookup;
};

/**
 * Gets the character's gadgets based off of the information within their logs. Submunitions are separate from the gadgets despite being purchased the same way.
 * @param {Array} logs the character's logs.
 * @returns {Array<string>} a string array of gadgets that have been purchased.
 */
export const getPurchasedGadgetIds = (logs) => {
  const ids = new Set();
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "gadget" || purchase.type === "submunition") {
        ids.add(purchase.value);
      }
    });
  });
  return [...ids];
};

/**
 * Gets the weapons a character has purchased based off of information within their logs.
 * @param {Array} logs the character's logs.
 * @returns {Array<{name: string, category: string, family: string}>} An array of weapons along with the selected category and family they belong to.
 */
export const getPurchasedWeapons = (logs) => {
  const weapons = [];
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "weapon") weapons.push(purchase.value);
    });
  });
  return weapons;
};

/**
 * Gets all of the grenades a character has purchased through their logs.
 * @param {Array} logs - character.logs
 * @returns {Array<string>} An array of grenade options that have been purchased.
 */
export const getPurchasedGrenadeIds = (logs) => {
  const ids = new Set();
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "grenade") ids.add(purchase.value);
    });
  });
  return [...ids];
};

/**
 * Get the available class gadgets for a character, however- does not include subminutions purchased. These are derived from the logs a character has.
 * @param {Array} logs the character's logs.
 * @returns {Array<Object>} an array of class gadgets available to the character (have been purchased and arent submunitions)
 */
export const getAvailableClassGadgets = (logs) => {
  const owned = getPurchasedGadgetIds(logs);
  return equipmentData.filter(
    (item) => owned.includes(item.id) && !item.SubMunition,
  );
};

/**
 * Gets all the eligible gadgets for a character's class.
 * @param {object} character
 * @param {Array} equipmentData - full equipment data list
 * @returns {Array}
 */
export const getClassEligibleGadgets = (character) => {
  return equipmentData.filter(
    (item) =>
      (item.class === character.class || item.class === character.multiClass) &&
      !item?.SubMunition,
  );
};

/**
 * Gets the available grenades for a character, derived from their logs and what have been purchased.
 * @param {Array} logs character.logs
 * @returns {Array<string>} A string array of all the grenade ID's purchased.
 */
export const getOwnedGrenades = (logs) => {
  const owned = getPurchasedGrenadeIds(logs);
  return equipmentData.filter(
    (item) => item?.parentId === "grenades" && owned.includes(item.id),
  );
};

/**
 * Checks items within a character's equipment and santizies it based off  of what the character has purchased. Essentially- its a blocker to ensure the frontend, when re-rendering or making changes will run this and ensure your gear is only what you have purchasedd.
 * @param {object} equipment
 * @param {Array} logs character.logs
 * @returns {object} a new equipment object with any equipment slots with equipment that hasnt been purchased empty.
 */
export const sanitizeEquipmentOwnership = (equipment, logs) => {
  const base = equipment ?? {};
  const ownedGadgetIds = getPurchasedGadgetIds(logs);
  const ownedWeapons = getPurchasedWeapons(logs);
  const ownedGrenadeIds = getPurchasedGrenadeIds(logs);

  const sanitized = { ...base };

  if (sanitized.gadget && !ownedGadgetIds.includes(sanitized.gadget)) {
    sanitized.gadget = "";
    sanitized.gadgetAmmo = {};
  }

  ["primaryWeapon", "secondaryWeapon"].forEach((slot) => {
    const weapon = sanitized[slot];
    if (!weapon?.category) return;

    const stillOwned = ownedWeapons.some(
      (w) =>
        w.name === weapon.name &&
        w.category === weapon.category &&
        (w.family || "") === (weapon.family || ""),
    );
    if (!stillOwned) {
      sanitized[slot] = { name: "", category: "", family: "" };
    }
  });

  if (Array.isArray(sanitized.grenades)) {
    sanitized.grenades = sanitized.grenades.map((id) =>
      id && !ownedGrenadeIds.includes(id) ? "" : id,
    );
  }

  if (sanitized.gearSlots) {
    const ownedGearPieceIds = getPurchasedGearPieceIds(logs);
    const nextGearSlots = { ...sanitized.gearSlots };
    Object.keys(nextGearSlots).forEach((slotKey) => {
      if (
        nextGearSlots[slotKey] &&
        !ownedGearPieceIds.includes(nextGearSlots[slotKey])
      ) {
        nextGearSlots[slotKey] = "";
      }
    });
    sanitized.gearSlots = nextGearSlots;
  }

  return sanitized;
};

/**
 * returns the max armor class for a character. For Support and Engineer classes (T-Eng, C-Eng, F-Sup, Medic) they can go to a max of AC2.
 * @param {object} character the character in question
 * @returns {number} the max armor class a character can have.
 */
export const getArmorClassCap = (character) => {
  if (
    character.class === "Combat Engineer" ||
    character.class === "Technical Engineer" ||
    character.class === "Medic" ||
    character.class === "Fire Support"
  ) {
    return 2;
  }
  return 1;
};

/**
 * Finds the secondary/intrinsice/innate (We have too many words for this) gadget for a character based off their multiclass and class.
 * @param {object} character le character.
 * @param {"main"|"multi"} source either 'main' or 'multi' to determine wether to return the main class or the mutliclass's secondary gadget.
 * @returns {null | object} the class gadget's JSON data, if there is no class gadget associated with the class, then null.
 */
export const getSecondaryGadgetForClass = (character, source = "main") => {
  const className = source === "multi" ? character.multiClass : character.class;
  if (className && classSkills[className]) {
    return classSkills[className].classGadget;
  }
  return null;
};

/**
 * Returns the extra rules associated with a character's armor class.
 * @param {number} armorClass the character's armor class.
 * @returns {string|null} return the flavor text associated with the AC.
 */
export const getArmorClassDescription = (armorClass) => {
  if (armorClass == 0) {
    return "No maluses for sprinting and shooting, +1 to [Acrobatics][Jump][Climb][Endurance][Stealth]";
  }
  if (armorClass == 1) {
    return "No Bonuses";
  }
  if (armorClass == 2) {
    return "-1 to movement related checks [Acrobatics][Jump][Climb][Endurance]";
  }
  if (armorClass >= 3 || armorClass < 0) {
    return "[N/A // Cannot have an AC past 2 or less than 0.]";
  }
};

/*
--------------------- GEARSET STUFF ---------------------
*/

/**
 * Takes the gearset slot's key and converts it into a title.
 */
const gearSlotKeyToTitle = (slotKey) =>
  slotKey.charAt(0).toUpperCase() + slotKey.slice(1);

/**
 * Gets all of the gearsets a character has access to, derived from gearsets.json. If a gearset isnt within a character's multiclass or base class, it's blocked unless a part of the universal sets.
 * @param {object} character
 * @returns {Array<object>} gearset pieces as objects ({id, name, manufacturer, pieces})
 */
export const getGearsetsForClass = (character) => {
  const classKeys = [character?.class, character?.multiClass]
    .map((cls) => CLASS_TO_GEARSET_KEY[cls])
    .filter(Boolean);
  return (gearSetData ?? [])
    .filter(
      (block) => classKeys.includes(block.class) || block.class === "universal",
    )
    .flatMap((block) => block.gearsets ?? []);
};

/**
 * Pieces available for one gear slot across a set of gearsets, each
 * annotated with which gearset it belongs to (for grouping/labeling in a
 * selector).
 * @param {Array} gearsets - as returned by getGearsetsForClass
 * @param {string} slotKey - one of GEAR_SLOT_KEYS
 * @returns {Array}
 */
export const getGearPiecesBySlot = (gearsets, slotKey) => {
  const slotTitle = gearSlotKeyToTitle(slotKey);
  return (gearsets ?? []).flatMap((gearset) =>
    (gearset.pieces ?? [])
      .filter((piece) => piece.slot === slotTitle)
      .map((piece) => ({
        ...piece,
        gearsetId: gearset.id,
        gearsetName: gearset.name,
        manufacturer: gearset.manufacturer,
      })),
  );
};

/**
 * Looks up a single equipped piece by id across a set of gearsets.
 * @param {Array} gearsets - as returned by getGearsetsForClass
 * @param {string} pieceId
 * @returns {object|null}
 */
export const getGearPieceById = (gearsets, pieceId) => {
  if (!pieceId) return null;
  for (const gearset of gearsets ?? []) {
    const piece = (gearset.pieces ?? []).find((p) => p.id === pieceId);
    if (piece) {
      return {
        ...piece,
        gearsetId: gearset.id,
        gearsetName: gearset.name,
        manufacturer: gearset.manufacturer,
      };
    }
  }
  return null;
};

/**
 * Determines whether all 4 gear slots are filled with pieces belonging to
 * the same complete gearset, and if so returns that gearset's Patch piece —
 * the loyalty bonus, only active while the full set (Headgear/Vest/Gloves/
 * Equipment) is equipped. Gearsets missing one of the 4 slots (unfinished
 * entries in geasrSets.json) can never activate their patch this way.
 * @param {Array} gearsets - as returned by getGearsetsForClass
 * @param {object} gearSlots - character.equipment.gearSlots
 * @returns {object|null} the Patch piece (annotated with gearset info), or null
 */
export const getActiveGearsetPatch = (gearsets, gearSlots) => {
  for (const gearset of gearsets ?? []) {
    const pieces = gearset.pieces ?? [];
    const requiredPieces = GEAR_SLOT_KEYS.map((slotKey) =>
      pieces.find((p) => p.slot === gearSlotKeyToTitle(slotKey)),
    );
    if (requiredPieces.some((piece) => !piece)) continue;

    const fullyEquipped = GEAR_SLOT_KEYS.every(
      (slotKey, i) => gearSlots?.[slotKey] === requiredPieces[i].id,
    );
    if (!fullyEquipped) continue;

    const patchPiece = pieces.find((p) => p.slot === "Patch");
    if (!patchPiece) continue;
    return {
      ...patchPiece,
      gearsetId: gearset.id,
      gearsetName: gearset.name,
      manufacturer: gearset.manufacturer,
    };
  }
  return null;
};

/**
 * A gear piece's price, from its tier. Patches are never sold on their own
 * (they're the loyalty bonus for owning the full set), but this doesn't
 * special-case that — callers simply never list Patch pieces for purchase.
 * @param {object} piece - a piece as returned by getGearPiecesBySlot/getGearPieceById
 * @returns {number}
 */
export const getGearPieceCost = (piece) =>
  piece?.tier == null ? 9999999999999 : (GEAR_TIER_PRICES[piece.tier] ?? 0);

/**
 * Looks up a gear piece by id across every class's gearsets (not just one
 * character's eligible ones) — used when re-pricing a purchase record
 * live, which has no character context of its own.
 * @param {Array} gearSetsData - geasrSets.json
 * @param {string} pieceId
 * @returns {object|null}
 */
export const getGearPieceByIdAnyClass = (gearSetsData, pieceId) => {
  if (!pieceId) return null;
  for (const block of gearSetsData ?? []) {
    const found = getGearPieceById(block.gearsets ?? [], pieceId);
    if (found) return found;
  }
  return null;
};

/**
 * Derives every gear piece id a character has ever purchased from their
 * mission logs' receipts — mirrors getPurchasedGadgetIds/GrenadeIds. Nothing
 * about ownership is stored on Equipment itself; what's currently equipped
 * (Equipment.gearSlots) and what's owned are two different things, same as
 * gadgets/weapons/grenades.
 * @param {Array} logs - character.logs
 * @returns {Array<string>}
 */
export const getPurchasedGearPieceIds = (logs) => {
  const ids = new Set();
  (logs ?? []).forEach((log) => {
    (log?.receipt?.purchases ?? []).forEach((purchase) => {
      if (purchase.type === "gearSlot") ids.add(purchase.value);
    });
  });
  return [...ids];
};

/**
 * Gear pieces a character can currently select per slot in the Gameplay
 * tab — restricted to what they've actually purchased in Logistics, same
 * pattern as getAvailableClassGadgets/getOwnedGrenades.
 * @param {Array} gearsets - as returned by getGearsetsForClass
 * @param {string} slotKey - one of GEAR_SLOT_KEYS
 * @param {Array} logs - character.logs
 * @returns {Array}
 */
export const getOwnedGearPiecesBySlot = (gearsets, slotKey, logs) => {
  const owned = getPurchasedGearPieceIds(logs);
  return getGearPiecesBySlot(gearsets, slotKey).filter((piece) =>
    owned.includes(piece.id),
  );
};

// --- Gadget Ammo Logic ---

export const MIXED_GADGETS = [
  "spec-ammo",
  "stim-pouch",
  "x89-ams",
  "ugl",
  "demo-dog",
  "ammo-bag",
];

export const EX_KEY = "__uses";
export const MAG_KEY = "__mag";
export const RES_KEY = "__res";

export const isMixedGadget = (gadgetId) => MIXED_GADGETS.includes(gadgetId);
export const isExpendableGadget = (gadgetId, config = null) => {
  if (!config || typeof config !== "object") return false;
  if (isMixedGadget(gadgetId)) return false;
  const max = getGadgetAmmoMax(config);
  return Number.isFinite(max) && max > 0;
};

export const clamp0 = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);

export const getGadgetAmmoMax = (config = {}) => {
  const directMax = [
    config.max,
    config.maxGrenades,
    config.maxRounds,
    config.maxStims,
    config.maxSpecAmmo,
    config.maxBatches,
    config.maxStowedAmmo,
  ].find((value) => Number.isFinite(value) && Number(value) > 0);

  if (Number.isFinite(directMax)) {
    return Number(directMax);
  }

  const rulesText =
    typeof config.rulesText === "string" ? config.rulesText : "";
  const match = rulesText.match(
    /(?:Ammo|Charges|Rounds?|Uses|Capacity)\s*:?\s*(\d+)/i,
  );
  return match ? Number(match[1]) : 0;
};

/**
 * Calculates effective ammo pool, accounts for Combat Engineers having 2x ammo.
 */
export const getEffectiveMax = (gadgetId, classGadget, config) => {
  let base = getGadgetAmmoMax(config) || config?.max || 0;
  if (
    isExpendableGadget(gadgetId, config) &&
    classGadget === "Extra Rounds" &&
    (gadgetId === "rocket-launcher" ||
      gadgetId === "wire-launcher" ||
      gadgetId === "guided-launcher")
  ) {
    base *= 2;
  }
  return base;
};

/**
 * Determines the title and max ammo for a gadget.
 */
export const getGadgetAmmoHeader = (
  gadgetId,
  config,
  isExpendable,
  effectiveMax,
) => {
  if (gadgetId === "stim-pouch")
    return { title: "Stimulants", max: config?.maxStims ?? 0 };
  if (gadgetId === "ugl")
    return { title: "40mm Rounds", max: config?.maxGrenades ?? 0 };
  if (gadgetId === "x89-ams")
    return { title: "Mortar Shells", max: config?.maxRounds ?? 0 };
  if (gadgetId === "spec-ammo")
    return { title: "Special Ammo", max: config?.maxSpecAmmo ?? 0 };
  if (gadgetId === "thinkpad") return { title: "Hacks", max: 0 };
  if (gadgetId === "demo-dog")
    return { title: "Variant", max: config?.maxStowedAmmo ?? 0 };
  if (gadgetId === "ammo-bag")
    return { title: "Type", max: config?.maxBatches ?? 0 };
  if (isExpendable) return { title: "Munitions", max: effectiveMax };
  return { title: "", max: 0 };
};

/**
 * Checks if a gadget explicitly has an ammo count. Some gadgets dont have ammo and are instead function outside of this.
 */
export const hasExplicitGadgetAmmo = (
  gadgetId,
  config,
  isMixed,
  isExpendable,
) => {
  if (!config || typeof config !== "object") return false;
  if (isMixed || isExpendable) return true;

  if (Array.isArray(config.options) && config.options.length > 0) {
    return true;
  }

  if (
    Number.isFinite(getGadgetAmmoMax(config)) &&
    getGadgetAmmoMax(config) > 0
  ) {
    return true;
  }

  return false;
};

/**
 * Generates the header text description for a gadget.
 */
export const getGadgetAmmoText = (
  gadgetId,
  config,
  isExpendable,
  effectiveMax,
) => {
  if (!config) return null;
  if (gadgetId === "ugl" && config.maxGrenades != null)
    return `Max ${config.maxGrenades} rounds.`;
  if (gadgetId === "x89-ams" && config.maxRounds != null)
    return `Choose up to ${config.maxRounds} shells.`;
  if (gadgetId === "stim-pouch" && config.maxStims != null)
    return `Choose up to ${config.maxStims} stims. `;
  if (gadgetId === "spec-ammo" && config.maxSpecAmmo != null)
    return `Choose up to ${config.maxSpecAmmo} rounds `;
  if (gadgetId === "demo-dog")
    return `Select a variant. [increase to magazine size for selected variant.]`;
  if (gadgetId === "ammo-bag" && config.maxBatches != null)
    return `Choose up to ${config.maxBatches} charges`;
  if (isExpendable) return `Max: ${effectiveMax}x rounds/grenades/charges.`;
  return null;
};

/**
 * Sanitizes gadget ammo data for storage and state.
 */
export const sanitizeGadgetAmmo = (
  obj,
  isMixed,
  isExpendable,
  optionIds,
  effectiveMax,
) => {
  const out = {};
  if (!obj || typeof obj !== "object") return out;

  if (isMixed) {
    for (const [k, v] of Object.entries(obj)) {
      if (!optionIds.has(k)) continue;
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : -1;
    }
    return out;
  }

  if (isExpendable) {
    if (Object.prototype.hasOwnProperty.call(obj, EX_KEY)) {
      const n = Number(obj[EX_KEY]);
      out[EX_KEY] = Number.isFinite(n) ? clamp0(Math.min(n, effectiveMax)) : 0;
      return out;
    }

    const hasLegacyMagRes =
      Object.prototype.hasOwnProperty.call(obj, MAG_KEY) ||
      Object.prototype.hasOwnProperty.call(obj, RES_KEY);
    if (!hasLegacyMagRes) {
      // No ammo state recorded at all — a gadget just selected, not one
      // that's been fired down — so it starts full. A real 0 is only ever
      // reached afterward, by using ammo down (see useExpendableGadget),
      // which always leaves EX_KEY set and is caught by the branch above.
      out[EX_KEY] = effectiveMax;
      return out;
    }

    const mag = clamp0(obj[MAG_KEY]);
    const res = clamp0(obj[RES_KEY]);
    const total = Math.min(mag + res, effectiveMax);
    out[EX_KEY] = total;
    return out;
  }

  return out;
};

/**
 * Sums non-negative values in an object.
 */
export const sumNonNeg = (obj) =>
  Object.values(obj || {}).reduce((a, n) => a + Math.max(0, Number(n || 0)), 0);

/**
 * Determines the initial ammo state for a gadget, sanitized from whatever is
 * currently stored on the character's equipment.gadgetAmmo.
 * @param {string} gadgetId - ID of the gadget
 * @param {string} classGadget - Character's class gadget (secondary gadget)
 * @param {object} config - Gadget configuration
 * @param {object} currentAmmo - Ammo state currently stored on the character
 * @returns {object} The initial ammo object
 */
export const getInitialGadgetAmmo = (
  gadgetId,
  classGadget,
  config,
  currentAmmo = {},
) => {
  const isMixed = isMixedGadget(gadgetId);
  const isExpendable = isExpendableGadget(gadgetId, config);
  const effectiveMax = getEffectiveMax(gadgetId, classGadget, config);
  const options = config?.options || [];
  const optionIds = new Set(options.map((o) => o.id));

  if (isMixed || isExpendable) {
    return sanitizeGadgetAmmo(
      currentAmmo,
      isMixed,
      isExpendable,
      optionIds,
      effectiveMax,
    );
  }
  return {};
};

/**
 * Updates the ammo value for a mixed gadget and enforces the pool cap.
 * @param {object} currentAmmo - Current ammo state
 * @param {string} id - Ammo type ID
 * @param {number} nextVal - New ammo count
 * @param {number} max - Total pool capacity
 * @returns {object|null} New ammo state or null if update exceeds pool cap
 */
export const updateMixedGadgetAmmo = (currentAmmo, id, nextVal, max) => {
  const next = { ...(currentAmmo || {}), [id]: nextVal };
  if (max > 0 && sumNonNeg(next) > max) return null;
  return next;
};

/**
 * Decrements the use count for an expendable gadget.
 * @param {object} currentAmmo - Current ammo state
 * @param {number} effectiveMax - The max allowed uses
 * @returns {object|null} New ammo state or null if ammo is 0
 */
export const useExpendableGadget = (currentAmmo, effectiveMax) => {
  const cur =
    Number.isFinite(currentAmmo?.[EX_KEY]) && currentAmmo[EX_KEY] >= 0
      ? currentAmmo[EX_KEY]
      : effectiveMax;
  if (cur <= 0) return null;
  return { ...(currentAmmo || {}), [EX_KEY]: cur - 1 };
};

/**
 * Resets the use count for an expendable gadget to max.
 * @param {object} currentAmmo - Current ammo state
 * @param {number} effectiveMax - The max allowed uses
 * @returns {object} New ammo state
 */
export const resupplyExpendableGadget = (currentAmmo, effectiveMax) => {
  return { ...(currentAmmo || {}), [EX_KEY]: effectiveMax };
};
