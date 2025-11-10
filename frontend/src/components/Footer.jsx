import { Link } from "react-router-dom";

import calamariLogo from "../assets/Images/Calamari_Logo.png";

const Footer = () => {
  return (
    <footer className="scroll-anchor-none bg-black text-white py-4" style={{ fontFamily: 'Geist_Mono' }}>
      <div className="max-w-screen mx-auto text-center">
        
        {/* Logo */}
        <img
          src={calamariLogo}
          alt="Calamari Logo"
          className="mx-auto mb-6"
          style={{ height: "200px" }}
        />

        {/* Subtitle */}
        <p className="text-[0.95rem] text-orange-400 mb-6">
          CALAMARI / 4.10.25 <br /> SECURE THE BAG
        </p>

        {/* Socials */}
        <div className="flex justify-center gap-6 mb-6">
          <a
            href="https://x.com/Spinypine2"
            className="hover:bg-orange-400 text-sm"
            style={{ color: "whitesmoke" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
          <a
            href="https://cara.app/spinypine"
            className="hover:bg-orange-400 text-sm"
            style={{ color: "whitesmoke" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cara
          </a>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 uppercase text-sm">
          <Link to="/" className="hover:underline">CALAMARI</Link>
          <Link to="/CALLICOM" className="hover:underline">CALLICOM</Link>
          <Link to="/about" className="hover:underline">About</Link>
        </div>

        {/* Legal Text */}
        <p className="text-xs text-gray-300 px-4 leading-relaxed">
          © 2025 SpinyNA Studios. All rights reserved. Dates and content subject to change. Game is not yet rated.
          <br />
          SpinyNA, the SpinyNA logo, Calamari, and the Calamari logo are among the trademarks of SpinyNA Studios.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
