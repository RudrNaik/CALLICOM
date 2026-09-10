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
  /** Running money total, earned via mission payouts (see MissionLog.payout) and, eventually, spent in Logistics. Falls back to `metadata.starting_cash` until the first mission is logged. */
  money?: number;
  multiClass?: string;
  createdAt: string;
  campaignId?: string;
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
}

// Not yet wired up — a plausible future shape for the Logistics tab
// (purchases/loot spent between missions), kept distinct from
// MissionReceipt above (which only tracks XP spending).
export interface LogisticsReceipt {
  purchases: PurchaseReciept[];
  loot: lootReciept[];
}

export interface PurchaseReciept {
    moneyDelta: number;
    itemIDPurchased: string;
}

export interface lootReciept {
    itemID: string,
    itemReason: string,
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


