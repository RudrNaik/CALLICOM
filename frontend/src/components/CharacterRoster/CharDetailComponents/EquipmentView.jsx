import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useMemo,
} from "react";
import equipmentData from "../../../data/Equipment.json";
import secondaryGadgets from "../../../data/classSkills.json";
import WeaponSlot from "./WeaponCards";
import GadgetAmmo from "./GadgetAmmo";
import {
  getGadgetAmmoConfig,
  getItemByIdLookup,
  getAvailableClassGadgets,
  getOwnedGrenades,
  getPurchasedGadgetIds,
  getPurchasedWeapons,
  getArmorClassCap,
  getSecondaryGadgetForClass,
  getArmorClassDescription,
} from "../../../engine/equipmentEngine";
import {
  getWeaponCategoriesLookup,
  getOwnedWeaponCategories,
  getExcludedPrimaryCategories,
  getExcludedSecondaryCategories,
} from "../../../engine/weaponEngine";
import { normalizeEquipmentForView } from "../../../engine/characterDataHandler";

const DEFAULT_GRENADE_COUNTS = [2, 2];
const DEFAULT_MED_COUNTS = [1, 2, 1]; // [AFAK, IFAK, Painkiller]

/**
 * Everything in the equipment panel that's a pure derivation of the
 * character (+ static equipment data, + the weapon category lookup) rather
 * than something the user edits directly. Pulled into one function so it can
 * seed state on mount (no flash of empty lists before an effect fires) and
 * be recomputed the same way whenever the character actually changes.
 */
function deriveEquipmentState(character, weaponCatsLookup) {
  const excludedPrimary = getExcludedPrimaryCategories(character);
  const excludedSecondary = getExcludedSecondaryCategories();

  const primaryFilter = Object.fromEntries(
    Object.entries(weaponCatsLookup).filter(
      ([key]) => !excludedPrimary.includes(key),
    ),
  );
  const secondaryFilter = Object.fromEntries(
    Object.entries(weaponCatsLookup).filter(
      ([key]) => !excludedSecondary.includes(key),
    ),
  );

  const ownedWeapons = getPurchasedWeapons(character.logs);

  return {
    //Gadgets are restricted to what's actually been bought in Logistics
    //(derived from the mission logs' receipts, nothing stored on equipment).
    classGadgets: getAvailableClassGadgets(character.logs, equipmentData),

    //Grenades likewise: only types bought in Logistics are selectable.
    grenades: getOwnedGrenades(character.logs, equipmentData),

    //Excludes primaries based on main and sub classes, then further
    //restricts to categories/families actually bought in Logistics.
    primaryOptions: getOwnedWeaponCategories(character.logs, primaryFilter),

    //Excludes secondaries universally, then restricts to what's been bought.
    secondaryOptions: getOwnedWeaponCategories(character.logs, secondaryFilter),

    //Individual purchased weapons (name/category/family, as bought in
    //Logistics) available to pick from directly in each slot's selector,
    //rather than filtering by category/family independently.
    primaryWeaponInstances: ownedWeapons.filter(
      (w) => !excludedPrimary.includes(w.category),
    ),
    secondaryWeaponInstances: ownedWeapons.filter(
      (w) =>
        !excludedSecondary.includes(w.category) &&
        // Secondary SMGs are restricted to the Machine Pistols family.
        (w.category !== "SMGs" || w.family === "Machine Pistols"),
    ),

    //Restrics Armor per SUPP getting AC3 as max (to use the juggernaut suit), everyone else has max of AC1
    maxArmor: getArmorClassCap(character),

    //Secondary gadget (class gadget) assigned to this character's class.
    secondaryGadget: getSecondaryGadgetForClass(secondaryGadgets, character),
  };
}

const EquipmentSelection = forwardRef(function EquipmentSelection(
  {
    character,
    isEditing,
    refreshCharacter,
    setIsEditing,
    charActive,
    wideLayout,
  },
  ref,
) {
  const characterId = character.uniqueId;

  //percolates items from the equipment data into an easy to use lookup table.
  const itemById = useMemo(() => getItemByIdLookup(equipmentData), []);

  // Ammo variants (submunitions) purchased in Logistics — narrows the ammo
  // picker in GadgetAmmo.jsx to only what's actually been bought (see
  // equipmentEngine.getPurchasedGadgetIds).
  const ownedGadgetIds = useMemo(
    () => getPurchasedGadgetIds(character?.logs),
    [character?.logs],
  );

  const weaponCatsLookup = useMemo(
    () => getWeaponCategoriesLookup(equipmentData),
    [],
  );

  // Lazily seeded from the character on first render (rather than starting
  // from empty defaults and waiting for an effect to fill them in) so a
  // fresh mount — e.g. switching characters, keyed by characterKey in
  // CharacterDetail — shows the right data immediately instead of a visible
  // flash of blank equipment. The effect below only re-syncs these when the
  // character actually changes afterwards.
  const [gear, setGear] = useState(() => normalizeEquipmentForView(character));
  const [derived, setDerived] = useState(() =>
    deriveEquipmentState(character, weaponCatsLookup),
  );
  const {
    classGadgets,
    grenades,
    secondaryGadget,
    primaryOptions,
    secondaryOptions,
    primaryWeaponInstances,
    secondaryWeaponInstances,
    maxArmor,
  } = derived;

  const safeGrenades = Array.isArray(gear?.grenades) ? gear.grenades : ["", ""];
  const safeGrenadeCounts =
    Array.isArray(gear?.grenadeCounts) && gear.grenadeCounts.length === 2
      ? gear.grenadeCounts
      : DEFAULT_GRENADE_COUNTS;
  const safeMedCounts =
    Array.isArray(gear?.medCounts) && gear.medCounts.length === 3
      ? gear.medCounts
      : DEFAULT_MED_COUNTS;
  const activeGadgetConfig = useMemo(
    () => getGadgetAmmoConfig(gear.gadget, equipmentData),
    [gear.gadget],
  );

  useEffect(() => {
    if (!character) return;
    setGear(normalizeEquipmentForView(character));
    setDerived(deriveEquipmentState(character, weaponCatsLookup));
  }, [character, weaponCatsLookup]);

  const handleChange = (field, value) => {
    setGear((prev) => ({ ...prev, [field]: value }));
  };

  const handleGadgetChange = (nextGadgetId) => {
    setGear((prev) => ({
      ...prev,
      gadget: nextGadgetId,
      gadgetAmmo: {},
    }));
  };

  /**
   * Selects a specific purchased weapon instance for a slot, percolating its
   * name/category/family in one shot. Any ammo tracked for the previous
   * weapon in that slot is dropped since it belongs to a different weapon.
   */
  const handleWeaponSelect = (slot, instance) => {
    setGear((prev) => ({
      ...prev,
      [slot]: {
        name: instance?.name || "",
        category: instance?.category || "",
        family: instance?.family || "",
      },
    }));
  };

  /**
   * Handles live changes (firing/reloading during a mission)
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
   * Handles live gadget ammo changes (firing/charges/traps/etc)
   */
  const handleGadgetAmmoChange = (nextGadgetAmmo) => {
    const next = { ...gear, gadgetAmmo: nextGadgetAmmo };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Handles grenade count changes
   */
  const handleGrenadeCountsChange = (nextCounts) => {
    const next = { ...gear, grenadeCounts: nextCounts };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Handles medical count changes (AFAK, IFAK)
   */
  const handleMedCountsChange = (nextCounts) => {
    const next = { ...gear, medCounts: nextCounts };
    setGear(next);
    if (charActive) {
      refreshCharacter({ equipment: next });
    }
  };

  /**
   * Handles the armor class flavor text
   * @param {*} armorClass
   * @returns the bonuses/maluses from that armor level
   */
  const renderArmorClassDescription = (armorClass) => {
    if (armorClass == 0) {
      return (
        <span className="text-xs text-neutral-400">
          {getArmorClassDescription(armorClass)}
        </span>
      );
    }
    if (armorClass == 1 || armorClass == 2 || armorClass >= 4) {
      return (
        <p className="text-xs text-neutral-400">
          {getArmorClassDescription(armorClass)}
        </p>
      );
    }
    return null;
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

  useImperativeHandle(ref, () => ({ save: saveToDatabase }));

  return (
    <div className=" text-white" style={{ fontFamily: "Geist_Mono" }}>
      <div
        className={
          wideLayout ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"
        }
      >
        {/* Weapons */}
        <div className={wideLayout ? "col-span-2 md:col-span-1" : ""}>
          <WeaponSlot
            slot="primaryWeapon"
            weapon={gear["primaryWeapon"]}
            isEditing={isEditing}
            weaponCategories={primaryOptions}
            ownedWeapons={primaryWeaponInstances}
            onSelectWeapon={handleWeaponSelect}
            onAmmoChange={handleWeaponAmmoChange}
            characterId={characterId}
            charActive={charActive}
          />
        </div>

        <div className={wideLayout ? "col-span-2 md:col-span-1" : ""}>
          <WeaponSlot
            slot="secondaryWeapon"
            weapon={gear["secondaryWeapon"]}
            isEditing={isEditing}
            weaponCategories={secondaryOptions}
            ownedWeapons={secondaryWeaponInstances}
            onSelectWeapon={handleWeaponSelect}
            onAmmoChange={handleWeaponAmmoChange}
            characterId={characterId}
            charActive={charActive}
            isSecondary={true}
          />
        </div>

        {/* Grenades */}
        <div
          className={`bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow ${wideLayout ? "col-span-2 md:col-span-1" : ""}`}
        >
          <h3 className="font-semibold text-orange-300 mb-1">Grenades</h3>

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
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{ gridAutoRows: "1fr" }}
              >
                {safeGrenades.map((grenadeId, i) => {
                  const grenadeData = itemById[grenadeId];
                  return (
                    <div
                      key={i}
                      className="text-sm text-white space-y-1 flex flex-col"
                    >
                      <div>
                        <span className="font-semibold text-neutral-300">
                          {grenadeData?.title || `Grenade ${i + 1}`}
                        </span>
                      </div>
                      {grenadeData && (
                        <div className="text-[10px] text-neutral-400 mb-2 whitespace-pre-line flex-grow">
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
        <div
          className={`bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow ${wideLayout ? "col-span-2 md:col-span-1" : ""}`}
        >
          <h3 className="font-semibold text-orange-300 ">Armor/Medical</h3>
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
              <div className="text-xs">{renderArmorClassDescription(gear.armorClass)}</div>
            </div>
          ) : (
            <div>
              <p>
                <span>AC{gear.armorClass}</span>
              </p>
              <div className="text-xs whitespace-pre-line">{renderArmorClassDescription(gear.armorClass)}</div>
            </div>
          )}

          {/* Medicine and meds. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {["AFAK", "IFAK"].map((med, i) => (
              <div key={med} className="text-sm text-white space-y-1">
                <p>
                  <span className="font-semibold text-neutral-300">{med}</span>
                </p>
                <p className="px-2 py-1 rounded bg-neutral-900 mb-2">
                  <span className="text-yellow-400">{safeMedCounts[i]}</span>{" "}
                  <span className="text-gray-400 italic">remaining</span>
                </p>
                {charActive ? (
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
                ) : (
                  <></>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gadget */}
        <div
          className={`bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow ${wideLayout ? "col-span-2" : ""}`}
        >
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
            <div className="text-xs text-gray-300 space-y-2 mt-2">
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
              key={`${characterId}-${gear.gadget}`}
              isEditing={isEditing}
              isActive={charActive}
              gadgetId={gear.gadget}
              gadgetAmmo={gear.gadgetAmmo || {}}
              setGadgetAmmo={handleGadgetAmmoChange}
              itemById={itemById}
              charClass={character.class}
              characterId={characterId}
              config={activeGadgetConfig}
              ownedOptionIds={ownedGadgetIds}
            />
          )}

          {secondaryGadget && (
            <div className="text-sm text-gray-300 space-y-2 mt-2">
              <p className="text-xs text-gray-200 whitespace-pre-line border-orange-400/30 border bg-orange-900/20 px-2 py-1 mt-2 rounded-xs">
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
        <div
          className={`bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-4 border-orange-500 p-4 rounded-xs shadow ${wideLayout ? "col-span-2" : ""}`}
        >
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
    </div>
  );
});

export default EquipmentSelection;
