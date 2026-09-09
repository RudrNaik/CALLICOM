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
  XP: number;
  emergencyDice?: number;
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

export interface MissionLog{
    name: string;
    missionXP: number;
    payout: number;
    achievement: Achievement[];
    reciept: Reciept;
}

export interface Achievement{
    name: string
    requirement: string
    achievementXP: number
    payout: number
}

export interface Reciept{
    XP: XpReciept[];
    loot: lootReciept[];
    purchases: PurchaseReciept[];
    money: MiscMoneyPayouts[];
}

export interface XpReciept {
    XpDelta: number;
    XpReason: string;
}

export interface PurchaseReciept {
    moneyDelta: number;
    itemIDPurchased: string;
}

export interface MiscMoneyPayouts {
    moneyDelta: number;
    moneyReason: number;
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


