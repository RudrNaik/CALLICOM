import { useEffect, useState } from "react";
import skillGroups from "../../data/skills.json";
import {
  getSkillUpgradeCost,
  ATTR_EXP_COST,
  upgradeAttribute,
} from "../../engine/characterEngine";
import Edice from "./CharDetailComponents/EDice";
import SpecModal from "./CharDetailComponents/SpecModal";
import SpecView from "./CharDetailComponents/SpecView";
import SkillsView from "./CharDetailComponents/SkillsView";
import AttributeView from "./CharDetailComponents/AttributeView";
import DerivedStats from "./CharDetailComponents/DerivedStats";
import EquipmentSelection from "./CharDetailComponents/EquipmentView";
import XpControls from "./CharDetailComponents/XpHandler";
import MultiClassModal from "./CharDetailComponents/MultiClassModal";
import Collapsible from "../Collapsible";
import RollCalculator from "./CharDetailComponents/RollCalculator";
import ExpAddedCalc from "./CharDetailComponents/expAddedCalc";
import { normalizeCharacterData } from "../../engine/characterDataHandler";

const biographyFields = [
  ["bio", "Biography"],
  ["age", "Age"],
  ["height", "Height"],
  ["weight", "Weight"],
  ["gender", "Gender"],
  ["famRelations", "Family Relations"],
  ["normRelations", "Normal Relations"],
  ["psych", "Psychological Profile"],
  ["notes", "Notes"],
];

const emptyBiography = Object.fromEntries(
  biographyFields.map(([field]) => [field, ""]),
);

function CharacterDetail({ character, onUpdate, user, equipment }) {
  if (!character) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [xpRemaining, setXpRemaining] = useState(character.XP || 0);
  const [editedSkills, setEditedSkills] = useState({ ...character.skills });
  const [emergencyDice, setEmergencyDice] = useState(character.emergencyDice || 0);
  const [originalEmergencyDice, setOriginalEmergencyDice] = useState(character.emergencyDice || 0);
  const [specializations, setSpecializations] = useState([...character.specializations]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showXpInput, setShowXpInput] = useState(false);
  const [xpToAdd, setXpToAdd] = useState("");
  const [campaignInput, setCampaignInput] = useState(character.campaignId || "");
  const [charActive, setCharActive] = useState(false);
  const [isEditingAttr, setEditAttr] = useState(false);
  const [multiClass, setMulticlass] = useState(character.multiClass || "");
  const [showMultiClassModal, setShowMultiClassModal] = useState(false);
  const [Biography, setBio] = useState("");
  const [attributes, setAttributes] = useState({ ...character.attributes });

  useEffect(() => {
    if (character) {
      setSpecializations([...character.specializations]);
      setAttributes({ ...character.attributes });
      setEditedSkills({ ...character.skills });
      setXpRemaining(character.XP || 0);
      setEmergencyDice(character.emergencyDice || 0);
      setOriginalEmergencyDice(character.emergencyDice || 0);
      setCampaignInput(character.campaignId || "");
      setMulticlass(character.multiClass || "");
      setCharActive(false);
      setBio(
        character?.Bio && typeof character.Bio === "object"
          ? { ...emptyBiography, ...character.Bio }
          : character?.Bio || "",
      );
    }
  }, [character]);

  /**
   * Handles the upgrade cost in terms of EXP needed between levels. You can only level up by being at the previous level, you cant jump from 1 to 4 without being at 2 or 3 along the way.
   * @param {*} level the specific level the character is at.
   * @returns upgrade cost to the next level.
   */
  const handleGetUpgradeCost = (level) => getSkillUpgradeCost(level);

  /**
   * Sets the specific skill to the next level.
   * @param {*} skill selected skill
   * @returns sets the edited skill in the payload to the level + 1.
   */
  const increaseSkill = (skill) => {
    const level = editedSkills[skill] || 0;
    if (level >= 4) return;
    const cost = handleGetUpgradeCost(level);
    if (xpRemaining >= cost) {
      setEditedSkills({ ...editedSkills, [skill]: level + 1 });
      setXpRemaining(xpRemaining - cost);
    }
  };

  /**
   * Decreases the current skill, sets the edited skill payload to one less than it was currently.
   * @param {*} skill Selected skill
   */
  const decreaseSkill = (skill) => {
    const current = editedSkills[skill] || 0;
    const original = character.skills?.[skill] || 0;

    if (current > original) {
      const refund = handleGetUpgradeCost(current - 1);
      setEditedSkills({ ...editedSkills, [skill]: current - 1 });
      setXpRemaining(xpRemaining + refund);
    }
  };

  /**
   * Adds an emergency dice to the character's E-dice count.
   */
  const addEmergencyDie = () => {
    if (emergencyDice < 4 && xpRemaining >= 1) {
      setEmergencyDice((prev) => prev + 1);
      setXpRemaining((prev) => prev - 1);
    }
  };

  /**
   * Removes an emergency dice from the user, and differentiates between Edice being removed during editing and edice removed during play.
   * @returns Nothing
   */
  const removeEmergencyDie = () => {
    if (isEditing && emergencyDice <= originalEmergencyDice) {
      alert("You can't remove more emergency dice than you originally had.");
      return;
    }

    if (emergencyDice > 0) {
      setEmergencyDice(emergencyDice - 1); // Update the state first

      if (isEditing) {
        setXpRemaining(xpRemaining + 1); // Refund XP during editing
      } else {
        // Patch to the backend after state is updated
        patchRemoveEDice(1); // Send the update to backend
      }
    }
  };

  /**
   * Directly patches the edice -1. Ayncrhonous due to calling the backend.
   * @param {*} amount The amount of edice being removed.
   * @returns 
   */
  const patchRemoveEDice = (amount) => {
    const updates = {
      emergencyDice: emergencyDice - amount, // Send updated state to backend
    };

    onUpdate(updates);
  };

  /**
   * Handles removing a specialization from the character.
   * @param {*} index index of the specialization.
   * @returns 
   */
  const removeSpecialization = (index) => {
    const baseLength = character.specializations.length;
    // Allow removing specializations when in editing mode; otherwise block removal
    if (index < baseLength && !isEditing) return;

    const updated = [...specializations];
    updated.splice(index, 1);
    setSpecializations(updated);
    setXpRemaining((prev) => prev + 5);
  };

  /**
   * Patches the exp spent/earned.
   * @param {*} amount amount of exp.
   * @returns 
   */
  const patchXP = (amount) => {
    const updates = {
      XP: xpRemaining + amount,
    };

    setXpRemaining((prev) => prev + amount);
    setXpToAdd("");
    setShowXpInput(false);
    onUpdate(updates);
  };

  /**
   * Patches the backend data for the multiclass. Blocked if you have a multiclass already, if you dont have enough EXP, or there isnt any value.
   * @param {*} secClass 
   * @returns nothing if blocked.
   */
  const patchMulticlass = async (secClass) => {
    // Guard: must have enough XP and not already multiclassed
    if (!secClass) return;
    if (multiClass) return; // Blocks from being able to re-assign a multiclass. Kinda unecessary but its just a double guard.
    if (xpRemaining < 20) {
      alert("You need at least 20 XP to multiclass.");
      return;
    }

    const newXP = Math.max(0, xpRemaining - 20);

    const updates = {
      multiClass: secClass,
      XP: newXP, 
    };

    setMulticlass(secClass);
    setXpRemaining(newXP);
    setShowMultiClassModal(false);
    onUpdate(updates);
  };

  /**
   * Patches the backend data for the biography of said character.
   * @param {*} bio biography string + whitespace. 
   * @returns 
   */
  const patchBio = async (bio) => {
    const updates = {
      Bio: bio,
    };

    setIsEditingBio(false);
    onUpdate(updates);
  };

  /**
   * Patches the attributes (alt, bdy, int, spr) for the backend data.
   * @param {*} attrKey the key of the attribute.
   * @returns 
   */
  const patchAttribute = async (attrKey) => {
    if (!attrKey) return;
    if (xpRemaining < ATTR_EXP_COST) {
      alert(`You need ${ATTR_EXP_COST} XP for an attribute increase.`);
      return;
    }

    const nextAttributes = {
      ...attributes,
      [attrKey]: (attributes?.[attrKey] ?? 0) + 1,
    };
    const newXP = xpRemaining - ATTR_EXP_COST;

    setAttributes(nextAttributes);
    setXpRemaining(newXP);
    onUpdate?.({ XP: newXP, attributes: nextAttributes });
    setEditAttr(false);
  };

  /**
   * Handles saving the changes so everything is synced up.
   * @returns 
   */
  const handleSaveChanges = async () => {
    const updates = normalizeCharacterData({
      XP: xpRemaining,
      skills: editedSkills,
      specializations,
      emergencyDice,
      multiClass,
      attributes,
    });

    setIsEditing(false);
    setIsEditingEquipment(false);
    onUpdate(updates);
  };

  return (
    <div
      className="mx-auto p-6 space-y-3 text-white"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-4xl font-bold text-orange-400 mb-1">
        {character.name} [{character.callsign}]
      </h1>
      <h2 className="text-gray-400 mb-5">
        {character.class} {character.multiClass}
      </h2>

      <div className="relative inline-block group">
        <h2 className="text-2xl font-bold text-orange-400 mt-4 mb-0">
          Attributes{" "}
          <span className="text-xs font-light text-neutral-400">[?]</span>
        </h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-0">
          <p>
            Attributes determine your{" "}
            <span className="text-orange-500 font-bold">
              wound thresholds, system shock,
            </span>{" "}
            and other critical attributes of your character via{" "}
            <span className="text-orange-500 font-bold">
              derived attributes
            </span>
            .
          </p>
        </div>
      </div>
      <AttributeView
        attributes={attributes}
        xp={xpRemaining}
        isEditing={isEditingAttr}
        onBuy={patchAttribute}
      />

      <DerivedStats
        character={character}
        userId={user}
        refreshCharacter={onUpdate}
      />

      {/* Gear */}
      <div className="relative inline-block group">
        <h2 className="text-2xl font-bold text-orange-400 mt-4">
          Equipment{" "}
          <span className="text-xs font-light text-neutral-400">[?]</span>
        </h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Your equipment determines the gear that you bring into a mission.
            You can choose a{" "}
            <span className="text-orange-500 font-bold">primary</span>, a{" "}
            <span className="text-orange-500 font-bold">secondary</span>, 2
            types of <span className="text-orange-500 font-bold">grenades</span>
            , and then your{" "}
            <span className="text-orange-500 font-bold">armor</span> and{" "}
            <span className="text-orange-500 font-bold">gadget</span>.
          </p>
        </div>
      </div>
      <EquipmentSelection
        character={character}
        isEditing={isEditingEquipment}
        userId={user}
        refreshCharacter={onUpdate}
        setIsEditing={setIsEditingEquipment}
        charActive={charActive}
        campEquipment={equipment} //Know that this only applies to Siberia2022 atm. Any character not assigned to that campaign does not have the restrictions.
      />

      <div className="mt-2">
        {!isEditingEquipment && (
          <button
            onClick={() => setIsEditingEquipment(true)}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded cursor-pointer"
          >
            Edit Equipment
          </button>
        )}

        <button
          onClick={() => setCharActive((prev) => !prev)}
          className={`px-4 py-2 rounded ml-2 cursor-pointer ${
            charActive
              ? "bg-red-700 hover:bg-red-800"
              : "bg-orange-600 hover:bg-orange-800"
          }`}
        >
          {charActive ? "Set Inactive" : "Set Active"}
        </button>
      </div>

      <h2 className=""></h2>
      {/*Stats*/}

      <Collapsible
        title={"Stats"}
        color={"orange-400"}
        autoOpen={true}
        headerSize={"2xl"}
      >
        {/* Attributes */}
        <div>
          <h2 className="text-xl font-bold text-orange-400 mt-2 mb-1">
            Attributes{" "}
          </h2>
          <AttributeView
            attributes={attributes}
            xp={xpRemaining}
            isEditing={isEditingAttr}
            onBuy={patchAttribute}
          />
          <div className="mt-2">
            {xpRemaining >= 40 && (
              <button
                onClick={() => setEditAttr((prev) => !prev)}
                className={`px-2 py-1 text-xs rounded ${
                  isEditingAttr
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-orange-600 hover:bg-orange-600"
                }`}
              >
                {isEditingAttr ? "Cancel" : "Edit Attributes"}
              </button>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4">
          <div className="relative inline-block group">
            <h2 className="text-xl font-bold text-orange-400 mt-2 mb-1">
              Skills{" "}
              <span className="text-xs font-light text-neutral-400">[?]</span>
            </h2>

            {/* Tooltip modal */}
            <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
              <p>
                Skills determine the amount of dice you{" "}
                <span className="text-orange-500 font-bold">roll</span> during a{" "}
                <span className="text-orange-500 font-bold">check</span>. the
                higher the level, the more dice you roll.
              </p>
              <p className="text-neutral-500 text-xs">
                IE: 0 in a skill is 2d6l, 1 in a skill is 1d6, 2 is 2d6l and so
                on for a max of 4 levels in a skill.
              </p>
            </div>
          </div>

          {!isEditing ? (
            <XpControls
              xpRemaining={xpRemaining}
              setIsEditing={setIsEditing}
              patchXP={patchXP}
              setMulticlass={setMulticlass}
              patchMulticlass={patchMulticlass}
            />
          ) : (
            <div className="mt-0 flex items-center space-x-2">
              <br></br>
              <button
                onClick={handleSaveChanges}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Confirm | {xpRemaining} XP Remaining
              </button>

              {isEditing && !multiClass && (
                <button
                  disabled={xpRemaining < 20}
                  onClick={() => setShowMultiClassModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:hover:bg-gray-800 px-4 py-2 rounded"
                >
                  Multiclass | 20 XP
                </button>
              )}
            </div>
          )}

          {showMultiClassModal && xpRemaining >= 20 && (
            <MultiClassModal
              onClose={setShowMultiClassModal}
              patchMulticlass={patchMulticlass}
              charClass={character}
            />
          )}

          <div className="mt-4"></div>

          <SkillsView
            skillGroups={skillGroups}
            isEditing={isEditing}
            editedSkills={editedSkills}
            character={character}
            increaseSkill={increaseSkill}
            decreaseSkill={decreaseSkill}
          />
        </div>

        {/* Specializations */}
        <div className="mt-4">
          <div className="relative inline-block group">
            <h2 className="text-xl font-bold text-orange-400">
              Specializations{" "}
              <span className="text-xs font-light text-neutral-400">[?]</span>
            </h2>

            {/* Tooltip modal */}
            <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
              <p>
                Specialiations provide a{" "}
                <span className="text-orange-500 font-bold">+1</span> to rolls
                when conditions are met. For example, a specialization in
                Carbines provides a +1 when rolling to attack with a Carbine.
              </p>
            </div>
          </div>

          {specializations.length > 0 && (
            <SpecView
              specializations={specializations}
              isEditing={isEditing}
              removeSpec={removeSpecialization}
            />
          )}

          {isEditing && xpRemaining >= 5 && (
            <div className="mt-4">
              <button
                onClick={() => setShowSpecModal(true)}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded"
              >
                + Add Specialization (−5 XP)
              </button>
            </div>
          )}

          {showSpecModal && (
            <SpecModal
              editedSkills={editedSkills}
              specializations={specializations}
              xpRemaining={xpRemaining}
              setSpecializations={setSpecializations}
              setXpRemaining={setXpRemaining}
              setShowSpecModal={setShowSpecModal}
            />
          )}
        </div>

        <Edice
          isEditing={isEditing}
          emergencyDice={emergencyDice}
          charEmergencyDice={character.emergencyDice}
          removeEmergencyDie={removeEmergencyDie}
          addEmergencyDie={addEmergencyDie}
        />

        <div className="mt-4">
        {/* expcalctesting */}
        <Collapsible
          title={"EXP Spent"}
          color={"orange-400"}
          autoOpen={false}
          headerSize={"xl"}
          bottomMargin={false}
        >
          <ExpAddedCalc
            character={character}
            userId={user}
            refreshCharacter={onUpdate}
          />
        </Collapsible>
        </div>
        
      </Collapsible>
      

      {/* Calculator */}
      <Collapsible
        title={"Roll Calculator"}
        color={"orange-400"}
        headerSize={"2xl"}
      >
        <RollCalculator characterData={character}></RollCalculator>
      </Collapsible>

      {/* Biography */}
      <Collapsible title={"Biography"} color={"orange-400"} headerSize={"2xl"}>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow col-span-2">
          {isEditingBio ? (
            typeof Biography === "object" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {biographyFields.map(([field, label]) => (
                  <label key={field} className={field === "bio" || field === "notes" ? "sm:col-span-2" : ""}>
                    <span className="block text-xs text-orange-400 mb-1">{label}</span>
                    <textarea
                      className="w-full bg-neutral-900 text-white p-2 rounded resize-y min-h-[60px]"
                      value={Biography[field] || ""}
                      onInput={(event) =>
                        setBio({ ...Biography, [field]: event.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="w-full bg-neutral-900 text-white p-2 rounded resize-y min-h-[100px]"
                placeholder="UNCC LC-514-A 'Formal Background'"
                value={Biography}
                onInput={(event) => setBio(event.target.value)}
              />
            )
          ) : (
            typeof Biography === "object" ? (
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {biographyFields.map(([field, label]) => (
                  <div key={field} className={field === "bio" || field === "notes" ? "sm:col-span-2" : ""}>
                    <span className="block text-orange-400">{label}</span>
                    <p className="whitespace-pre-wrap">{Biography[field] || "..."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-xs mt-1">
                {Biography || "..."}
              </p>
            )
          )}
        </div>
        <div className="mt-2">
          {isEditingBio ? (
            <button
              onClick={() => patchBio(Biography)}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded"
            >
              Close
            </button>
          ) : (
            <button
              onClick={() => setIsEditingBio(true)}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded"
            >
              Edit
            </button>
          )}
        </div>
      </Collapsible>

      {/* Campaign Assignment */}
      <Collapsible
        title={"Assign To Campaign"}
        color={"orange-400"}
        headerSize={"2xl"}
        className="mt-6"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter campaign ID (e.g., campaign0)"
            className="bg-neutral-800 border border-gray-500 rounded px-3 py-1 text-white w-full"
            value={campaignInput}
            onChange={(e) => setCampaignInput(e.target.value)}
          />
          <button
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
            onClick={() => {
              onUpdate({ campaignId: campaignInput });
              alert("Campaign assigned.");
            }}
          >
            Assign
          </button>
        </div>
      </Collapsible>
    </div>
  );
}

export default CharacterDetail;
