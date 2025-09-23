import { useMemo, useState } from "react";
import actions from "./data/actions.json";
import halfActions from "./data/halfActions.json";
import movement from "./data/movement.json";
import shooting from "./data/shootingActions.json";
import cqc from "./data/closeCombatActions.json";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";
import ActionCard from "./components/Rulebook/ActionCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "standard", label: "Standard" },
  { key: "bonus", label: "Bonus" },
  { key: "shooting", label: "Shooting" },
  { key: "cqc", label: "CQC" },
  { key: "movement", label: "Movement" },
];

const SECTIONS = [
  { key: "standard", title: "Standard Actions", data: actions },
  { key: "bonus", title: "Bonus Actions", data: halfActions },
  { key: "shooting", title: "Shooting Actions", data: shooting },
  { key: "cqc", title: "Close Combat", data: cqc },
  { key: "movement", title: "Movement", data: movement },
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
      items: s.data.filter(filterFn),
    }));
  }, [q]);

  const visibleSections =
    activeTab === "all"
      ? filteredSections
      : filteredSections.filter((s) => s.key === activeTab);

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] min-h-screen w-full text-white font-mono"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Spacer for nav */}
      <div className="py-10" />

      {/* Sticky header */}
      <div className="sticky top-18 z-20 backdrop-blur bg-black/40 border-b border-white/10 font-mono">
        <div className="max-w-screen-xl mx-auto px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Action Economy</h1>
              <p className="text-sm text-gray-300">
                Per turn:
              </p>
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

          {/* Legend */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-orange-500/90 text-black rounded-lg py-2">
              Standard Action
            </div>
            <div className="bg-orange-400/90 text-black rounded-lg py-2">
              Bonus Action
            </div>
            <div className="bg-orange-800/90 rounded-lg py-2">Movement</div>
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

      <Footer />
    </div>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;

  return (
    <>
      <div className="relative flex items-center py-6 font-mono">
        <div className="flex-grow border-t border-white/20" />
        <span className="mx-4 text-gray-100">
          {title}
        </span>
        <div className="flex-grow border-t border-white/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
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
