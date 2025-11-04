import React from "react";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";
import AboutPortraits from "./components/AboutPortraits";
import Dither from "./components/Dither";

function testing() {
  return (
    <div style={{ width: "100%", height: "600px", position: "relative" }}>
      <Dither
        waveColor={[1, 0.3, 0.1]}
        disableAnimation={false}
        enableMouseInteraction={false}
        mouseRadius={0.3}
        colorNum={4}
        waveAmplitude={0.3}
        waveFrequency={3}
        waveSpeed={0.01}
      />
      <div className="relative z-10 grid h-full place-items-center text-center text-white drop-shadow">
        <div className=" font-[Geist_Mono] border-orange-600 border-l-4 pl-1 text-xl bg-neutral-900/90">
          <span className="text-4xl">404</span>
          <br></br>
          <span className="text-sm">[CALLI.OS ::/] ERROR 404: Failed to find module. Please utilize standard navigation.</span>
        </div>
      </div>
    </div>
  );
}

export default testing;
