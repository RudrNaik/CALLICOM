import React from "react";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";
import AboutPortraits from "./components/AboutPortraits";


function About() {
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>
      <AboutPortraits />
      <Footer />
    </div>
  );
}

export default About;
