import { useEffect, useState, useMemo } from "react";
import equipmentData from "../../../data/Equipment.json";
import secondaryGadgets from "../../../data/classSkills.json";
import WeaponSlot from "./WeaponCards";
import GadgetAmmo from "./GadgetAmmo";
import {
  getGadgetAmmoConfig,
  getGadgetAmmoMax,
  getWeaponCategoriesLookup,
} from "../../../engine/equipmentEngine";

const DEFAULT_GRENADE_COUNTS = [2, 2];
const DEFAULT_MED_COUNTS = [1, 2, 1]; // [AFAK, IFAK, Painkiller]

function EquipmentSelection({
  character,
  isEditing,
  refreshCharacter,
  setIsEditing,
  charActive,
  campEquipment,
}) {
  const defaultGear = {
    primaryWeapon: { name: "", category: "" },
    secondaryWeapon: { name: "", category: "" },
    grenades: ["", ""],
    grenadeCounts: DEFAULT_GRENADE_COUNTS,
    gadget: "",
    gadgetAmmo: {},
    armorClass: 0,
    medCounts: DEFAULT_MED_COUNTS,
    miscGear: "",
  };

  //percolates items from the equipment data into an easy to use lookup table.
  const itemById = useMemo(() => {
    const m = {};

    equipmentData.forEach((it) => {
      m[it.id] = it;
    });

    return m;
  }, []);

  const campaignLookupTable = useMemo(() => {
    const m = {};

    campEquipment.forEach((it) => {
      m[it.id] = it;
    });

    return m;
  });

  const [gear, setGear] = useState(defaultGear);

  const safeGrenades = Array.isArray(gear?.grenades) ? gear.grenades : ["", ""];
  const safeGrenadeCounts =
    Array.isArray(gear?.grenadeCounts) && gear.grenadeCounts.length === 2
      ? gear.grenadeCounts
      : DEFAULT_GRENADE_COUNTS;
  const safeMedCounts =
    Array.isArray(gear?.medCounts) && gear.medCounts.length === 3
      ? gear.medCounts
      : DEFAULT_MED_COUNTS;
  const [classGadgets, setClassGadgets] = useState([]);
  const [grenades, setGrenades] = useState([]);
  const [secondaryGadget, setSecGadget] = useState([]);
  const activeGadgetConfig = useMemo(
    () => getGadgetAmmoConfig(gear.gadget, equipmentData),
    [gear.gadget],
  );
  const weaponCatsLookup = useMemo(
    () => getWeaponCategoriesLookup(equipmentData),
    [],
  );
  const [primaryOptions, setPrimaries] = useState({});
  const [secondaryOptions, setSecondary] = useState({});
  const [maxArmor, setArmor] = useState(1);

  useEffect(() => {
    if (!character) return;

    const normalizedEquipment = {
      ...(character.equipment ?? {}),
      primaryWeapon: {
        name: "",
        category: "",
        family: "",
        ...(character.equipment?.primaryWeapon ?? {}),
      },
      secondaryWeapon: {
        name: "",
        category: "",
        family: "",
        ...(character.equipment?.secondaryWeapon ?? {}),
      },
      grenades: Array.isArray(character.equipment?.grenades)
        ? character.equipment.grenades
        : ["", ""],
      grenadeCounts:
        Array.isArray(character.equipment?.grenadeCounts) &&
        character.equipment.grenadeCounts.length === 2
          ? character.equipment.grenadeCounts
          : DEFAULT_GRENADE_COUNTS,
      gadget: character.equipment?.gadget ?? "",
      gadgetAmmo: character.equipment?.gadgetAmmo ?? {},
      armorClass: character.equipment?.armorClass ?? 0,
      medCounts:
        Array.isArray(character.equipment?.medCounts) &&
        character.equipment.medCounts.length === 3
          ? character.equipment.medCounts
          : DEFAULT_MED_COUNTS,
      miscGear: character.equipment?.miscGear ?? "",
    };

    setGear(normalizedEquipment);

    //filters items based on class, secondary class, and if they are purchased or not.
    let filtered = null;
    if (
      character?.campaignId == undefined ||
      character?.campaignId == null ||
      !character?.campaignId
        ?.replace(/\s/g, "")
        ?.split(",")
        ?.includes("Siberia2022") ||
      !campEquipment
    ) {
      filtered = equipmentData.filter(
        (item) =>
          (item.class === character.class ||
            item.class === character.multiClass) &&
          (!item?.SubMunition || !item?.parentId === "thinkpad"),
      );
    } else {
      filtered = campEquipment.filter(
        (item) =>
          (item.class === character.class ||
            item.class === character.multiClass) &&
          item.cost === 0 &&
          (!item?.SubMunition || !item?.parentId === "thinkpad"),
      );
    }
    setClassGadgets(filtered);

    // Filter grenades from equipment data
    const grenadeList = equipmentData.filter(
      (item) => item?.parentId == "grenades",
    );
    setGrenades(grenadeList);

    //Excludes primaries based on main and sub classes
    let excluded;
    if (
      character.class === "Sharpshooter" ||
      character.multiClass === "Sharpshooter"
    ) {
      excluded = [
        "Machine Guns",
        "Light Pistols",
        "Heavy Pistols",
      ];
    } else if (
      character.class === "Fire Support" ||
      character.multiClass === "Fire Support"
    ) {
      excluded = ["Sniper Rifles", "Light Pistols", "Heavy Pistols"];
    } else {
      excluded = [
        "Sniper Rifles",
        "Machine Guns",
        "Drum Shotguns",
        "Light Pistols",
        "Heavy Pistols",
      ];
    }
    const primaryFilter = Object.fromEntries(
      Object.entries(weaponCatsLookup).filter(
        ([key]) => !excluded.includes(key),
      ),
    );
    setPrimaries(primaryFilter);

    //Restrics Armor per SUPP getting AC3 as max (to use the juggernaut suit), everyone else has max of AC1
    if (
      character.class === "Combat Engineer" ||
      character.class === "Technical Engineer" ||
      character.class === "Medic"
    ) {
      setArmor(2);
    } else if (character.class === "Fire Support") {
      setArmor(3);
    } else {
      setArmor(1);
    }

    //Excludes secondaries universally.
    excluded = [
      "Sniper Rifles",
      "Machine Guns",
      "Drum Shotguns",
      "Marksman Rifles",
      "Assault Rifles",
      "Shotguns",
      "Carbines",
    ];
    const secondaryFilter = Object.fromEntries(
      Object.entries(weaponCatsLookup).filter(
        ([key]) => !excluded.includes(key),
      ),
    );
    setSecondary(secondaryFilter);

    //Grabs secondary gadget (class gadget) and assigns it.
    if (secondaryGadgets[character.class]) {
      setSecGadget(secondaryGadgets[character.class].classGadget);
    } else {
      setSecGadget(null);
    }

  }, [character]);

  const handleChange = (field, value) => {
    setGear((prev) => ({ ...prev, [field]: value }));
  };

  const handleGadgetChange = (nextGadgetId) => {
    const nextConfig = equipmentData.find((item) => item.id === nextGadgetId) || null;
    const isMixed = !!nextConfig?.options?.length;
    const inferredMax = nextConfig ? getGadgetAmmoMax(nextConfig) : 0;
    const nextAmmo = {};

    setGear((prev) => ({
      ...prev,
      gadget: nextGadgetId,
      gadgetAmmo: nextAmmo,
    }));
  };

  const handleWeaponChange = (slot, subfield, value) => {
    setGear((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], [subfield]: value },
    }));
  };

  /**
   * Live ammo changes (firing/reloading during a mission) write straight
   * through to the character so equipment.<slot>.ammo is the single source
   * of truth, instead of a parallel localStorage entry.
   */
  const handleWeaponAmmoChange = (slot, ammoState) => {
    const next = {
      ...gear,
      [slot]: { ...gear[slot], ammo: ammoState },
    };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Same as above but for gadget ammo/charges.
   */
  const handleGadgetAmmoChange = (nextGadgetAmmo) => {
    const next = { ...gear, gadgetAmmo: nextGadgetAmmo };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Same as above but for grenade throw counts.
   */
  const handleGrenadeCountsChange = (nextCounts) => {
    const next = { ...gear, grenadeCounts: nextCounts };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Same as above but for med (AFAK/IFAK/Painkiller) use counts.
   */
  const handleMedCountsChange = (nextCounts) => {
    const next = { ...gear, medCounts: nextCounts };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  const handleGrenadeChange = (index, value) => {
    setGear((prev) => {
      const updated = [...prev.grenades];
      updated[index] = value;
      return { ...prev, grenades: updated };
    });
  };

  const saveToDatabase = () => {
    refreshCharacter({ equipment: gear });
    setIsEditing(false);
  };

  // console.log(
  //   character?.campaignId == undefined ||
  //     character?.campaignId == null ||
  //     !campEquipment ||
  //     campEquipment == null ||
  //     campEquipment == undefined
  // );
  // if (character?.campaignId != null) {
  //   console.log(
  //     character?.campaignId
  //       .replace(/\s/g, "")
  //       .split(",")
  //       .includes("Siberia2022")
  //   );
  // }
  // console.log(primaryOptions);
  // console.log(secondaryOptions);

  return (
    <div className=" text-white" style={{ fontFamily: "Geist_Mono" }}>
      <div className="grid grid-cols-2 gap-2">
        {/* Weapons */}
        <div className=" col-span-2 lg:col-span-1">
          <WeaponSlot
            slot="primaryWeapon"
            weapon={gear["primaryWeapon"]}
            isEditing={isEditing}
            weaponCategories={primaryOptions}
            handleWeaponChange={handleWeaponChange}
            onAmmoChange={handleWeaponAmmoChange}
            characterCallsign={character.callsign}
            charActive={charActive}
          />
        </div>

        <div className="col-span-2 lg:col-span-1">
          <WeaponSlot
            slot="secondaryWeapon"
            weapon={gear["secondaryWeapon"]}
            isEditing={isEditing}
            weaponCategories={secondaryOptions}
            handleWeaponChange={handleWeaponChange}
            onAmmoChange={handleWeaponAmmoChange}
            characterCallsign={character.callsign}
            charActive={charActive}
            isSecondary={true}
          />
        </div>

        {/* Grenades */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
          <h3 className="font-semibold text-orange-300">Grenades</h3>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeGrenades.map((grenadeId, i) => {
                const grenadeData = itemById[grenadeId];
                return (
                  <div className="flex flex-col">
                    <select
                      key={i}
                      className="w-full bg-neutral-900 text-white border-1 border-orange-400/60 py-2 px-2 rounded"
                      value={grenadeId || ""}
                      onChange={(e) => handleGrenadeChange(i, e.target.value)}
                    >
                      <option value="">Select Grenade</option>
                      {grenades.map((grenade) => (
                        <option key={grenade.id} value={grenade.id}>
                          {grenade.title}
                        </option>
                      ))}
                    </select>

                    <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded mt-2 whitespace-pre-line flex flex-grow">
                      {grenadeData?.rulesText}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
                {safeGrenades.map((grenadeId, i) => {
                  const grenadeData = itemById[grenadeId];
                  return (
                    <div key={i} className="text-sm text-white space-y-1 flex flex-col">
                      <div>
                        <span className="font-semibold text-orange-300">
                          {grenadeData?.title || `Grenade ${i + 1}`}
                        </span>
                      </div>
                      {grenadeData && (
                        <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded mb-2 whitespace-pre-line flex-grow">
                          {grenadeData?.rulesText}
                        </div>
                      )}
                      {charActive && (
                        <div>
                          <div className="px-2 py-1 rounded bg-neutral-900 mb-2">
                            <span className="text-yellow-400">
                              {safeGrenadeCounts[i]} / 2
                            </span>{" "}
                            <span className="text-gray-400 italic">
                              remaining
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const updated = [...safeGrenadeCounts];
                                updated[i] = Math.max(0, updated[i] - 1);
                                handleGrenadeCountsChange(updated);
                              }}
                              disabled={safeGrenadeCounts[i] === 0}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                            >
                              Throw
                            </button>
                            <button
                              onClick={() => {
                                const updated = [...safeGrenadeCounts];
                                updated[i] = 2;
                                handleGrenadeCountsChange(updated);
                              }}
                              className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                            >
                              Resupply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Armor Class */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
          <h3 className="font-semibold text-orange-300">Armor Class</h3>
          {isEditing ? (
            <div>
              <div>
                <input
                  type="number"
                  min={0}
                  max={maxArmor}
                  className="w-full bg-neutral-900 border-1 border-orange-400/60 text-white p-2 rounded"
                  value={gear.armorClass}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (Number.isNaN(val)) val = 0;
                    if (maxArmor > 0 && val > maxArmor) return; // cap
                    handleChange("armorClass", val);
                  }}
                />
              </div>
              <div>
                {gear.armorClass == 0 && (
                  <span className="text-xs text-neutral-400">
                    No maluses for sprinting and shooting, +1 to
                    [Acrobatics][Jump][Climb][Endurance][Stealth]
                  </span>
                )}
                {gear.armorClass == 1 && (
                  <p className="text-xs text-neutral-400">No Bonuses</p>
                )}
                {gear.armorClass == 2 && (
                  <p className="text-xs text-neutral-400">
                    -1 to movement related checks
                    [Acrobatics][Jump][Climb][Endurance]
                  </p>
                )}
                {gear.armorClass == 3 && (
                  <p className="text-xs text-neutral-400">
                    -2 to movement related checks
                    [Acrobatics][Jump][Climb][Endurance]
                  </p>
                )}
                {gear.armorClass >= 4 && (
                  <p className="text-xs text-neutral-400">
                    [N/A // Cannot have an AC past 3.]
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p>
                <span>AC{gear.armorClass}</span>
              </p>
              <div>
                {gear.armorClass == 0 && (
                  <span className="text-xs text-neutral-400">
                    No maluses for sprinting and shooting, +1 to
                    [Acrobatics][Jump][Climb][Endurance][Stealth]
                  </span>
                )}
                {gear.armorClass == 1 && (
                  <p className="text-xs text-neutral-400">No Bonuses</p>
                )}
                {gear.armorClass == 2 && (
                  <p className="text-xs text-neutral-400">
                    -1 to movement related checks
                    [Acrobatics][Jump][Climb][Endurance]
                  </p>
                )}
                {gear.armorClass == 3 && (
                  <p className="text-xs text-neutral-400">
                    -2 to movement related checks
                    [Acrobatics][Jump][Climb][Endurance]
                  </p>
                )}
                {gear.armorClass >= 4 && (
                  <p className="text-xs text-neutral-400">
                    [N/A // Cannot have an AC past 3.]
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Medicine and meds. */}
          {charActive ? (
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {["AFAK", "IFAK"].map((med, i) => (
                <div key={med} className="text-sm text-white space-y-1">
                  <p>
                    <span className="font-semibold text-orange-300">{med}</span>
                  </p>
                  <p className="px-2 py-1 rounded bg-neutral-900 mb-2">
                    <span className="text-yellow-400">{safeMedCounts[i]}</span>{" "}
                    <span className="text-gray-400 italic">remaining</span>
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const updated = [...safeMedCounts];
                        updated[i] = Math.max(0, updated[i] - 1);
                        handleMedCountsChange(updated);
                      }}
                      disabled={safeMedCounts[i] === 0}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded disabled:opacity-40 text-xs"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...safeMedCounts];
                        updated[i] = i === 1 ? 2 : 1; // default: AFAK = 2, others = 1
                        handleMedCountsChange(updated);
                      }}
                      className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs"
                    >
                      Resupply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No meds shown unless on a mission.
            </p>
          )}
        </div>

        {/* Gadget */}
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow col-span-2 lg:col-span-full">
          <h3 className="font-semibold text-orange-300">Class Gadget</h3>
          {isEditing ? (
            <select
              className="w-full select-themed p-2 rounded"
              value={gear.gadget}
              onChange={(e) => handleGadgetChange(e.target.value)}
            >
              <option value="">Select Gadget</option>
              {classGadgets.map((gadget) => (
                <option key={gadget.id} value={gadget.id}>
                  {gadget.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-semibold text-white">
              {classGadgets.find((gadget) => gadget.id === gear.gadget)
                ?.title || "None Selected"}
            </p>
          )}

          {gear.gadget && (
            <div className="text-sm text-gray-300 space-y-2 mt-2">
              <p className="whitespace-pre-line">
                {equipmentData.find((gadget) => gadget.id === gear.gadget)
                  ?.rulesText || "n/a"}
              </p>
              <p className="italic">
                {equipmentData.find((gadget) => gadget.id === gear.gadget)
                  ?.description || "n/a"}
              </p>
            </div>
          )}

          {/* Special Ammo UI */}
          {activeGadgetConfig && (
            <GadgetAmmo
              key={`${character.callsign}-${gear.gadget}`}
              isEditing={isEditing}
              isActive={charActive}
              gadgetId={gear.gadget}
              gadgetAmmo={gear.gadgetAmmo || {}}
              setGadgetAmmo={handleGadgetAmmoChange}
              itemById={itemById}
              charClass={character.class}
              characterCallsign={character.callsign}
              config={activeGadgetConfig}
              campaignEquipment={campaignLookupTable}
              campActive={!(!campEquipment || campEquipment == null)}
              campaignId={character?.campaignId}
            />
          )}

          {secondaryGadget && (
            <div className="text-sm text-gray-300 space-y-2 mt-2">
              <p className="text-xs text-gray-200 whitespace-pre-line bg-orange-900/20 px-2 py-1 mt-2 rounded">
                <span className="text-orange-300 text-sm font-semibold">
                  Secondary Gadget: {secondaryGadget.id} {"\n"}
                </span>
                <span className="text-xs">
                  {secondaryGadget.gameplay}
                  {"\n"}
                </span>
                <span className="text-[0.625rem] text-gray-400 italic">
                  {secondaryGadget.description}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* inventory */}
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow col-span-2 lg:col-span-full">
          <h3 className="font-semibold text-orange-300">Inventory</h3>
          {isEditing ? (
            <textarea
              className="w-full bg-neutral-900 text-white p-2 text-xs rounded resize-y min-h-[100px]"
              placeholder="Extra mission items, RP gear, etc..."
              value={gear.miscGear}
              onChange={(e) => handleChange("miscGear", e.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap text-xs mt-1">
              {gear.miscGear || "—"}
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4">
          <button
            onClick={saveToDatabase}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            Save Equipment
          </button>
        </div>
      )}
    </div>
  );
}

export default EquipmentSelection;
