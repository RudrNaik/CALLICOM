import RuleCard from "./MiniRuleCard";
import { useState, useDeferredValue, useMemo } from "react";
import rules from "../../data/glossary.json";

const Rules = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredTerm = useDeferredValue(searchTerm);

  const filtered = useMemo(() => {
    const q = deferredTerm.toLowerCase();
    if (!q) return rules;
    return rules.filter((rule) => rule.searchText.includes(q));
  }, [deferredTerm]);

  return (
    <div className="relative min-h-full">
      <div className="sticky top-0 z-10 bg-black/90 border-b border-white/10 font-mono">
        <div className="max-w-screen-xl mx-auto px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold">Glossary and Definitions</h1>
            </div>

            <div className="flex items-center gap-2 font-mono">
              {/* Search */}
              <div className="flex-1 md:w-72 text-xs">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, type, tag…"
                  className="w-full bg-neutral-900 text-white border border-orange-400/70 rounded-lg px-3 py-2 outline-none focus:border-orange-400 font-mono"
                />
              </div>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <main className="flex-1 px-4 py-4 space-y-6 overflow-y-auto scroll-smooth">
          {filtered.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </main>
      </div>
    </div>
  );
};

export default Rules;
