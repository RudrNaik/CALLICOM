import { useState } from "react";
import classData from "../../../data/classSkills.json";

function MultiClassModal({
  onClose,
  patchMulticlass,
}) {
  const [multiClassSpec, setMulticlass] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded w-full max-w-md space-y-4 border border-orange-400">
        <h2 className="text-lg font-bold text-orange-300">Add Multiclass</h2>

        <select
          className="w-full p-2 bg-neutral-800 rounded border border-gray-600 text-white"
          value={multiClassSpec}
          onChange={(e) => setMulticlass(e.target.value)}
        >
          <option value="">Select class</option>
          {Object.keys(classData).map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onClose(false)}
            className="text-gray-300 hover:underline"
          >
            Cancel
          </button>
          <button
            disabled={!multiClassSpec}
            onClick={() => {
              patchMulticlass(multiClassSpec);
              onClose(false);
            }}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:hover:bg-amber-900 px-4 py-1 rounded text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiClassModal;
