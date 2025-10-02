import GearCard from "./EquipmentCard";
import SidebarRules from "./SidebarNav";
import { useState, useEffect } from "react";
import equipment from "../../data/Equipment.json"


const Equipment = () => {

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex min-h-screen text-white top-20" style = {{ fontFamily: 'Geist_Mono' }}>
      <SidebarRules rules={equipment} />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto scroll-smooth">
        <input
          type="text"
          placeholder="Search equipment..."
          className="sm:w-96 p-2 mb-6 rounded bg-neutral-800 text-white border border-orange-400 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />

        {equipment
          .filter(
            (gear) =>
              gear.title.toLowerCase().includes(searchTerm) || gear.class.toLowerCase().includes(searchTerm)
          )
          .map((gear) => (
            <GearCard key={gear.id} gear={gear} />
          ))}
      </main>
    </div>
  );
};

export default Equipment;
