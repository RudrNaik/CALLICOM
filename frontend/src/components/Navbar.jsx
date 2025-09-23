// src/components/Navbar.jsx
import { useContext, useEffect, useState, useRef } from "react";
import SpinyLogo from "../assets/Images/SpinyNAStudiosLogo_.png";
import { Link } from "react-router-dom";
import UserIcon from "../assets/Images/UserIcon.png";
import { AuthContext } from "../AuthContext";
import Pinger from "./CharacterRoster/Pinger";

const Navbar = ({}) => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // NEW
  const dropdownRef = useRef(null);
  const { isLoggedIn, logout, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle dropdown menu
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-200 text-white
        ${scrolled ? "bg-neutral-900 shadow-md" : "bg-transparent"}
      `}
    >
      <div
        className="flex items-center relative w-full"
        style={{ fontFamily: "Geist_Mono" }}
      >
        <img src={SpinyLogo} alt="Logo" className="h-20" />
        <div className="text-xl px-2">SpinyNA Studios</div>

        {/* Nav Links (desktop only — unchanged) */}
        <ul className="hidden md:flex space-x-6 pl-6">
          <li>
            <Link to="/" className="hover:bg-orange-400">
              [↳] Home
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:bg-orange-400">
              [↳] About
            </Link>
          </li>
          <li>
            <Link to="/CALLICOM" className="hover:bg-orange-400">
              [↳] CALLI/COM
            </Link>
          </li>
          <li>{isAdmin && <Pinger />}</li>
        </ul>

        {/* --- NEW: Mobile hamburger button (no desktop changes) --- */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400/70"
          aria-controls="mobile-nav"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          {/* icon swap */}
          <svg
            className={`${mobileOpen ? "hidden" : "block"} h-6 w-6`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <svg
            className={`${mobileOpen ? "block" : "hidden"} h-6 w-6`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* --- /NEW --- */}

        {/* Right Side Icon + Dropdown (unchanged) */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2"
          ref={dropdownRef}
        >
          <button
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-neutral-700 transition"
          >
            <img
              src={UserIcon}
              alt="profile"
              className="h-6 w-6 text-white cursor-pointer"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg py-2 z-50">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/CALLICOM/CharacterManager"
                    className="block px-4 py-2 hover:bg-orange-400"
                  >
                    Characters
                  </Link>
                  <Link to="/Login">
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 hover:bg-orange-400"
                    >
                      Log Out
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 hover:bg-orange-400"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 hover:bg-orange-400"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- NEW: Mobile links panel (only shows < md) --- */}
      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="px-3 pb-3 space-y-1 bg-neutral-900/95 border-t border-white/10">
          <li>
            <Link
              to="/"
              className="block px-3 py-2 rounded-md hover:bg-orange-400/90"
              onClick={() => setMobileOpen(false)}
            >
              [↳] Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md hover:bg-orange-400/90"
              onClick={() => setMobileOpen(false)}
            >
              [↳] About
            </Link>
          </li>
          <li>
            <Link
              to="/CALLICOM"
              className="block px-3 py-2 rounded-md hover:bg-orange-400/90"
              onClick={() => setMobileOpen(false)}
            >
              [↳] CALLI/COM
            </Link>
          </li>
          {isAdmin && (
            <li className="px-1">
              <div className="rounded-md px-2 py-2 bg-neutral-800/60">
                <Pinger />
              </div>
            </li>
          )}
        </ul>
      </div>
      {/* --- /NEW --- */}
    </nav>
  );
};

export default Navbar;
