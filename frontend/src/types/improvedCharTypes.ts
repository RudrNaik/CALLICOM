export interface Attributes {
  Alertness: number;
  Body: number;
  Intelligence: number;
  Spirit: number;
}

export interface MetaData {
  starting_cash: number,
}

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

export type GadgetAmmoState = Record<string, number>;

export interface Equipment {
  primaryWeapon?: WeaponSlot;
  secondaryWeapon?: WeaponSlot;
  classGadget: string;
  grenades?: string[];
  grenadeCounts?: number[];
  gadget?: string;
  gadgetAmmo: GadgetAmmoState;
  armorClass: number;
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
  userId: string;
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
  emergencyDiceXPSpent?: number;
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
  date: string;
  achievements: Achievement[];
  receipt: MissionReceipt;
  metadata?: { starting_cash: number };
}

export interface Achievement {
  id: string;
  name: string;
  criteria: string;
  xpPayout: number;
  cashPayout: number;
}

export interface MissionReceipt {
  skills: Record<string, number>;
  attributes: Record<string, number>;
  specializations: Specialization[];
  xpSpent: number;
  emergencyDiceBefore: number;
  emergencyDiceXPSpentBefore: number;
  purchases: LogisticsPurchase[];
}

export interface LogisticsPurchase {
  type: "weapon" | "gadget" | "submunition" | "grenade" | "gearSlot";
  slot: string;
  label: string;
  value: unknown;
  source?: "looted";
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


