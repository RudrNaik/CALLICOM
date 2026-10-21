import SidebarRules from "./SidebarNav";
import RuleCard from "./RuleCard";
import { useState, useEffect } from "react";
import rules from "../../data/rules.json";

const Rules = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex min-h-screen text-white">
      <SidebarRules
        rules={rules}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
      />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto scroll-smooth">
        {rules
          .filter(
            (rule) =>
              rule.title.toLowerCase().includes(searchTerm) ||
              rule.description.toLowerCase().includes(searchTerm),
          )
          .map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
      </main>
    </div>
  );
};

export default Rules;
