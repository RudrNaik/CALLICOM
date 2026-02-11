import { useState, useEffect } from "react";
import React from "react";
import weaponCategories from "../../../data/weaponCategories.json";

function Calculator({ characterData }) {
  // Destructure and rename
  const [character, setChar] = useState(null);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [skills, setSkills] = useState(null);

  useEffect(() => {
    if (characterData) {
      setChar(characterData);
      setPrimary(characterData?.equipment?.primaryWeapon);
      setSecondary(characterData?.equipment?.secondaryWeapon);
      setSkills(characterData?.skills);
    }
  }, [characterData]);

  // console.log(character);
  // console.log(primary);
  // console.log(secondary);
  // console.log(skills);

  const parseRangeProfile = (rangeString) => {
    // Example input: "-1 C | +1 M | -1 ELR"
    const profile = {};

    rangeString.split("|").forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      const match = trimmed.match(/([+-]?\d+)\s*(C|M|L|ELR)/i);
      if (!match) return;

      const [, value, band] = match;
      profile[band.toUpperCase()] = Number(value);
    });

    return profile;
  };

  const getRangeModifier = (range, weapon) => {
    if (!weapon?.range) return 0;

    const band = range;
    if (!band) return 0;

    const profile = parseRangeProfile(weapon.range);

    // EELR counts as ELR
    if (band === "EELR") return profile.ELR ?? 0;

    return profile[band] ?? 0;
  };

  const buildEnemyRollExpression = (enemy, weapon) => {
    const weaponSkill = skills.Weapon ?? 0;
    const dice = weaponSkill <= 0 ? "2d6l" : `${weaponSkill}d6k1`;

    const FW = enemy.wounds?.FW ?? 0;
    const DW = enemy.wounds?.DW ?? 0;
    const woundPenalty = FW + (DW * 2);

    const rangeMod = getRangeModifier(enemy, weapon);

    let expr = dice;

    if (rangeMod !== 0) {
      expr += rangeMod > 0 ? ` + ${rangeMod}` : ` - ${Math.abs(rangeMod)}`;
    }

    if (woundPenalty > 0) {
      expr += ` - ${woundPenalty}`;
    }

    return {
      expr,
      rangeMod,
      woundPenalty,
    };
  };

  return (
    <div className="rounded-md bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-3">
      Working on it.
    </div>
  );
}

export default Calculator;
