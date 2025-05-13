import { useState, useEffect } from "react";
import skillGroups from "../../data/skills.json";
import classStartingSkills from "../../data/classSkills.json";
import SpecModal from "../CharacterRoster/CharDetailComponents/SpecModal";

const attributeList = ["Expertise", "Body", "Intelligence", "Spirit"];

const SkillCreator = ({ formData, setFormData, onNext, onBack }) => {
  const [skills, setSkills] = useState({});
  const [specializations, setSpecializations] = useState([]);
  const [emergencyDice, setEmergencyDice] = useState(3);
  const [showSpecModal, setShowSpecModal] = useState(false);

  const [attributes, setAttributes] = useState({
    Expertise: 0,
    Body: 0,
    Intelligence: 0,
    Spirit: 0,
  });

  const [remainingXP, setRemainingXP] = useState(15);
  const [remainingAttrPoints, setRemainingAttrPoints] = useState(5);

  const getUpgradeCost = (currentLevel) => {
    switch (currentLevel) {
      case 0:
        return 1; // 0 → 1 (pool of 1)
      case 1:
        return 4; // 1 → 2 (pool of 5)
      case 2:
        return 10; // 2 → 3 (pool of 15)
      case 3:
        return 15; // 3 → 4 (pool of 30)
      default:
        return 0;
    }
  };

  useEffect(() => {
    const base = {};
    const config = classStartingSkills[formData.class];
    if (!config) return;

    const allSkills = Object.values(skillGroups).flat();

    allSkills.forEach((skill) => {
      base[skill] = 0;
    });

    config.level2.forEach((skill) => (base[skill] = 2));
    config.level1.forEach((skill) => (base[skill] = 1));

    setSkills(base);
  }, [formData.class]);

  const increaseSkill = (skill) => {
    const currentLevel = skills[skill] || 0;
    const cost = getUpgradeCost(currentLevel);

    if (currentLevel < 4 && remainingXP >= cost) {
      setSkills({ ...skills, [skill]: currentLevel + 1 });
      setRemainingXP(remainingXP - cost);
    }
  };

  const decreaseSkill = (skill) => {
    const currentLevel = skills[skill] || 0;
    const starting = classStartingSkills[formData.class];
    const min = starting.level2.includes(skill)
      ? 2
      : starting.level1.includes(skill)
      ? 1
      : 0;

    if (currentLevel > min) {
      const refund = getUpgradeCost(currentLevel - 1);
      setSkills({ ...skills, [skill]: currentLevel - 1 });
      setRemainingXP(remainingXP + refund);
    }
  };

  const adjustAttribute = (key, amount) => {
    const newVal = attributes[key] + amount;
    if (amount === 1 && remainingAttrPoints > 0 && newVal <= 3) {
      setAttributes({ ...attributes, [key]: newVal });
      setRemainingAttrPoints(remainingAttrPoints - 1);
    }
    if (amount === -1 && newVal >= 0) {
      setAttributes({ ...attributes, [key]: newVal });
      setRemainingAttrPoints(remainingAttrPoints + 1);
    }
  };

  const handleRemoveSpecialization = (index) => {
    const updatedSpecs = [...specializations];
    updatedSpecs.splice(index, 1);
    setSpecializations(updatedSpecs);
    setRemainingXP((prev) => prev + 5);
  };

  const handleNext = () => {
    setFormData({
      ...formData,
      skills,
      attributes,
      specializations,
      emergencyDice,
    });
    onNext();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-neutral-900/80">
      {/* Attribute points. */}
      <h2 className="text-2xl font-bold mt-8 text-orange-400 border-l-4 border-orange-400 px-3">
        Allocate Attribute Points
        <h3 class="text-sm text-white">
          <span className="text-orange-400 ">CALLI/COM</span> UNCC IDENT SERVICE
          // LC-218-D1 Overarching Skills Assessment
        </h3>
        <p className="text-xs text-neutral-500">
          Attributes are your ‘core’ skills and are divided into 4
          categories. <br></br> <br></br>Each character starts with their attributes at zero. Zero
          is the number an average person has in all his abilities. The player
          has 5 points they can spend across the four categories, with each
          category having a cap of three points. Scores above 3+ are essentially
          superhuman and beyond the scope of most characters.
        </p>
      </h2>
      <p className="text-sm text-gray-200">
        Remaining Attribute Points:{" "}
        <span className="text-white font-semibold">{remainingAttrPoints}</span>
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {attributeList.map((attr) => (
          <div
            key={attr}
            className="flex justify-between items-center bg-neutral-800 px-3 py-2 rounded"
          >
            <span>{attr}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => adjustAttribute(attr, -1)}
                className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
              >
                -
              </button>
              <span className="w-6 text-center">{attributes[attr]}</span>
              <button
                onClick={() => adjustAttribute(attr, 1)}
                className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-8 text-orange-400 border-l-4 border-orange-400 px-3">
        Allocate Skill Points
        <h3 class="text-sm text-white">
          <span className="text-orange-400 ">CALLI/COM</span> UNCC IDENT SERVICE
          // LC-218-D2 Advanced Skills Assessment
        </h3>
        <p className="text-xs text-neutral-500">
          The main way XPs may be spent is through the purchase of new skill
          points. All new skill points must be purchased at level one, and be
          invested in by a curve. Where:{" "}
          <span class="text-neutral-400 bold">
            level 1 requires 1 points invested (+1), level 2 is 5 points (+4),
            level 3 is 15 points (+10), and level 4 is 30 points (+15).
          </span>
        </p>
      </h2>
      {/* EXP and Emergency Die */}
      <p className="text-sm text-gray-200">
        Remaining XP:{" "}
        <span className="text-white font-semibold">{remainingXP}</span>
      </p>
      <div className="mt-4 flex items-center space-x-4">
        <div>
          <p className="text-sm text-gray-200">
            Emergency Dice:{" "}
            <span className="text-orange-300 font-semibold">
              {emergencyDice}
            </span>
          </p>
          <p className="text-xs text-gray-500">Max 4 | 1 XP = 1 Die</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (remainingXP > 0 && emergencyDice < 4) {
                setEmergencyDice(emergencyDice + 1);
                setRemainingXP(remainingXP - 1);
              }
            }}
            className="px-2 py-1 rounded bg-orange-700 hover:bg-orange-800"
          >
            + Add
          </button>
          <button
            onClick={() => {
              if (emergencyDice > 0) {
                setEmergencyDice(emergencyDice - 1);
                setRemainingXP(remainingXP + 1);
              }
            }}
            className="px-2 py-1 rounded bg-orange-700 hover:bg-orange-800"
          >
            - Remove
          </button>
        </div>
      </div>

      {/* Skill grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(skillGroups).map(([group, skillsInGroup]) => (
          <div key={group}>
            <h3 className="text-orange-400 font-bold mb-2">{group}</h3>
            <div className="space-y-2">
              {skillsInGroup.map((skill) => (
                <div
                  key={skill}
                  className="flex justify-between items-center bg-neutral-800 px-3 py-3 rounded min-h-[60px] min-w[800px]"
                >
                  <span className="text-xs">{skill}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => decreaseSkill(skill)}
                      className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
                    >
                      -
                    </button>

                    <div className="text-center">
                      <div className="w-6 text-center font-semibold">
                        {skills[skill] || 0}
                      </div>
                      {skills[skill] < 4 && (
                        <div className="text-xs text-orange-300">
                          +{getUpgradeCost(skills[skill] || 0)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => increaseSkill(skill)}
                      className="bg-orange-600 hover:bg-orange-700 px-2 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Specializations */}
      <h2 className="text-2xl font-bold mt-8 text-orange-400 border-l-4 border-orange-400 px-3">
        Specializations
        <h3 class="text-sm text-white">
          <span className="text-orange-400 ">CALLI/COM</span> UNCC IDENT SERVICE
          // LC-218-D3 Specialized Skills Assessment
        </h3>
        <p className="text-xs text-neutral-500">
          Specializations give the character a +1 modifier to their Skill test
          totals under certain conditions. For example, a rifleman may choose a
          specialization in Assault Rifles and thus add one to every roll made
          while using any form of Assault Rifle. A character may purchase
          multiple different specializations in the same Skill, but no more than
          one specialization (i.e. +1 bonus, maximum) can be applied on a single
          die roll.
        </p>
      </h2>
      <ul className="space-y-1 text-sm">
        {specializations.map((s, idx) => (
          <li
            key={idx}
            className="bg-neutral-800 px-3 py-1 rounded flex justify-between items-center"
          >
            <div>
              <span className="text-orange-300 font-medium">{s.skill}:</span>{" "}
              {s.label} | <span className="text-neutral-300">{s.details}</span>
            </div>
            <button
              onClick={() => handleRemoveSpecialization(idx)}
              className="text-red-400 hover:text-red-600 text-xs ml-2"
            >
              X
            </button>
          </li>
        ))}
      </ul>

      {remainingXP >= 5 && (
        <div className="mt-6">
          <button
            onClick={() => setShowSpecModal(true)}
            className="bg-orange-700 hover:bg-orange-800 px-4 py-2 rounded"
          >
            + Add Specialization (-5 XP)
          </button>
        </div>
      )}

      {showSpecModal && (
        <SpecModal
          editedSkills={skills}
          specializations={specializations}
          xpRemaining={remainingXP}
          setSpecializations={setSpecializations}
          setXpRemaining={setRemainingXP}
          setShowSpecModal={setShowSpecModal}
        />
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={remainingXP > 0 || remainingAttrPoints > 0}
          className={`px-4 py-2 rounded ${
            remainingXP === 0 && remainingAttrPoints === 0
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-600 cursor-not-allowed"
          } text-white`}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default SkillCreator;
