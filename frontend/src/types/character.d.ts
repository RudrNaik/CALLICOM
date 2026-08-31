export interface Attributes {
  Expertise: number;
  Body: number;
  Intelligence: number;
  Spirit: number;
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
  equipment: {
    primaryWeapon?: {
      name: string;
      category: string;
      family: string;
    };
    secondaryWeapon?: {
      name: string;
      category: string;
      family: string;
    };
    armorClass?: number;
    [key: string]: any;
  };
  fleshWounds: number;
  deepWounds: number;
  XP: number;
  multiClass?: string;
  createdAt?: string;
  campaignId?: string;
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
