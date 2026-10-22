import React from "react";

import RiflemanIcon from "../../assets/classIcons/Rifleman.png";
import RaiderIcon from "../../assets/classIcons/Raider.png";
import CombatEngineerIcon from "../../assets/classIcons/Combat_Engineer.png";
import TechnicalEngineerIcon from "../../assets/classIcons/Technical_Engineer.png";
import SupportIcon from "../../assets/classIcons/Support.png";
import MedicIcon from "../../assets/classIcons/Medic.png";
import SharpshooterIcon from "../../assets/classIcons/Sharpshooter.png";
import TrapperIcon from "../../assets/classIcons/Trapper.png";

const classIcons = {
  Rifleman: RiflemanIcon,
  Raider: RaiderIcon,
  "Combat Engineer": CombatEngineerIcon,
  "Technical Engineer": TechnicalEngineerIcon,
  "Fire Support": SupportIcon,
  Medic: MedicIcon,
  Sharpshooter: SharpshooterIcon,
  Trapper: TrapperIcon,
};

const GearCard = ({ gear }) => {
  return (
    <div
      id={gear.id}
      className="relative bg-gradient-to-t from-neutral-800 to-neutral-850 border-l-6 border-orange-500 p-4 rounded-xs shadow overflow-hidden min-h-40"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <div className="relative flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">{gear.title}</h2>
        <span className="text-xs text-orange-400 font-semibold">
          [ ${gear.cost} | {gear.class} ]
        </span>
      </div>
      {gear.class in classIcons && (
        <img
          src={classIcons[gear.class]}
          className="absolute right-5 top-1 z-0 size-40 opacity-15 object-contain pointer-events-none"
        />
      )}
      <div className="text-sm">
        <p className=" relative text-gray-200 whitespace-pre-line">
          {gear.rulesText}
        </p>
        <p className="relative text-gray-400 whitespace-pre-line italic mt-2">
          {gear.description}
        </p>

        {gear?.families && (
          <p className="relative whitespace-pre-line mt-2 mb-1">
            Sub Classes:{" "}
          </p>
        )}

        {gear?.families?.map((family) => (
          <div key={family.id} className="relative">
            <div className="text-orange-400">
              {family.family} // + ${family.cost}
            </div>
            <div className=" italic text-gray-400 whitespace-pre-line">
              {family.effect}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GearCard;
