import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useMemo,
} from "react";
import equipmentData from "../../../data/Equipment.json";
import secondaryGadgets from "../../../data/classSkills.json";
import gearSetsData from "../../../data/geasrSets.json";
import WeaponSlot from "./WeaponCards";
import GrenadesPanel from "./GrenadesPanel";
import ArmorMedicalPanel from "./ArmorMedicalPanel";
import GadgetPanel from "./GadgetPanel";
import GearsetsPanel from "./GearsetsPanel";
import {
  getGadgetAmmoConfig,
  getItemByIdLookup,
  getAvailableClassGadgets,
  getOwnedGrenades,
  getPurchasedGadgetIds,
  getPurchasedWeapons,
  getArmorClassCap,
  getSecondaryGadgetForClass,
  getGearsetsForClass,
} from "../../../engine/equipmentEngine";
import {
  getWeaponCategoriesLookup,
  getOwnedWeaponCategories,
  getExcludedPrimaryCategories,
  getExcludedSecondaryCategories,
} from "../../../engine/weaponEngine";
import { normalizeEquipmentForView } from "../../../engine/characterDataHandler";

const DEFAULT_GRENADE_COUNTS = [2, 2];
const DEFAULT_MED_COUNTS = [1, 2]; // [AFAK, IFAK]

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

    //Gearsets available to this character's class, plus any universal ones.
    gearsets: getGearsetsForClass(character, gearSetsData),
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
    gearsets,
  } = derived;

  const safeGearSlots = useMemo(() => gear?.gearSlots ?? {}, [gear?.gearSlots]);

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

  const handleGearSlotChange = (slotKey, pieceId) => {
    setGear((prev) => ({
      ...prev,
      gearSlots: { ...prev.gearSlots, [slotKey]: pieceId },
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

        <div className={wideLayout ? "col-span-2 md:col-span-1" : ""}>
          <GrenadesPanel
            grenades={grenades}
            safeGrenades={safeGrenades}
            safeGrenadeCounts={safeGrenadeCounts}
            itemById={itemById}
            isEditing={isEditing}
            charActive={charActive}
            onGrenadeChange={handleGrenadeChange}
            onGrenadeCountsChange={handleGrenadeCountsChange}
          />
        </div>

        <div className={wideLayout ? "col-span-2 md:col-span-1" : ""}>
          <ArmorMedicalPanel
            armorClass={gear.armorClass}
            maxArmor={maxArmor}
            safeMedCounts={safeMedCounts}
            isEditing={isEditing}
            charActive={charActive}
            onArmorChange={(val) => handleChange("armorClass", val)}
            onMedCountsChange={handleMedCountsChange}
          />
        </div>

        <div className={wideLayout ? "col-span-2" : ""}>
          <GadgetPanel
            gadgetId={gear.gadget}
            classGadgets={classGadgets}
            equipmentData={equipmentData}
            activeGadgetConfig={activeGadgetConfig}
            gadgetAmmo={gear.gadgetAmmo}
            secondaryGadget={secondaryGadget}
            characterId={characterId}
            charClass={character.class}
            charActive={charActive}
            ownedGadgetIds={ownedGadgetIds}
            itemById={itemById}
            isEditing={isEditing}
            onGadgetChange={handleGadgetChange}
            onGadgetAmmoChange={handleGadgetAmmoChange}
          />
        </div>

        <div className={wideLayout ? "col-span-2" : ""}>
          <GearsetsPanel
            gearsets={gearsets}
            gearSlots={safeGearSlots}
            logs={character?.logs}
            isEditing={isEditing}
            onGearSlotChange={handleGearSlotChange}
          />
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
