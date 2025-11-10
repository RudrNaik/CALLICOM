import React, { useEffect, useState } from "react";


function MainNav({mainLore}, {setStep}){
  const [expandedSections, setExpandedSections] = useState({});

  const sections = mainLore.filter((r) => !r.parentId);
  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const getChildren = (parentId) =>
    mainLore.filter((r) => r.parentId === parentId);

  return (
    <div className="grid grid-cols-5 text-sm">
      <ul className="col-start-2 col-span-2">
        {sections.map((lore) => {
          const children = getChildren(lore.id);
          const isSectionOpen = expandedSections[lore.id];

          return (
            <li key={lore.id}>
              <div
                className="flex items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                onClick={() => toggleSection(lore.id)}
              >
                {children.length > 0 ? (
                  <span
                    className=" text-orange-300 select-none px-2"
                    aria-hidden
                  >
                    {isSectionOpen ? "🗁 " : "🗀 "}
                  </span>
                ) : (
                  <span
                    className=" text-neutral-300 select-none px-2"
                    aria-hidden
                  >
                    {"🗀"}
                  </span>
                )}
                {lore.id}
              </div>

              {isSectionOpen && children.length > 0 && (
                <ul className="ml-4 mt-1 px-3 text-gray-300">
                  {children.map((sub) => (
                    <li key={sub.id} onClick={steppe(1)}> ↳ 🗏 {sub.title}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MainNav;
