
function SkillsView({skillGroups, isEditing, editedSkills, character, increaseSkill, decreaseSkill}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(skillGroups).map(([group, list]) => (
        <div key={group}>
          <h3 className="text-orange-300 font-semibold mb-2">{group}</h3>
          <div className="space-y-1">
            {list.map((skill) => (
              <div
                key={skill}
                className="bg-neutral-800 px-2 py-1 rounded flex justify-between"
              >
                <span>{skill}</span>
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
