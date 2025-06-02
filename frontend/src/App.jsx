// App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./About";
import TerminalPage from "./CALLICOM";
import ActionEconomyPage from "./ActionEconomy";
import Rulebook from "./Rulebook";
import Armory from "./Armory";
import CharManager from "./CharacterManager";
import CharacterCreator from "./CharacterCreator";
import Login from "./Login";
import Home from "./Home";
import Campaigns from "./Campaign";
import SignUp from "./SignUp";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./AuthContext";
import "./App.css"


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/CALLICOM" element={<TerminalPage />} />
          <Route path="/CALLICOM/ActionEcon" element={<ActionEconomyPage />} />
          <Route path="/CALLICOM/Rulebook" element={<Rulebook />} />
          <Route path="/CALLICOM/Armory" element={<Armory />} />
          <Route path="/CALLICOM/CharacterManager" element={<CharManager />} />
          <Route path="/CALLICOM/Campaigns" element={<Campaigns />} />
          <Route
            path="/CALLICOM/CharacterCreator"
            element={<CharacterCreator />}
          />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
}
