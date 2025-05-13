import React from "react";
import "../assets/css/Geist.css";

const Sidebar = () => {
  return (
    <div className="top-0 left-0 h-[700px] w-20 bg-orange-400 z-49 flex flex-col items-center justify-end">
      
      {/* Vertical */}
      <div className="flex flex-col items-center text-black text-[1.0rem] font-[Geist_mono] space-y-1 leading-tight py-20 rotate-270">
        <p>[*][=][↓][↓][↓]</p>
        <p>[↗]RESEARCH/DEVELOPMENT</p>
      </div>
      {/* Horizontal */}
      <div className="flex flex-col items-center text-black text-[0.80rem] font-[Geist_mono] text-center leading-tight py-5">
        <p>CHILE-JAPAN</p>
        <p>2018-2022</p>
        <p>0x7E9</p>
      </div>
    </div>
  );
};

export default Sidebar;
