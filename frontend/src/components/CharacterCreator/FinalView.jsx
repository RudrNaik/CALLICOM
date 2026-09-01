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
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-white" style={{ fontFamily: 'Geist_Mono' }}>
      <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
        <h1 className="inline-block text-2xl font-bold px-3 py-2 bg-orange-500">
          Review
        </h1>

        <div className="space-y-2 mt-4">
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
      </div>

      <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
        <h2 className="text-xl text-orange-400 font-bold mb-2">Attributes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(attributes).map(([attr, value]) => (
            <div key={attr} className="bg-neutral-800/80 p-2 rounded border border-orange-500/20">
              <span className="block font-bold text-orange-300">{attr}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
        <h2 className="text-xl text-orange-400 font-bold mb-2">Skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(skillGroups).map(([group, groupSkills]) => (
            <div key={group}>
              <h3 className="text-orange-300 font-semibold mb-2">{group}</h3>
              <div className="space-y-2">
                {groupSkills.map((skill) => (
                  <div
                    key={skill}
                    className="bg-neutral-800/80 p-2 rounded flex justify-between items-center text-white border border-orange-500/20"
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
        <div className="bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-8 border-orange-500 p-6 rounded shadow">
          <SpecView specializations={specializations} />
        </div>
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
