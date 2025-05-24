import { Link } from "react-router-dom";
import skillGroups from "../../data/skills.json";
import SpecView from "../CharacterRoster/CharDetailComponents/SpecView";

const FinalReview = ({ formData, onBack, onSubmit }) => {
  const {
    name = "",
    callsign = "",
    background = "",
    class: charClass = "",
    skills = {},
    attributes = {},
    specializations = [],
    emergencyDice = 0,
  } = formData || {};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-white bg-neutral-900/80" style={{ fontFamily: 'Geist_Mono' }}>
      <h1 className="text-2xl font-bold text-orange-400">
        Review Your Character
      </h1>

      <div className="space-y-2">
        <p>
          <span className="font-bold text-orange-300">Name:</span> {name}
        </p>
        <p>
          <span className="font-bold text-orange-300">Callsign:</span>{" "}
          {callsign}
        </p>
        <p>
          <span className="font-bold text-orange-300">Background:</span>{" "}
          {background}
        </p>
        <p>
          <span className="font-bold text-orange-300">Class:</span> {charClass}
        </p>
        <p>
          <span className="font-bold text-orange-300">Emergency Dice:</span>{" "}
          {emergencyDice}
        </p>
      </div>

      <div>
        <h2 className="text-xl text-orange-400 font-bold mb-2">Attributes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(attributes).map(([attr, value]) => (
            <div key={attr} className="bg-neutral-800 p-2 rounded">
              <span className="block font-bold text-orange-300">{attr}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl text-orange-400 font-bold mb-2">Skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(skillGroups).map(([group, groupSkills]) => (
            <div key={group}>
              <h3 className="text-orange-300 font-semibold mb-2">{group}</h3>
              <div className="space-y-2">
                {groupSkills.map((skill) => (
                  <div
                    key={skill}
                    className="bg-neutral-800 p-2 rounded flex justify-between items-center text-white"
                  >
                    <span className="text-sm">{skill}</span>
                    <span className="text-sm font-bold">
                      Level {skills?.[skill] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {specializations.length > 0 && (
        <SpecView specializations={specializations} />
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Back
        </button>
        <Link to={"/CALLICOM/CharacterManager"}>
          <button
            onClick={onSubmit}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            Confirm & Create
          </button>
        </Link>
      </div>
    </div>
  );
};

export default FinalReview;
