import { useEffect, useState } from "react";
import skillGroups from "../../data/skills.json";
import Edice from "./CharDetailComponents/EDice";
import SpecModal from "./CharDetailComponents/SpecModal";
import SpecView from "./CharDetailComponents/SpecView";
import SkillsView from "./CharDetailComponents/SkillsView";
import AttributeView from "./CharDetailComponents/AttributeView";
import DerivedStats from "./CharDetailComponents/DerivedStats";
import EquipmentSelection from "./CharDetailComponents/EquipmentView";
import XpControls from "./CharDetailComponents/XpHandler";

function CharacterDetail({ character, onUpdate, user }) {
  if (!character) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [xpRemaining, setXpRemaining] = useState(character.XP || 0);
  const [editedSkills, setEditedSkills] = useState({ ...character.skills });
  const [emergencyDice, setEmergencyDice] = useState(
    character.emergencyDice || 0
  );
  const [specializations, setSpecializations] = useState([
    ...character.specializations,
  ]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showXpInput, setShowXpInput] = useState(false);
  const [xpToAdd, setXpToAdd] = useState("");

  useEffect(() => {
    if (character) {
      setSpecializations([...character.specializations]);
      setEditedSkills({ ...character.skills });
      setXpRemaining(character.XP || 0);
      setEmergencyDice(character.emergencyDice || 0);
    }
  }, [character]);

  const getUpgradeCost = (level) => {
    if (level === 0) return 1;
    if (level === 1) return 4;
    if (level === 2) return 10;
    if (level === 3) return 15;
    return 0;
  };

  const increaseSkill = (skill) => {
    const level = editedSkills[skill] || 0;
    if (level >= 4) return;
    const cost = getUpgradeCost(level);
    if (xpRemaining >= cost) {
      setEditedSkills({ ...editedSkills, [skill]: level + 1 });
      setXpRemaining(xpRemaining - cost);
    }
  };

  const decreaseSkill = (skill) => {
    const current = editedSkills[skill] || 0;
    const original = character.skills?.[skill] || 0;

    if (current > original) {
      const refund = getUpgradeCost(current - 1);
      setEditedSkills({ ...editedSkills, [skill]: current - 1 });
      setXpRemaining(xpRemaining + refund);
    }
  };

  const addEmergencyDie = () => {
    if (emergencyDice < 4 && xpRemaining >= 1) {
      setEmergencyDice(emergencyDice + 1);
      setXpRemaining(xpRemaining - 1);
    }
  };

  const removeEmergencyDie = () => {
    if (emergencyDice > 0) {
      setEmergencyDice(emergencyDice - 1);
      if (isEditing) {
        setXpRemaining(xpRemaining + 1);
      }
    }
  };

  const removeSpecialization = (index) => {
    const baseLength = character.specializations.length;
    if (index < baseLength) return;

    const updated = [...specializations];
    updated.splice(index, 1);
    setSpecializations(updated);
    setXpRemaining((prev) => prev + 5);
  };

  const patchXP = async (amount) => {
    const updates = {
      XP: xpRemaining + amount,
    };

    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (res.ok) {
      setXpRemaining((prev) => prev + amount);
      setXpToAdd("");
      setShowXpInput(false);
      onUpdate();
    } else {
      alert("Failed to update XP.");
    }
  };

  const handleSaveChanges = async () => {
    const updates = {
      XP: xpRemaining,
      skills: editedSkills,
      specializations,
      emergencyDice,
    };

    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (res.ok) {
      setIsEditing(false);
      setIsEditingEquipment(false);
      onUpdate();
    } else {
      alert("Failed to update character.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 text-white" style={{ fontFamily: 'Geist_Mono' }}>
      <h1 className="text-3xl font-bold text-orange-400">
        {character.name} [{character.callsign}]
      </h1>

      <h2 className="text-xl font-bold text-orange-400 mt-4">Attributes</h2>
      <AttributeView character={character} />

      <DerivedStats
        character={character}
        userId={user}
        refreshCharacter={onUpdate}
      />

      <EquipmentSelection
        character={character}
        isEditing={isEditingEquipment}
        userId={user}
        refreshCharacter={onUpdate}
        setIsEditing={setIsEditingEquipment}
      />

      {!isEditingEquipment && (
        <button
          onClick={() => setIsEditingEquipment(true)}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
        >
          Edit Equipment
        </button>
      )}

      <h2 className="text-xl font-bold text-orange-400 mt-4">Skills</h2>

      {!isEditing ? (
        <XpControls
          xpRemaining={xpRemaining}
          setIsEditing={setIsEditing}
          patchXP={patchXP}
        />
      ) : (
        <button
          onClick={handleSaveChanges}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Confirm | {xpRemaining} XP Remaining
        </button>
      )}

      <SkillsView
        skillGroups={skillGroups}
        isEditing={isEditing}
        editedSkills={editedSkills}
        character={character}
        increaseSkill={increaseSkill}
        decreaseSkill={decreaseSkill}
      />

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

      <Edice
        isEditing={isEditing}
        emergencyDice={emergencyDice}
        charEmergencyDice={character.emergencyDice}
        removeEmergencyDie={removeEmergencyDie}
        addEmergencyDie={addEmergencyDie}
      />
    </div>
  );
}

export default CharacterDetail;
