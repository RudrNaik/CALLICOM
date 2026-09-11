export interface Attributes {
  Alertness: number;
  Body: number;
  Intelligence: number;
  Spirit: number;
}

export interface MetaData {
  starting_cash: number,
  userId: string,
}

/**
 * Per-weapon-slot ammo tracking. Lives on the WeaponSlot itself so a weapon's
 * ammo travels with the character object instead of a separate
 * `ammo_{callsign}_{slot}` localStorage entry.
 */
export interface WeaponAmmoState {
  firedThisMag: number;
  totalFired: number;
  pseudoAmmo: number | null;
}

export interface WeaponSlot {
  name: string;
  category: string;
  family?: string;
  ammo?: WeaponAmmoState;
}

/**
 * Gadget ammo/charge pool, keyed by option id for mixed gadgets
 * (e.g. grenade/round/stim ids) or by the reserved keys below for
 * expendables tracked as a single pool.
 *
 * Reserved keys (see equipmentEngine.js): EX_KEY ("__uses"), MAG_KEY ("__mag"),
 * RES_KEY ("__res").
 */
export type GadgetAmmoState = Record<string, number>;

/**
 * What's currently equipped. What a character is eligible to *select* here
 * (Logistics purchases: gadgets/submunitions, weapons, grenades) is never
 * stored — it's derived fresh from `Character.logs`' receipts every time
 * (see equipmentEngine.getPurchasedGadgetIds/getPurchasedWeapons/
 * getPurchasedGrenadeIds, and getAvailableClassGadgets/getOwnedGrenades/
 * weaponEngine.getOwnedWeaponCategories), so removing a mission or undoing
 * a purchase (logisticsEngine.undoLastPurchase) can't leave stale ownership
 * data behind — there's nothing to go stale. equipmentEngine.
 * sanitizeEquipmentOwnership clears any of the fields below that end up
 * pointing at something no longer purchasable after such a change.
 */
export interface Equipment {
  primaryWeapon?: WeaponSlot;
  secondaryWeapon?: WeaponSlot;
  classGadget: string;
  grenades?: string[];
  /** Remaining throws per grenades[] slot, mission-runtime state. */
  grenadeCounts?: number[];
  gadget?: string;
  gadgetAmmo: GadgetAmmoState;
  armorClass: number;
  /** Remaining uses [AFAK, IFAK, Painkiller], mission-runtime state. */
  medCounts?: number[];
  miscGear: string;
  gearSlots : {
    headgear?: string;
    vest?: string;
    equipment?: string;
    gloves?: string;
  }
}

export interface Specialization {
  skill: string;
  label: string;
  details: string;
}

export interface Character {
  _id?: string;
  uniqueId: string;
  metadata: MetaData
  name: string;
  callsign: string;
  background: string;
  class: string;
  attributes: Attributes;
  skills: Record<string, number>;
  specializations: Specialization[];
  equipment: Equipment;
  fleshWounds: number;
  deepWounds: number;
  /**
   * Bonus/misc XP only — added to via mission logging or the "+Add XP"
   * control, never spent from directly. The character's actual spendable
   * total is derived (see characterEngine.getAvailableXP): base class
   * package + this stat + XP summed from `logs` - XP actually spent on
   * skills/attributes/specializations/multiclass/emergency dice.
   */
  XP: number;
  emergencyDice?: number;
  /**
   * Lifetime XP spent buying emergency dice above the free baseline.
   * Doesn't decrease when a die is used up in play — only when a same-session
   * purchase is undone, or when a mission whose receipt recorded it is
   * removed (see MissionReceipt).
   */
  emergencyDiceXPSpent?: number;
  multiClass?: string;
  createdAt: string;
  campaignId?: string;
  /** Empty/undefined until the UI lazily seeds a "Starting Loadout" entry (see logsEngine.ensureStartingLog) crediting `metadata.starting_cash`, so spending done before any real mission is still attached to a receipt and reversible. Money is never stored directly — it's derived from this every time via logsEngine.getMoneyTotal (mission/achievement payouts minus purchases, each re-priced live from Equipment.json). */
  logs?: MissionLog[];
  Bio?: Biography | string;
}

export interface DerivedStats {
  defense: number;
  combatSense: number;
  health: number;
  stamina: number;
  systemShock: number;
  fleshThreshold: number;
  deepThreshold: number;
  instantDeath: number;
  unarmedDamage: number;
  armedDamage: number;
  woundMod: number;
}

export interface MissionLog {
  id: string;
  name: string;
  missionXP: number;
  payout: number;
  notes: string;
  /** In-character date the mission took place ("YYYY-MM-DD"), set by the user on the form — not the real-world date it was logged. */
  date: string;
  /** Bonus objectives logged after the fact; their XP/cash add on top of missionXP/payout (see logsEngine.getMissionEarnings). */
  achievements: Achievement[];
  receipt: MissionReceipt;
  /** Only set on the synthetic "Starting Loadout" entry (see logsEngine.createStartingLog) — records the character's starting cash distinctly from an earned mission payout, for display. */
  metadata?: { starting_cash: number };
}

/**
 * A bonus XP/money award logged against a mission (e.g. an optional
 * objective). Loot-granting achievements aren't modeled yet.
 */
export interface Achievement {
  id: string;
  name: string;
  criteria: string;
  xpPayout: number;
  cashPayout: number;
}

/**
 * Exactly what a mission's XP paid for, recorded as spending happens against
 * it (see logsEngine.recordSpendOnLatestMission). Lets removing a mission
 * later reverse precisely what was bought with its XP — but only the most
 * recently logged mission's receipt is safe to unwind this way, since an
 * older one may have later missions'/spending layered on top of it.
 */
export interface MissionReceipt {
  /** Net skill-level deltas bought since this mission was logged, keyed by skill name. */
  skills: Record<string, number>;
  /** Net attribute-point deltas bought since, keyed by attribute name. */
  attributes: Record<string, number>;
  /** Specializations purchased since — always the trailing entries of `Character.specializations`, since specs are only ever appended. */
  specializations: Specialization[];
  /** Exact XP cost of everything above (skills + attributes + specializations), from the real cost tables, not just level counts. */
  xpSpent: number;
  /** `Character.emergencyDice` snapshotted the moment this mission was logged; a removal resets the count to this, discarding anything bought or used since. */
  emergencyDiceBefore: number;
  /** `Character.emergencyDiceXPSpent` snapshotted at the same moment. */
  emergencyDiceXPSpentBefore: number;
  /** Logistics purchases (see logisticsEngine.js) recorded onto this mission — the only place a purchase lives; both what's currently equipped (logisticsEngine.rebuildEquipmentFromLogs) and money (logsEngine.getMoneyTotal) are derived by replaying these across every mission, so removing this mission or selling one of these purchases (logisticsEngine.sellPurchase) needs no separate snapshot to restore. */
  purchases: LogisticsPurchase[];
}

/**
 * A single logistics purchase (see logisticsEngine.js): buying a weapon,
 * gadget, a submunition (a gadget's ammo variant, e.g. a UGL 40mm round —
 * always its own individual purchase, never bundled with the gadget itself
 * even when it costs $0), grenades (fills the first empty grenade slot, or
 * just unlocks the type without equipping it once both slots are full), or
 * (placeholder, no real catalog yet) a gear-slot item — all with the
 * character's money.
 */
export interface LogisticsPurchase {
  type: "weapon" | "gadget" | "submunition" | "grenade" | "gearSlot";
  /** Which equipment field this touches: an Equipment key for weapons/gadget/grenades, or a gearSlots key. Empty for `type: "submunition"`, which touches no equipment field — being in `purchases` is what makes it derive as owned (see equipmentEngine.getPurchasedGadgetIds). */
  slot: string;
  label: string;
  cost: number;
  /** The value written into the first empty grenades[] slot for `type: "grenade"` (or left unequipped if both are full). */
  value: unknown;
}

export interface Biography {
  bio?: string
  age?: string
  height?: string
  weight?: string
  gender?: string
  famRelations?: string
  normRelations?: string
  psych?: string
  notes?: string
}


