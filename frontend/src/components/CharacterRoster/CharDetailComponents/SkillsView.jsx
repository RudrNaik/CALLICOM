import React, { useRef, useState, useEffect } from "react";
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
              <SkillRow
                key={skill}
                skill={skill}
                group={group}
                description={skilldesc?.[group]?.[skill]}
                isEditing={isEditing}
                editedSkills={editedSkills}
                character={character}
                increaseSkill={increaseSkill}
                decreaseSkill={decreaseSkill}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillRow({
  skill,
  group,
  description,
  isEditing,
  editedSkills,
  character,
  increaseSkill,
  decreaseSkill,
}) {
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});

  const show = () => {
    const anchor = anchorRef.current;
    if (!anchor) return setVisible(true);

    const rect = anchor.getBoundingClientRect();
    const tooltipWidth = 192; // 12rem
    const padding = 8;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    // place below anchor; if not enough space at bottom, place above
    const belowTop = rect.bottom + 6;
    const fitsBelow = belowTop + 80 < window.innerHeight; // assume ~80px height
    const top = fitsBelow ? belowTop : Math.max(padding, rect.top - 86);

    setStyle({ position: "fixed", left: `${left}px`, top: `${top}px`, width: `${tooltipWidth}px` });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  const toggle = (e) => {
    if (visible) hide();
    else show();
  };

  useEffect(() => {
    function onDocPointer(e) {
      if (!visible) return;
      const anchor = anchorRef.current;
      const tooltip = tooltipRef.current;
      if (anchor && anchor.contains(e.target)) return;
      if (tooltip && tooltip.contains(e.target)) return;
      hide();
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [visible]);

  return (
    <div className="bg-gradient-to-r from-neutral-800 px-2 py-1 rounded-xs flex justify-between border-l-4 border-orange-500">
      <span className="">
        {skill}
          <span className="text-[0.65rem] text-neutral-400 relative inline-block ml-2">
          <span
            ref={anchorRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onClick={(e) => { e.stopPropagation(); toggle(e); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } }}
            role="button"
            tabIndex={0}
            className="hover:text-orange-500 cursor-pointer"
          >
            [?]
          </span>
          {visible && (
            <div
              ref={tooltipRef}
              onMouseEnter={show}
              onMouseLeave={hide}
              style={style}
              className="z-50 p-2 bg-neutral-900/90 border-l-4 border-orange-500 text-white text-[0.65rem] rounded-xs shadow-lg"
            >
              {description}
            </div>
          )}
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
          {isEditing ? editedSkills[skill] || 0 : character.skills?.[skill] || 0}
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
  );
}

export default SkillsView;
