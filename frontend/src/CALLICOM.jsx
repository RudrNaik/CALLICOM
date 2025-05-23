import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import TerminalFeed from "./components/Terminal/TerminalFeed";
import background from "./assets/Images/4060492.jpg";
import Footer from "./components/Footer";

const bootLines = [
  "CALLI.OS/COMMAND/CONTROL SYSTEM INITIALIZING",
  "GC Laboratories CALLI/COM 1.0.14",
  "1.0.14 Gold Coast Laboratories // Please Operate Responsibly",
  "Mirrorsmoke (R) GCLABS (R) 8.0 (Build 01014)",
  "Connecting to Operator Datbases",
  ">USERNAME: JBerk_3345",
  ">PASSWORD: ************",
  "Credentials verified. Welcome back Johnathan Berkeley.",
  "",
  "    ▄██████░▄█████░▄█████▄░██████▄",
  "    ██░░░░░░██░░░░░██░░░██░██░░░██",
  "    ██░░███░██░░░░░██░░░██░██░░░██",
  "    ██░░░██░██░░░░░██░░░██░██░░░██",
  "    ▀█████▀░▀█████░▀█████▀░██░░░██",
  "    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
  "|-[Calamari Operational Support Group]-|",
  "|    (Operational Services Network)    |",
  "|--------------------------------------|",
  "      [Anytime, Anywhere, Anyhow.]      ",
  "",
  ">//[CALLI/COM: System Baked. Ready. Input command on next line, press Enter to submit]",
];

const TerminalPage = () => {
  const [logs, setLogs] = useState([]);
  const [isBooting, setIsBooting] = useState(true);
  const { isLoggedIn }  = useContext(AuthContext)

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setLogs((prev) => [...prev.slice(-30), bootLines[index]]);
      index++;

      if (index >= bootLines.length) {
        clearInterval(interval);
        setIsBooting(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleHover = (path, description) => {
    if (isBooting) return;
    setLogs((prev) => [...prev.slice(-28), `$ ${path}`]);
    setLogs((prev) => [...prev, `>//[CALLI:COM ${description}]`]);
  };

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="flex flex-col space-y-10">
          <TerminalPanel
            title="Armory"
            subtitle="Equipment Database"
            icon="📚"
            onHover={handleHover}
            link={"/CALLICOM/Armory"}
          />
          <TerminalPanel
            title="Rulebook"
            subtitle="Operations Field Manual"
            icon="👤"
            onHover={handleHover}
            link={"/CALLICOM/Rulebook"}
          />
          <TerminalPanel
            title="Action Economy"
            subtitle="Per-turn Actions"
            icon=<img
              src="/Full_Action.svg"
              className="w-10 h-10 justify-center "
            ></img>
            onHover={handleHover}
            link={"/CALLICOM/ActionEcon"}
          />
          {isLoggedIn ? (
            <TerminalPanel
              title="Character Manager"
              subtitle="Employee Data"
              icon="📦"
              onHover={handleHover}
              link={"/CALLICOM/CharacterManager"}
            />
          ) : (
            <TerminalPanel
              title="Character Manager [Requires login]"
              subtitle="[WARNING: UNCC IDENT NOT FOUND]"
              icon="⚠️"
              onHover={handleHover}
              link={"/CALLICOM"}
            />
          )}
        </div>

        <div className="h-full">
          <TerminalFeed logs={logs} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TerminalPage;
