import React from "react";
import Dither from "./components/Dither";
import background from "./assets/Images/4060492.jpg";
import "./assets/css/cabber.css";

function Testing() {
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-50"></div>
      <div className="z-10 grid h-full place-items-center text-center text-white drop-shadow">
        <div className="font-[Geist_Mono] border-orange-600 border-l-4 pl-1 text-xl bg-neutral-900/90">
          <span className="text-4xl">404</span>
          <br />
          <span className="text-sm">
            [CALLI.OS ::/]{" "}
            <span
              className="glitch--subtle"
              style={{ animation: "distort-subtle 7s ease infinite" }}
            >
              ERROR
            </span>
            : Failed to find module. Please utilize standard navigation.
          </span>
        </div>
      </div>
    </div>
  );
}

export default Testing;
