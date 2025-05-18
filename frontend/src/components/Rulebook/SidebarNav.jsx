import { useState, useEffect } from "react";


const SidebarNav = ({ rules }) => {
  const topLevel = rules.filter(rule => !rule.parentId);
  const getChildren = (parentId) =>
    rules.filter(rule => rule.parentId === parentId);

  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const initialState = {};
    topLevel.forEach(rule => {
      initialState[rule.id] = false;
    });
    setExpandedSections(initialState);
  }, [rules]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <aside className="w-full sm:w-64 h-screen top-20 sticky p-4 bg-orange-900/50 text-white font-mono overflow-y-auto border-r">
      <h2 className="text-xl font-bold mb-4 uppercase">Index</h2>
      <ul className="space-y-2">
        {topLevel.map(rule => {
          const children = getChildren(rule.id);
          const isOpen = expandedSections[rule.id];

          return (
            <li key={rule.id}>
              <div
                className="flex justify-between items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                onClick={() => toggleSection(rule.id)}
              >
                <a href={`#${rule.id}`}>{rule.title}</a>
                {children.length > 0 && (
                  <span className="text-sm text-orange-300">
                    {isOpen ? "−" : "+"}
                  </span>
                )}
              </div>

              {isOpen && children.length > 0 && (
                <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-300">
                  {children.map(sub => (
                    <li key={sub.id}>
                      <a href={`#${sub.id}`} className="block hover:text-orange-300">
                        {sub.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default SidebarNav;
