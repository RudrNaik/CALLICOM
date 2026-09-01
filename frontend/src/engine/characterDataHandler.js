const isRecord = (value) => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

const unwrapNumberLike = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (!isRecord(value)) return undefined;

  const candidate =
    value.$numberInt ??
    value.$numberLong ??
    value.$numberDouble ??
    value.$numberDecimal ??
    value.value;

  if (typeof candidate === "number") return Number.isFinite(candidate) ? candidate : undefined;
  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const isNumberLike = (value) => {
  return unwrapNumberLike(value) !== undefined;
};

export const normalizeCharacterAttributes = (value) => {
  if (!isRecord(value)) return value;

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]),
  );

  if (normalized.Alertness === undefined && normalized.Expertise !== undefined) {
    normalized.Alertness = normalized.Expertise;
  }

  delete normalized.Expertise;

  return normalized;
};

export const normalizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (isRecord(value)) {
    const unwrappedNumber = unwrapNumberLike(value);
    if (unwrappedNumber !== undefined) {
      return unwrappedNumber;
    }

    const normalizedRecord = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]),
    );

    if (normalizedRecord.attributes && isRecord(normalizedRecord.attributes)) {
      normalizedRecord.attributes = normalizeCharacterAttributes(normalizedRecord.attributes);
    }

    return normalizedRecord;
  }

  return unwrapNumberLike(value) ?? value;
};

export const normalizeCharacterData = (value) => {
  return normalizeValue(value);
};

export const repairLegacyCharacterData = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeCharacterData(entry));
  }

  if (value && typeof value === "object") {
    return normalizeCharacterData(value);
  }

  return normalizeCharacterData(value);
};

export const isWeaponSlot = (value) => {
  if (!isRecord(value)) return false;

  return (
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    (typeof value.family === "string" || value.family === undefined)
  );
};

export const isEquipment = (value) => {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;

  const primaryWeapon = value.primaryWeapon;
  const secondaryWeapon = value.secondaryWeapon;

  return (
    (primaryWeapon === undefined || isWeaponSlot(primaryWeapon)) &&
    (secondaryWeapon === undefined || isWeaponSlot(secondaryWeapon)) &&
    (value.armorClass === undefined || isNumberLike(value.armorClass)) &&
    (value.grenades === undefined || Array.isArray(value.grenades)) &&
    (value.gadget === undefined || typeof value.gadget === "string") &&
    (value.miscGear === undefined || typeof value.miscGear === "string")
  );
};

export const isCharacter = (value) => {
  if (!isRecord(value)) return false;

  const attributes = normalizeCharacterAttributes(value.attributes ?? {});
  const skills = value.skills;
  const specializations = value.specializations;
  const equipment = value.equipment;

  if (!isRecord(attributes)) return false;
  if (!isRecord(skills)) return false;
  if (!isEquipment(equipment)) return false;

  const validSkillValues = Object.values(skills).every((skillValue) =>
    isNumberLike(skillValue),
  );

  const hasLegacyWounds =
    value.fleshWounds === undefined || isNumberLike(value.fleshWounds);
  const hasLegacyDeepWounds =
    value.deepWounds === undefined || isNumberLike(value.deepWounds);

  return (
    typeof value.userId === "string" &&
    typeof value.name === "string" &&
    typeof value.callsign === "string" &&
    typeof value.background === "string" &&
    typeof value.class === "string" &&
    isNumberLike(attributes.Alertness) &&
    isNumberLike(attributes.Body) &&
    isNumberLike(attributes.Intelligence) &&
    isNumberLike(attributes.Spirit) &&
    validSkillValues &&
    (specializations === undefined || Array.isArray(specializations)) &&
    hasLegacyWounds &&
    hasLegacyDeepWounds &&
    (value.XP === undefined || isNumberLike(value.XP)) &&
    (value.emergencyDice === undefined || isNumberLike(value.emergencyDice))
  );
};
