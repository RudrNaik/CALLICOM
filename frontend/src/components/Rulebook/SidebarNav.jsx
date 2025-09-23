import { useState, useEffect, useCallback } from "react";

const SidebarNav = ({ rules }) => {
  const topLevel = rules.filter((r) => !r.parentId);
  const getChildren = (parentId) => rules.filter((r) => r.parentId === parentId);

  const [expandedSections, setExpandedSections] = useState({});
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false); // >= sm

  // init section expand state
  useEffect(() => {
    const init = {};
    topLevel.forEach((r) => (init[r.id] = false));
    setExpandedSections(init);
  }, [rules]);

  // detect desktop vs mobile
  useEffect(() => {
    const apply = () => {
      const desktopNow = window.innerWidth >= 640; // Tailwind sm
      setIsDesktop(desktopNow);
      if (desktopNow) {
        setIsOpenMobile(false); // drawer irrelevant on desktop
        document.body.style.overflow = ""; // ensure scroll restored
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // lock body scroll only when mobile drawer is open
  useEffect(() => {
    if (!isDesktop) {
      document.body.style.overflow = isOpenMobile ? "hidden" : "";
    }
  }, [isOpenMobile, isDesktop]);

  // esc closes drawer on mobile
  useEffect(() => {
    const onKey = (e) => !isDesktop && e.key === "Escape" && setIsOpenMobile(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop]);

  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLinkClick = useCallback(() => {
    if (!isDesktop) setIsOpenMobile(false);
  }, [isDesktop]);

  return (
    <>
      {/* Mobile open button */}
      {!isDesktop && !isOpenMobile && (
        <button
          onClick={() => setIsOpenMobile(true)}
          className="fixed left-3 top-24 z-40 rounded-xl bg-orange-600 px-3 py-2 text-sm font-medium shadow-lg hover:bg-orange-500 active:scale-95"
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}

      {/* Mobile backdrop */}
      {!isDesktop && isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          // position: sticky on desktop, fixed drawer on mobile
          isDesktop ? "sticky top-20 self-start" : "fixed left-0 top-20 bottom-0",
          "z-50 sm:z-30",
          // size: fixed height for sticky, width consistent
          isDesktop ? "w-64 h-[calc(100vh-5rem)]" : "w-64 max-w-[80vw]",
          // scroll inside
          "overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-neutral-700",
          // visuals
          "bg-orange-800/50 text-white font-mono border-r border-white/10 backdrop-blur-xs p-4",
          // animation (mobile only)
          !isDesktop ? "transform transition-transform duration-300" : "",
          !isDesktop ? (isOpenMobile ? "translate-x-0" : "-translate-x-full") : "",
        ].join(" ")}
        aria-hidden={!isDesktop && !isOpenMobile}
        aria-label="Rule index sidebar"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold uppercase">Index</h2>

          {/* Desktop: no collapse button. Mobile: show close (×) */}
          {!isDesktop && (
            <button
              onClick={() => setIsOpenMobile(false)}
              className="rounded-lg px-2 py-1 text-sm text-orange-300 hover:text-orange-400"
              aria-label="Close sidebar"
            >
              ×
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {topLevel.map((rule) => {
            const children = getChildren(rule.id);
            const isSectionOpen = expandedSections[rule.id];

            return (
              <li key={rule.id}>
                <div
                  className="flex justify-between items-center px-2 py-1 hover:text-orange-400 cursor-pointer"
                  onClick={() => toggleSection(rule.id)}
                >
                  <a
                    href={`#${rule.id}`}
                    onClick={handleLinkClick}
                    className="truncate"
                  >
                    {rule.title}
                  </a>
                  {children.length > 0 && (
                    <span className="text-sm text-orange-300 select-none" aria-hidden>
                      {isSectionOpen ? "−" : "+"}
                    </span>
                  )}
                </div>

                {isSectionOpen && children.length > 0 && (
                  <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-300">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <a
                          href={`#${sub.id}`}
                          className="block hover:text-orange-300 truncate"
                          onClick={handleLinkClick}
                        >
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
    </>
  );
};

export default SidebarNav;
