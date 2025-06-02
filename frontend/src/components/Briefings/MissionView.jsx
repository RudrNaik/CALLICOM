import React from "react"

function MissionView({currentMission}) {
    return (
        <div>
          {currentMission && (
            <div className="bg-neutral-800/90 border border-orange-500 rounded-xl p-6 shadow-lg max-w-md min-h-screen">
              <h2 className="uppercase text-lg font-bold text-neutral-200 bg-orange-500 p-2">
                [{currentMission.Name}]
              </h2>
              <h2 className="text-sm text-neutral-400 mb-4">
                {currentMission.Type}
              </h2>

              <p className="text-orange-300 text-xs font-bold mb-1">
                Key Objectives
              </p>
              <ul className="text-sm mb-3">
                {Object.values(currentMission.Objectives).map((obj, i) => (
                  <li key={i}>- {obj}</li>
                ))}
              </ul>

              {["Brief", "Execution", "FA", "Support", "CnC"].map((field) => (
                <div key={field} className="mb-3">
                  <p className="text-orange-300 text-xs font-bold mb-1">
                    {field === "FA"
                      ? "Force Assessment"
                      : field === "CnC"
                      ? "Command and Control"
                      : field}
                  </p>
                  <p className="text-sm whitespace-pre-line">
                    {currentMission[field]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
    )
}

export default MissionView