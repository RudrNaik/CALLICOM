import { useEffect, useRef, useState } from "react";
import skillGroups from "../../data/skills.json";
import {
  ATTR_EXP_COST,
  SPEC_EXP_COST,
  MULTICLASS_EXP_COST,
  applySkillIncrease,
  applySkillDecrease,
  applyAttributeIncrease,
  applySpecializationRemoval,
  applyMulticlassSelection,
  applyEmergencyDiceIncrease,
  applyEmergencyDiceDecrease,
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
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [xpRemaining, setXpRemaining] = useState(character?.XP || 0);
  const [editedSkills, setEditedSkills] = useState({ ...character?.skills });
  const [emergencyDice, setEmergencyDice] = useState(
    character?.emergencyDice || 0,
  );
  const [originalEmergencyDice, setOriginalEmergencyDice] = useState(
    character?.emergencyDice || 0,
  );
  const [specializations, setSpecializations] = useState([
    ...(character?.specializations || []),
  ]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [campaignInput, setCampaignInput] = useState(
    character?.campaignId || "",
  );
  const [charActive, setCharActive] = useState(false);
  const [columnView, setColumnView] = useState(true);
  const [activeTab, setActiveTab] = useState("gameplay");
  const [multiClass, setMulticlass] = useState(character?.multiClass || "");
  const [showMultiClassModal, setShowMultiClassModal] = useState(false);
  const [Biography, setBio] = useState("");
  const [attributes, setAttributes] = useState({ ...character?.attributes });
  const [fleshWounds, setFleshWounds] = useState(character?.fleshWounds || 0);
  const [deepWounds, setDeepWounds] = useState(character?.deepWounds || 0);
  const [isSavingWounds, setIsSavingWounds] = useState(false);
  const prevWounds = useRef({
    fleshWounds: character?.fleshWounds || 0,
    deepWounds: character?.deepWounds || 0,
  });
  const woundsTimerRef = useRef(null);
  const equipmentRef = useRef(null);

  const characterKey =
    character?._id || character?.uniqueId || character?.callsign;

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
      setBio(
        character?.Bio && typeof character.Bio === "object"
          ? { ...emptyBiography, ...character.Bio }
          : character?.Bio || "",
      );

      const fw = character.fleshWounds || 0;
      const dw = character.deepWounds || 0;
      setFleshWounds(fw);
      setDeepWounds(dw);
      prevWounds.current = { fleshWounds: fw, deepWounds: dw };
    }
  }, [character]);

  // Only reset "active" (mission) state when switching to a different
  // character, not on every in-place refresh of the same one (e.g. a
  // live ammo update writing back to the character object).
  useEffect(() => {
    setCharActive(false);
  }, [characterKey]);

  // 700ms debounce because rapidly spamming the deep and flesh wounds causes
  // desync with the backend as master so it reverts. Shared by DerivedStats
  // and the Roll Calculator so both read/write the same wound counters.
  useEffect(() => {
    if (woundsTimerRef.current) {
      clearTimeout(woundsTimerRef.current);
    }

    woundsTimerRef.current = setTimeout(() => {
      const changed =
        fleshWounds !== prevWounds.current.fleshWounds ||
        deepWounds !== prevWounds.current.deepWounds;

      if (!changed) return;

      setIsSavingWounds(true);
      try {
        onUpdate({ fleshWounds, deepWounds });
        prevWounds.current = { fleshWounds, deepWounds };
      } finally {
        setIsSavingWounds(false);
      }
    }, 700);

    return () => {
      if (woundsTimerRef.current) clearTimeout(woundsTimerRef.current);
    };
  }, [fleshWounds, deepWounds, onUpdate]);

  const handleDecreaseFleshWounds = () =>
    setFleshWounds((v) => Math.max(v - 1, 0));
  const handleIncreaseFleshWounds = () => setFleshWounds((v) => v + 1);

  const handleDecreaseDeepWounds = () =>
    setDeepWounds((v) => Math.max(v - 1, 0));
  const handleIncreaseDeepWounds = () => setDeepWounds((v) => v + 1);

  /**
   * Sets the specific skill to the next level.
   * @param {*} skill selected skill
   * @returns sets the edited skill in the payload to the level + 1.
   */
  const increaseSkill = (skill) => {
    const result = applySkillIncrease(editedSkills, xpRemaining, skill);
    if (!result) return;
    setEditedSkills(result.skills);
    setXpRemaining(result.xp);
  };

  /**
   * Decreases the current skill, sets the edited skill payload to one less than it was currently.
   * @param {*} skill Selected skill
   */
  const decreaseSkill = (skill) => {
    const result = applySkillDecrease(editedSkills, xpRemaining, skill, character.skills);
    if (!result) return;
    setEditedSkills(result.skills);
    setXpRemaining(result.xp);
  };

  /**
   * Adds an emergency dice to the character's E-dice count.
   */
  const addEmergencyDie = () => {
    const result = applyEmergencyDiceIncrease(emergencyDice, xpRemaining);
    if (!result) return;
    setEmergencyDice(result.emergencyDice);
    setXpRemaining(result.xp);
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

    const result = applyEmergencyDiceDecrease(emergencyDice, xpRemaining, isEditing);
    if (!result) return;

    setEmergencyDice(result.emergencyDice);

    if (isEditing) {
      setXpRemaining(result.xp); // Refund XP during editing
    } else {
      patchRemoveEDice(1); // Patch to the backend after state is updated
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
    const result = applySpecializationRemoval(
      specializations,
      xpRemaining,
      index,
      character.specializations.length,
      isEditing,
    );
    if (!result) return;

    setSpecializations(result.specializations);
    setXpRemaining(result.xp);
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
    onUpdate(updates);
  };

  /**
   * Patches the backend data for the multiclass. Blocked if you have a multiclass already, if you dont have enough EXP, or there isnt any value.
   * @param {*} secClass
   * @returns nothing if blocked.
   */
  const patchMulticlass = async (secClass) => {
    const result = applyMulticlassSelection(xpRemaining, multiClass, secClass);
    if (!result) {
      if (secClass && !multiClass) {
        alert(`You need at least ${MULTICLASS_EXP_COST} XP to multiclass.`);
      }
      return;
    }

    setMulticlass(result.multiClass);
    setXpRemaining(result.xp);
    setShowMultiClassModal(false);
    onUpdate({ multiClass: result.multiClass, XP: result.xp });
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

    const result = applyAttributeIncrease(attributes, xpRemaining, attrKey);
    if (!result) {
      alert(`You need ${ATTR_EXP_COST} XP for an attribute increase.`);
      return;
    }

    setAttributes(result.attributes);
    setXpRemaining(result.xp);
    onUpdate?.({ XP: result.xp, attributes: result.attributes });
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

  if (!character) return null;

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

      <div className="flex border-b border-neutral-700 mb-4">
        {[
          ["gameplay", "Gameplay"],
          ["logs", "Logs"],
          ["logistics", "Logistics"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-semibold cursor-pointer border-b-2 -mb-px ${
              activeTab === key
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-orange-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "logs" && (
        <div className="text-gray-400 italic p-6">
          Mission logs coming soon.
        </div>
      )}

      {activeTab === "logistics" && (
        <div className="text-gray-400 italic p-6">
          Logistics coming soon.
        </div>
      )}

      {activeTab === "gameplay" && (
        <>
      <div className="flex justify-end">
        <button
          onClick={() => setColumnView((prev) => !prev)}
          className="bg-neutral-800 hover:bg-neutral-700 border border-orange-500/40 text-orange-300 px-3 py-1 rounded text-xs cursor-pointer"
        >
          {columnView ? "Switch to Vertical View" : "Switch to Column View"}
        </button>
      </div>

      <div
        className={
          columnView ? "grid md:grid-cols-2 gap-6" : "flex flex-col gap-6"
        }
      >
        {!columnView && (
          <div className="order-1">
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
              isEditing={isEditing}
              onBuy={patchAttribute}
            />

            <DerivedStats
              character={character}
              fleshWounds={fleshWounds}
              deepWounds={deepWounds}
              isSavingWounds={isSavingWounds}
              onIncreaseFlesh={handleIncreaseFleshWounds}
              onDecreaseFlesh={handleDecreaseFleshWounds}
              onIncreaseDeep={handleIncreaseDeepWounds}
              onDecreaseDeep={handleDecreaseDeepWounds}
            />
          </div>
        )}

        {/* Left column: Attributes / Skills / Specializations */}
        <div className={columnView ? "" : "order-3"}>
          <div className="flex items-center justify-between flex-wrap gap-2">
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

            {!isEditing ? (
              <XpControls
                xpRemaining={xpRemaining}
                setIsEditing={setIsEditing}
                patchXP={patchXP}
                setMulticlass={setMulticlass}
                patchMulticlass={patchMulticlass}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveChanges}
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                >
                  Confirm | {xpRemaining} XP Remaining
                </button>

                {isEditing && !multiClass && (
                  <button
                    disabled={xpRemaining < MULTICLASS_EXP_COST}
                    onClick={() => setShowMultiClassModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:hover:bg-gray-800 px-2 py-1 rounded text-xs"
                  >
                    Multiclass | {MULTICLASS_EXP_COST} XP
                  </button>
                )}
              </div>
            )}
          </div>

          {showMultiClassModal && xpRemaining >= MULTICLASS_EXP_COST && (
            <MultiClassModal
              onClose={setShowMultiClassModal}
              patchMulticlass={patchMulticlass}
              charClass={character}
            />
          )}

          <AttributeView
            attributes={attributes}
            xp={xpRemaining}
            isEditing={isEditing}
            onBuy={patchAttribute}
          />

          {columnView && (
            <DerivedStats
              character={character}
              fleshWounds={fleshWounds}
              deepWounds={deepWounds}
              isSavingWounds={isSavingWounds}
              onIncreaseFlesh={handleIncreaseFleshWounds}
              onDecreaseFlesh={handleDecreaseFleshWounds}
              onIncreaseDeep={handleIncreaseDeepWounds}
              onDecreaseDeep={handleDecreaseDeepWounds}
            />
          )}

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
                  <span className="text-orange-500 font-bold">roll</span> during
                  a <span className="text-orange-500 font-bold">check</span>.
                  the higher the level, the more dice you roll.
                </p>
                <p className="text-neutral-500 text-xs">
                  IE: 0 in a skill is 2d6l, 1 in a skill is 1d6, 2 is 2d6l and
                  so on for a max of 4 levels in a skill.
                </p>
              </div>
            </div>

            <SkillsView
              skillGroups={skillGroups}
              isEditing={isEditing}
              editedSkills={editedSkills}
              character={character}
              increaseSkill={increaseSkill}
              decreaseSkill={decreaseSkill}
              wideColumns={!columnView}
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

            {isEditing && xpRemaining >= SPEC_EXP_COST && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSpecModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded"
                >
                  + Add Specialization (−{SPEC_EXP_COST} XP)
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
        </div>

        {/* Right column: Equipment */}
        <div
          className={`order-2 ${
            columnView ? "md:border-l md:border-neutral-500/40 md:pl-6" : ""
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="relative inline-block group">
              <h2 className="text-2xl font-bold text-orange-400 mt-4">
                Equipment{" "}
                <span className="text-xs font-light text-neutral-400">[?]</span>
              </h2>

              {/* Tooltip modal */}
              <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
                <p>
                  Your equipment determines the gear that you bring into a
                  mission. You can choose a{" "}
                  <span className="text-orange-500 font-bold">primary</span>, a{" "}
                  <span className="text-orange-500 font-bold">secondary</span>,
                  2 types of{" "}
                  <span className="text-orange-500 font-bold">grenades</span>,
                  and then your{" "}
                  <span className="text-orange-500 font-bold">armor</span> and{" "}
                  <span className="text-orange-500 font-bold">gadget</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  isEditingEquipment
                    ? equipmentRef.current?.save()
                    : setIsEditingEquipment(true)
                }
                className={`px-2 py-1 rounded text-xs cursor-pointer ${
                  isEditingEquipment
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {isEditingEquipment ? "Save Equipment" : "Edit Equipment"}
              </button>

              <button
                onClick={() => setCharActive((prev) => !prev)}
                className={`px-2 py-1 rounded text-xs cursor-pointer ${
                  charActive
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-orange-600 hover:bg-orange-800"
                }`}
              >
                {charActive ? "Set Inactive" : "Set Active"}
              </button>
            </div>
          </div>

          <EquipmentSelection
            ref={equipmentRef}
            character={character}
            isEditing={isEditingEquipment}
            userId={user}
            refreshCharacter={onUpdate}
            setIsEditing={setIsEditingEquipment}
            charActive={charActive}
            campEquipment={equipment} //Know that this only applies to Siberia2022 atm. Any character not assigned to that campaign does not have the restrictions.
            wideLayout={!columnView}
          />
        </div>
      </div>

      {/* Calculator */}
      <Collapsible
        title={"Roll Calculator"}
        color={"orange-400"}
        headerSize={"2xl"}
      >
        <RollCalculator
          characterData={character}
          fleshWounds={fleshWounds}
          deepWounds={deepWounds}
          onIncreaseFlesh={handleIncreaseFleshWounds}
          onDecreaseFlesh={handleDecreaseFleshWounds}
          onIncreaseDeep={handleIncreaseDeepWounds}
          onDecreaseDeep={handleDecreaseDeepWounds}
        />
      </Collapsible>

      {/* Biography */}
      <Collapsible title={"Biography"} color={"orange-400"} headerSize={"2xl"}>
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow col-span-2">
          {isEditingBio ? (
            typeof Biography === "object" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {biographyFields.map(([field, label]) => (
                  <label
                    key={field}
                    className={
                      field === "bio" || field === "notes"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <span className="block text-xs text-orange-400 mb-1">
                      {label}
                    </span>
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
          ) : typeof Biography === "object" ? (
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {biographyFields.map(([field, label]) => (
                <div
                  key={field}
                  className={
                    field === "bio" || field === "notes" ? "sm:col-span-2" : ""
                  }
                >
                  <span className="block text-orange-400">{label}</span>
                  <p className="whitespace-pre-wrap">
                    {Biography[field] || "..."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-xs mt-1">
              {Biography || "..."}
            </p>
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
        </>
      )}
    </div>
  );
}

export default CharacterDetail;
