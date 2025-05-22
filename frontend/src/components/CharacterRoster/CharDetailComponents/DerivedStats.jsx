import { useEffect, useRef, useState } from "react";

function DerivedStats({ character, userId, refreshCharacter }) {
  const [fleshWounds, setFleshWounds] = useState(0);
  const [deepWounds, setDeepWounds] = useState(0);
  const prevWounds = useRef({ fleshWounds: 0, deepWounds: 0 });

  const { attributes = {}, skills = {} } = character;
  const armorClass = character.equipment?.armorClass || 0;

  useEffect(() => {
    if (character) {
      setFleshWounds(character.fleshWounds || 0);
      setDeepWounds(character.deepWounds || 0);
      prevWounds.current = {
        fleshWounds: character.fleshWounds || 0,
        deepWounds: character.deepWounds || 0,
      };
    }
  }, [character]);

  useEffect(() => {
    // Only patch if the wounds have changed (i.e., state != previous)
    const woundsChanged =
      fleshWounds !== prevWounds.current.fleshWounds ||
      deepWounds !== prevWounds.current.deepWounds;

    if (woundsChanged) {
      const patchWoundsToDB = async () => {
        try {
          await fetch(
            `http://localhost:8080/api/characters/${userId}/${character.callsign}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fleshWounds, deepWounds }),
            }
          );
          prevWounds.current = { fleshWounds, deepWounds }; // Update the previous state after successful patch
          refreshCharacter?.();
        } catch (error) {
          console.error("Failed to update wounds:", error);
        }
      };

      patchWoundsToDB();
    }
  }, [fleshWounds, deepWounds, userId, character.callsign, refreshCharacter]);

  const Alertness = attributes.Expertise || 0;
  const Body = attributes.Body || 0;
  const Intelligence = attributes.Intelligence || 0;
  const Spirit = attributes.Spirit || 0;
  const Brawl = skills.CQC || 0;
  const Melee = skills.Melee || 0;

  const Defense = 1 + Alertness + Body;
  const CombatSense = 1 + Intelligence + Spirit;
  const Health = Math.ceil((Body + Spirit) / 2);
  const Stamina = 5 + Body + Spirit;
  const SystemShock = 5 + Health;
  const FleshWoundThreshold = Math.ceil(Stamina / 2) + armorClass;
  const DeepWoundThreshold = Stamina + armorClass;
  const InstantDeath = Stamina * 2;
  const UnarmedDamage = Math.ceil(3 + Body + Brawl);
  const ArmedDamage = Math.ceil(3 + Body + Melee);
  const woundMod = fleshWounds + deepWounds * 2;

  return (
    <div className="mt-8 text-white font-[Geist_Mono]">
      <div className="grid grid-cols-4 gap-px bg-neutral-600 text-sm text-center border border-neutral-700">
        {/* Header Row */}
        <div className="bg-neutral-900 font-bold py-2">Health</div>
        <div className="bg-neutral-900 font-bold py-2">Stamina</div>
        <div className="bg-neutral-900 font-bold py-2">Defense</div>
        <div className="bg-neutral-900 font-bold py-2">Combat Sense</div>

        <div className="bg-neutral-800 py-2">{Health}</div>
        <div className="bg-neutral-800 py-2">{Stamina}</div>
        <div className="bg-neutral-800 py-2">{Defense}</div>
        <div className="bg-neutral-800 py-2">{CombatSense}</div>

        {/* Second Row */}
        <div className="bg-neutral-900 font-bold py-2">Flesh Wound</div>
        <div className="bg-neutral-900 font-bold py-2">Deep Wound</div>
        <div className="bg-neutral-900 font-bold py-2">Unarmed DMG</div>
        <div className="bg-neutral-900 font-bold py-2">Armed DMG</div>

        <div className="bg-neutral-800 py-2">{FleshWoundThreshold}</div>
        <div className="bg-neutral-800 py-2">{DeepWoundThreshold}</div>
        <div className="bg-neutral-800 py-2">{UnarmedDamage}</div>
        <div className="bg-neutral-800 py-2">{ArmedDamage}</div>

        {/* Third Row */}
        <div className="bg-neutral-900 font-bold py-2">Instant Death</div>
        <div className="bg-neutral-900 font-bold py-2">System Shock</div>
        <div className="bg-neutral-900 font-bold py-2 col-span-2">
          -{woundMod}
        </div>

        <div className="bg-neutral-800 py-2">{InstantDeath}</div>
        <div className="bg-neutral-800 py-2">{SystemShock}</div>

        <div className="bg-neutral-800 py-2">
          <p>Flesh Wounds</p>
          <button onClick={() => setFleshWounds(Math.max(fleshWounds - 1, 0))}>−</button>
          <span className="mx-2">{fleshWounds}</span>
          <button onClick={() => setFleshWounds(fleshWounds + 1)}>+</button>
        </div>

        <div className="bg-neutral-800 py-2">
          <p>Deep Wounds</p>
          <button onClick={() => setDeepWounds(Math.max(deepWounds - 1, 0))}>−</button>
          <span className="mx-2">{deepWounds}</span>
          <button onClick={() => setDeepWounds(deepWounds + 1)}>+</button>
        </div>
      </div>
    </div>
  );
}

export default DerivedStats;
