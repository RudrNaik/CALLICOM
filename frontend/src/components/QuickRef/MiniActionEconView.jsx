import { useMemo, useState } from "react";
import Actions from "../../data/Actions.json";
import background from "../../assets/Images/4060492.jpg";
import Footer from "../Footer";
import ActionCard from "./MiniActionCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "standard", label: "Standard" },
  { key: "bonus", label: "Bonus" },
  { key: "shooting", label: "Shooting" },
  { key: "cqc", label: "CQC" },
  { key: "movement", label: "Movement" },
];

const SECTIONS = [
  { key: "standard", title: "Standard Actions" },
  { key: "bonus", title: "Bonus Actions" },
  { key: "shooting", title: "Shooting Actions" },
  { key: "cqc", title: "Close Combat" },
  { key: "movement", title: "Movement" },
];

export default function ActionEconomyPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const q = query.trim().toLowerCase();

  const filterFn = (a) =>
    !q ||
    a.name?.toLowerCase().includes(q) ||
    a.type?.toLowerCase().includes(q) ||
    a.tags?.some?.((t) => String(t).toLowerCase().includes(q));

  const filteredSections = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      items: Actions.filter((a) => a.category === s.key && filterFn(a)),
    }));
  }, [q]);

  const visibleSections =
    activeTab === "all"
      ? filteredSections
      : filteredSections.filter((s) => s.key === activeTab);

  return (
    <div className="relative">
      {/* Sticky header */}
      <div className="sticky top-1 bg-black/90 border-b border-white/10 font-mono">
        <div className="max-w-screen-xl mx-auto px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold">Action Economy</h1>
              <p className="text-xs text-gray-300">Per turn:<br></br> [Standard] [Bonus] [Movement]</p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              {/* Tabs */}
              <div className="hidden md:flex p-1 bg-black/40 rounded-xl border border-white/10">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition font-mono
                      ${
                        activeTab === t.key
                          ? "bg-orange-500 text-gray-200"
                          : "text-gray-400 hover:bg-white/10"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 md:w-72">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, type, tag…"
                  className="w-full bg-neutral-900 text-white border border-orange-400/70 rounded-lg px-3 py-2 outline-none focus:border-orange-400 font-mono"
                />
              </div>

              {q && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden grid grid-cols-3 gap-2 font-mono">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-2 rounded-lg text-sm transition font-mono
                    ${
                      activeTab === t.key
                        ? "bg-orange-500 text-black"
                        : "bg-black/30 text-gray-200 border border-white/10"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-screen-xl mx-auto px-3 pb-16 font-mono">
        {visibleSections.map((sec) => (
          <Section key={sec.key} title={sec.title} items={sec.items} />
        ))}

        {activeTab === "all" &&
          visibleSections.every((s) => s.items.length === 0) && (
            <EmptyState query={q} />
          )}

        {activeTab !== "all" &&
          visibleSections.length === 1 &&
          visibleSections[0].items.length === 0 && <EmptyState query={q} />}
      </main>
    </div>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;

  return (
    <>
      <div className="relative flex items-center py-6 font-mono">
        <div className="flex-grow border-t border-white/20" />
        <span className="mx-4 text-gray-100">{title}</span>
        <div className="flex-grow border-t border-white/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono">
        {items.map((action, idx) => (
          <ActionCard key={`${action.name ?? idx}-${idx}`} action={action} />
        ))}
      </div>
    </>
  );
}

function EmptyState({ query }) {
  return (
    <div className="text-center py-16 opacity-90 font-mono">
      <div className="text-xl">
        No actions match {query ? `"${query}"` : "your filters"}.
      </div>
    </div>
  );
}
