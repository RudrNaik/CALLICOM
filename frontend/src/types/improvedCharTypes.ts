export interface Attributes {
  Alertness: number;
  Body: number;
  Intelligence: number;
  Spirit: number;
  /** @deprecated Legacy field retained for backwards compatibility with older saved data. */
  Expertise?: number;
}

export interface WeaponSlot {
  name: string;
  category: string;
  family?: string;
}

export interface Equipment {
  primaryWeapon?: WeaponSlot;
  secondaryWeapon?: WeaponSlot;
  classGadget: string;
  grenades?: string[];
  gadget?: string;
  gadgetAmmo: Record<string, number>;
  armorClass: number;
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


