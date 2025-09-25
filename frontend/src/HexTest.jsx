import React from "react";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";
import AboutPortraits from "./components/AboutPortraits";
import HexagonBackground from "./components/HexagonBackground";
import worldmap from "./assets/Images/worldmap.jpg";

function hexes() {
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>
      <HexagonBackground
        gridOpacity={0.28}
        blendMode="soft-light"
        intensity={0.05}
        outline={0.1}
        className="absolute inset-0"
      ></HexagonBackground>
      <Footer />
    </div>
  );
}

export default hexes;
