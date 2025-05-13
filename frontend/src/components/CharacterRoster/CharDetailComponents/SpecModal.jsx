import {useState} from "react";

function SpecModal({
  editedSkills,
  specializations,
  xpRemaining,
  setSpecializations,
  setXpRemaining,
  setShowSpecModal,
}) {
  const [specSkill, setSpecSkill] = useState("");
  const [specLabel, setSpecLabel] = useState("");
  const [specDetails, setSpecDetails] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded w-full max-w-md space-y-4 border border-orange-400">
        <h2 className="text-lg font-bold text-orange-300">
          Add Specialization
        </h2>

        <select
          className="w-full p-2 bg-neutral-800 rounded border border-gray-600 text-white"
          value={specSkill}
          onChange={(e) => setSpecSkill(e.target.value)}
        >
          <option value="">Select Skill</option>
          {Object.keys(editedSkills).map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Enter specialization (e.g. Assault Rifles)"
          className="w-full p-2 bg-neutral-800 rounded border border-gray-600 text-white"
          value={specLabel}
          onChange={(e) => setSpecLabel(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter specialization details"
          className="w-full p-2 bg-neutral-800 rounded border border-gray-600 text-white"
          value={specDetails}
          onChange={(e) => setSpecDetails(e.target.value)}
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowSpecModal(false)}
            className="text-gray-300 hover:underline"
          >
            Cancel
          </button>
          <button
            disabled={!specSkill || !specLabel}
            onClick={() => {
              setSpecializations([
                ...specializations,
                { skill: specSkill, label: specLabel, details: specDetails},
              ]);
              setXpRemaining(xpRemaining - 5);
              setSpecSkill("");
              setSpecLabel("");
              setShowSpecModal(false);
            }}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-1 rounded text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpecModal;
