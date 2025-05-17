import SidebarRules from "./SidebarNav";
import RuleCard from "./ruleCard";
import { useState, useEffect } from "react";
import rules from "../../data/rules.json";

const Rules = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex min-h-screen text-white font-[Geist_Mono]">
      <SidebarRules rules={rules} />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto scroll-smooth">
        <input
          type="text"
          placeholder="Search rules..."
          className="w-full sm:w-96 p-2 mb-6 rounded bg-neutral-800 text-white border border-orange-400 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />

        {rules
          .filter(
            (rule) =>
              rule.title.toLowerCase().includes(searchTerm) ||
              rule.description.toLowerCase().includes(searchTerm)
          )
          .map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
      </main>
    </div>
  );
};

export default Rules;
