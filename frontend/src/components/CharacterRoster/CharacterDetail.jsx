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
  const [originalEmergencyDice, setOriginalEmergencyDice] = useState(
    character.emergencyDice || 0
  );
  const [specializations, setSpecializations] = useState([
    ...character.specializations,
  ]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showXpInput, setShowXpInput] = useState(false);
  const [xpToAdd, setXpToAdd] = useState("");
  const [campaignInput, setCampaignInput] = useState(
    character.campaignId || ""
  );
  const [charActive, setCharActive] = useState(false);

  useEffect(() => {
    if (character) {
      setSpecializations([...character.specializations]);
      setEditedSkills({ ...character.skills });
      setXpRemaining(character.XP || 0);
      setEmergencyDice(character.emergencyDice || 0);
      setOriginalEmergencyDice(character.emergencyDice || 0); // Initialize original emergency dice
      setCampaignInput(character.campaignId || "");
      setCharActive(false);
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
      setEmergencyDice((prev) => prev + 1); // Update the state directly
      setXpRemaining((prev) => prev - 1);
    }
  };

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

  const patchRemoveEDice = async (amount) => {
    const updates = {
      emergencyDice: emergencyDice - amount, // Send updated state to backend
    };

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (res.ok) {
        onUpdate();
      } else {
        alert("Failed to update emergency dice.");
      }
    } catch (err) {
      console.error("Error updating emergency dice:", err);
      alert("Error updating emergency dice.");
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

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      return;
    }

    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, redirecting to login.");
      navigate("/login");
      return;
    }

    const res = await fetch(
      `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    <div
      className="max-w-5xl mx-auto p-6 space-y-6 text-white"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <h1 className="text-3xl font-bold text-orange-400">
        {character.name} [{character.callsign}]
      </h1>

      
      <div className="relative inline-block group">
        <h2 className="text-xl font-bold text-orange-400 mt-4">Attributes</h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Attributes determine your  <span className="text-orange-500 font-bold">wound thresholds, system shock,</span> and other critical attributes of your character via <span className="text-orange-500 font-bold">derived attributes</span>.
          </p>
        </div>
      </div>
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
        charActive={charActive}
      />

      {!isEditingEquipment && (
        <button
          onClick={() => setIsEditingEquipment(true)}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
        >
          Edit Equipment
        </button>
      )}

      <button
        onClick={() => setCharActive((prev) => !prev)}
        className={`px-4 py-2 rounded ml-2 ${
          charActive
            ? "bg-red-700 hover:bg-red-800"
            : "bg-green-700 hover:bg-green-800"
        }`}
      >
        {charActive ? "Set Inactive" : "Set Active"}
      </button>

      <h2 className=""></h2>

      <div className="relative inline-block group">
        <h2 className="text-xl font-bold text-orange-400 mt-4">Skills</h2>

        {/* Tooltip modal */}
        <div className="absolute z-10 hidden group-hover:block w-2xl p-2 bg-neutral-800 text-white text-sm rounded shadow-lg top-full left-0 mt-1">
          <p>
            Skills determine the amount of dice you <span className="text-orange-500 font-bold">roll</span> during a <span className="text-orange-500 font-bold">check</span>. the higher the level, the more dice you roll.
          </p>
          <p className="text-neutral-500 text-xs">
            IE: 0 in a skill is 2d6l, 1 in a skill is 1d6, 2 is 2d6l and so on for a max of 4 levels in a skill.
          </p>
        </div>
      </div>

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

      <div className="mt-6">
        <h2 className="text-xl font-bold text-orange-400 mb-2">
          Assign to Campaign
        </h2>
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
            onClick={async () => {
              const token = localStorage.getItem("token");
              if (!token) {
                console.log("No token found, redirecting to login.");
                navigate("/login");
                return;
              }

              const res = await fetch(
                `https://callicom.onrender.com/api/characters/${user}/${character.callsign}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ campaignId: campaignInput }),
                }
              );

              if (res.ok) {
                alert("Campaign assigned.");
                onUpdate();
              } else {
                alert("Failed to assign campaign.");
              }
            }}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterDetail;
