import skilldesc from "../../../data/skillsDescriptions.json";

function SkillsView({
  skillGroups,
  isEditing,
  editedSkills,
  character,
  increaseSkill,
  decreaseSkill,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(skillGroups).map(([group, object]) => (
        <div key={group}>
          <h3 className="text-orange-300 font-semibold mb-2">{group}</h3>
          <div className="space-y-1">
            {object.map((skill) => (
              <div
                key={skill}
                className="bg-gradient-to-t from-neutral-800 px-2 py-1 rounded-xs flex justify-between border-l-4 border-orange-500"
              >
                <span className="">
                  {skill}
                  <span className="text-[0.65rem] text-neutral-400 relative inline-block group hover:text-orange-500">
                    [?]
                    <div className="absolute z-10 hidden group-hover:block w-[12rem] p-2 bg-neutral-900/90 border-l-4 border-double border-1 border-orange-500 text-white text-[0.5rem]] rounded-xs -left-20">
                      {skilldesc?.[group]?.[skill]}
                    </div>
                  </span>
                </span>
                <div className="flex items-center space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => decreaseSkill(skill)}
                        className="bg-orange-600 hover:bg-orange-700 px-2 rounded text-xs"
                      >
                        −
                      </button>
                    </>
                  )}

                  <span className="font-bold">
                    {isEditing
                      ? editedSkills[skill] || 0
                      : character.skills?.[skill] || 0}
                  </span>

                  {isEditing && (
                    <>
                      <button
                        onClick={() => increaseSkill(skill)}
                        className="bg-orange-600 hover:bg-orange-700 px-2 rounded text-sm"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
export default SkillsView;
