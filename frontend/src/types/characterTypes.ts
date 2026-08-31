export interface Attributes {
  Expertise: number;
  Body: number;
  Intelligence: number;
  Spirit: number;
}

export interface WeaponSlot {
  name: string;
  category: string;
  family?: string;
}

export interface Equipment {
  primaryWeapon?: WeaponSlot;
  secondaryWeapon?: WeaponSlot;
  grenades?: string[];
  gadget?: string;
  gadgetAmmo?: Record<string, number>;
  armorClass?: number;
  miscGear?: string;
  [key: string]: unknown;
}

export interface Specialization {
  skill: string;
  label: string;
  details: string;
}

export interface Character {
  _id?: string;
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
  createdAt?: string;
  campaignId?: string;
  Bio?: string;
  [key: string]: unknown;
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

