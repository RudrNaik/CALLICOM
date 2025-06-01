import { useEffect, useRef, useState } from "react";

function DerivedStats({ character, userId, refreshCharacter }) {
  const [fleshWounds, setFleshWounds] = useState(character.fleshWounds || 0);
  const [deepWounds, setDeepWounds] = useState(character.deepWounds || 0);
  const prevWounds = useRef({ fleshWounds: 0, deepWounds: 0 });
  const [isSaving, setIsSaving] = useState(false); // Flag to prevent multiple API calls
  const [updateTimer, setUpdateTimer] = useState(null); // Track the timer

  // Function to handle the actual server update after debounce
  const updateWoundsToServer = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    if (
      fleshWounds !== prevWounds.current.fleshWounds ||
      deepWounds !== prevWounds.current.deepWounds
    ) {
      setIsSaving(true); // Set flag to prevent repeated calls
      try {
        const res = await fetch(
          `https://callicom-test.onrender.com/api/characters/${userId}/${character.callsign}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fleshWounds, deepWounds }),
          }
        );
        if (res.ok) {
          prevWounds.current = { fleshWounds, deepWounds }; // Update previous state after successful patch
          refreshCharacter();
        } else {
          console.error("Failed to update wounds:", await res.text());
        }
      } catch (error) {
        console.error("Error updating wounds:", error);
      } finally {
        setIsSaving(false); // Reset saving flag after the request is completed
      }
    }
  };

  useEffect(() => {
    // Clear previous timeout if there is a new change before the previous one finishes
    if (updateTimer) {
      clearTimeout(updateTimer);
    }

    // Set a new timer to call the update function after 700ms of inactivity
    const timer = setTimeout(() => {
      updateWoundsToServer(); // Call the backend after 700ms of inactivity
    }, 700);

    setUpdateTimer(timer); // Store the timer ID so we can clear it if necessary

    // Cleanup the timer on component unmount or when a new state update occurs
    return () => {
      if (updateTimer) clearTimeout(updateTimer);
    };
  }, [fleshWounds, deepWounds]); // Only run this effect when fleshWounds or deepWounds change

  useEffect(() => {
    if (character) {
      // Ensure the wounds are updated when a new character is selected
      setFleshWounds(character.fleshWounds || 0);
      setDeepWounds(character.deepWounds || 0);
      prevWounds.current = {
        fleshWounds: character.fleshWounds || 0,
        deepWounds: character.deepWounds || 0,
      };
    }
  }, [character]); // This ensures wounds are updated when the character changes

  const handleDecreaseFleshWounds = () => {
    setFleshWounds(Math.max(fleshWounds - 1, 0));
  };

  const handleIncreaseFleshWounds = () => {
    setFleshWounds(fleshWounds + 1);
  };

  const handleDecreaseDeepWounds = () => {
    setDeepWounds(Math.max(deepWounds - 1, 0));
  };

  const handleIncreaseDeepWounds = () => {
    setDeepWounds(deepWounds + 1);
  };

  // Derived stats calculations based on character attributes and skills
  const Alertness = character.attributes?.Expertise || 0;
  const Body = character.attributes?.Body || 0;
  const Intelligence = character.attributes?.Intelligence || 0;
  const Spirit = character.attributes?.Spirit || 0;
  const Brawl = character.skills?.CQC || 0;
  const Melee = character.skills?.Melee || 0;

  const Defense = 1 + Alertness + Body;
  const CombatSense = 1 + Intelligence + Spirit;
  const Health = Math.ceil((Body + Spirit) / 2);
  const Stamina = 5 + Body + Spirit;
  const SystemShock = 5 + Health;
  const FleshWoundThreshold =
    Math.ceil(Stamina / 2) + character.equipment?.armorClass ||
    Math.ceil(Stamina / 2);
  const DeepWoundThreshold =
    Stamina + character.equipment?.armorClass || Stamina;
  const InstantDeath = Stamina * 2;
  const UnarmedDamage = 3 + Body + Brawl;
  const ArmedDamage = 3 + Body + Melee;
  const woundMod = fleshWounds + deepWounds * 2;

  return (
    <div className="mt-8 text-white font-geist">
      {/* Saving Indicator */}
      {isSaving ? (
        <div className="flex items-center text-orange-400 font-bold py-2">
          <div className="w-4 h-4 border-t-3 border-solid border-orange-500 rounded-3xl animate-spin mr-2"></div>
          Saving...
        </div>
      ) : (
        <div className="text-orange-400 font-bold py-2">Saved</div>
      )}

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
        <div className="bg-neutral-900 font-bold py-2 text-red-800">
          Instant Death
        </div>
        <div className="bg-neutral-900 font-bold py-2 text-orange-800">
          System Shock
        </div>
        <div className="bg-neutral-900 font-bold py-2 col-span-2 text-red-500">
          -{woundMod}
        </div>

        <div className="bg-neutral-800 py-2">{InstantDeath}</div>
        <div className="bg-neutral-800 py-2">{SystemShock}</div>

        <div className="bg-neutral-800 py-2">
          <span className="font-semibold text-orange-400">Flesh Wounds</span>
          <br></br>
          <button
            onClick={handleDecreaseFleshWounds}
            className="text-red-500"
            disabled={isSaving}
          >
            −
          </button>
          <span className="mx-2">{fleshWounds}</span>
          <button
            onClick={handleIncreaseFleshWounds}
            className="text-red-500"
            disabled={isSaving}
          >
            +
          </button>
        </div>

        <div className="bg-neutral-800 py-2">
          <span className="font-semibold text-orange-400">Deep Wounds</span>
          <br></br>
          <button
            onClick={handleDecreaseDeepWounds}
            className="text-red-500"
            disabled={isSaving}
          >
            −
          </button>
          <span className="mx-2">{deepWounds}</span>
          <button
            onClick={handleIncreaseDeepWounds}
            className="text-red-500"
            disabled={isSaving}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default DerivedStats;
