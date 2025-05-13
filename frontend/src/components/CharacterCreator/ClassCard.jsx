import React from "react";

const ClassCard = ({ classData, selectedClass, onSelect, touched }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Object.entries(classData).map(([className, classInfo]) => {
        const isSelected = selectedClass === className;

        return (
          <button
            key={className}
            type="button"
            onClick={() => onSelect(className)}
            className={`text-left transition-transform duration-200 ${
              isSelected
                ? "scale-[1.01]"
                : "hover:scale-[1.01]"
            }`}
          >
            <div className={`bg-neutral-800/80 border-l-8 border-neutral-800 p-6 rounded shadow ${
              isSelected
                ? "scale-[1.02] border-orange-500"
                : "hover:scale-[1.01]"
            }`}>
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold">{className}</h2>
                <div className="text-xs text-orange-400 font-semibold space-y-1 text-right">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-orange-300 font-semibold mr-1">
                      Level 2:
                    </span>
                    {classInfo.level2.map((skill, idx) => (
                      <span
                        key={`lvl2-${idx}`}
                        className="px-2 py-0.5 rounded bg-orange-900/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-orange-300 font-semibold mr-1">
                      Level 1:
                    </span>
                    {classInfo.level1.map((skill, idx) => (
                      <span
                        key={`lvl1-${idx}`}
                        className="px-2 py-0.5 rounded bg-orange-900/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-200 whitespace-pre-line">
                {classInfo.rulesText}
              </p>
              <p className="text-xs text-gray-400 whitespace-pre-line">
                {classInfo.description}
              </p>
            </div>
          </button>
        );
      })}

      {touched && !selectedClass && (
        <p className="text-red-400 text-sm mt-1 col-span-full">
          Class selection is required
        </p>
      )}
    </div>
  );
};

export default ClassCard;
