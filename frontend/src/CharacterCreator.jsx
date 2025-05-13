import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import FinalReview from "./components/CharacterCreator/FinalView";
import CharCreator from "./components/CharacterCreator/CharCreator";
import { useState } from "react";
import SkillCreator from "./components/CharacterCreator/SkillCreator";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

const CharacterCreator = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    callsign: "",
    background: "",
    class: "",
    skills: {},
  });
  const { isLoggedIn, user } = useContext(AuthContext);

  const handleSubmit = async () => {
    const fullCharacter = {
      ...formData,
      userId: user.userName,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:8080/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullCharacter),
      });

      if (!response.ok) throw new Error("Failed to create character");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Error creating character");
    }
  };

  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white justify-center"
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

      <Footer />
    </div>
  );
};

export default CharacterCreator;
