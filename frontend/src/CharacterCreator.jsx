import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import FinalReview from "./components/CharacterCreator/FinalView";
import CharCreator from "./components/CharacterCreator/CharCreator";
import { useState } from "react";
import SkillCreator from "./components/CharacterCreator/SkillCreator";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const createCharacterId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `char-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createBiographyDraft = () => ({
  bio: "",
  age: "",
  height: "",
  weight: "",
  gender: "",
  famRelations: "",
  normRelations: "",
  psych: "",
  notes: "",
});

/** @returns {import("./types/improvedCharTypes").Character} */
const createCharacterDraft = (userName) => ({
  uniqueId: createCharacterId(),
  _id: undefined,
  userId: userName,
  name: "",
  callsign: "",
  background: "",
  class: "",
  attributes: {
    Alertness: 0,
    Body: 0,
    Intelligence: 0,
    Spirit: 0,
  },
  skills: {},
  specializations: [],
  equipment: {
    primaryWeapon: { name: "", category: "", family: "" },
    secondaryWeapon: { name: "", category: "", family: "" },
    classGadget: "",
    grenades: ["", ""],
    gadget: "",
    gadgetAmmo: {},
    armorClass: 0,
    miscGear: "",
    gearSlots: {},
  },
  fleshWounds: 0,
  deepWounds: 0,
  XP: 0,
  emergencyDice: 0,
  createdAt: new Date().toISOString(),
  Bio: createBiographyDraft(),
});

const CharacterCreator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() =>
    createCharacterDraft(
      JSON.parse(localStorage.getItem("user") || "null")?.userName || ""
    )
  );
  const { user } = useContext(AuthContext);

  const handleSubmit = () => {
    const fullCharacter = {
      ...createCharacterDraft(user?.userName || ""),
      ...formData,
      uniqueId: formData.uniqueId || createCharacterId(),
      XP: Number(formData.XP || 0),
      userId: user?.userName || formData.userId || "",
      createdAt: formData.createdAt || new Date().toISOString(),
      equipment: {
        ...createCharacterDraft(user?.userName || "").equipment,
        ...formData.equipment,
      },
      attributes: {
        Alertness: 0,
        Body: 0,
        Intelligence: 0,
        Spirit: 0,
        ...formData.attributes,
      },
      skills: formData.skills || {},
      specializations: formData.specializations || [],
      Bio: {
        ...createBiographyDraft(),
        ...(formData.Bio && typeof formData.Bio === "object" ? formData.Bio : {}),
      },
      fleshWounds: Number(formData.fleshWounds || 0),
      deepWounds: Number(formData.deepWounds || 0),
      emergencyDice: Number(formData.emergencyDice || 0),
    };

    const storageKey = `roster_characters_${fullCharacter.userId}`;
    const cachedCharacters = JSON.parse(
      localStorage.getItem(storageKey) || "[]",
    );
    const storedCharacters = Array.isArray(cachedCharacters)
      ? cachedCharacters
      : Array.isArray(cachedCharacters?.data)
        ? cachedCharacters.data
        : [];
    localStorage.setItem(storageKey, JSON.stringify([...storedCharacters, fullCharacter]));
    navigate("/CALLICOM/CharacterManager");
  };

  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>

      {step === 1 && (
        <CharCreator
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <SkillCreator
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <FinalReview
          formData={formData}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      )}

    </div>
  );
};

export default CharacterCreator;
