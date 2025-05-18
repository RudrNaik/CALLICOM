import React from "react";

const GearCard = ({ gear }) => {
  return (
    <section
      id={gear.id}
      className="scroll-mt-[130px] bg-neutral-800/80 border-l-8 border-orange-400 p-6 rounded shadow"
      style={{ fontFamily: "Geist_Mono" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">{gear.title}</h2>
        <span className="text-xs text-orange-400 font-semibold">
          [ ${gear.cost} | {gear.class} ]
        </span>
      </div>
      <p className="text-sm text-gray-200 whitespace-pre-line">
        {gear.rulesText}
      </p>
      <p className="text-xs text-gray-400 whitespace-pre-line">
        {gear.description}
      </p>
    </section>
  );
};

export default GearCard;
