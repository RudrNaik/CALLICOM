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
  const dropdownRef = useRef(null);
  const { isLoggedIn, logout, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = 10;

      setScrolled(window.scrollY > offset);
    };

    window.addEventListener("scroll", handleScroll);
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
        className="flex items-center relative"
        style={{ fontFamily: "Geist_Mono" }}
      >
        <img src={SpinyLogo} alt="Logo" className="h-20" />
        <div className="text-xl px-2">SpinyNA Studios</div>

        {/* Nav Links */}
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
          <li>{isAdmin && <Pinger></Pinger>}</li>
        </ul>

        {/* Right Side Icon + Dropdown */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2"
          ref={dropdownRef}
        >
          <button
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-neutral-700 transition"
          >
            <img src={UserIcon} alt="profile" className="h-6 w-6 text-white cursor-pointer" />
          </button>

          {/* Dropdown Menu */}
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
    </nav>
  );
};

export default Navbar;
