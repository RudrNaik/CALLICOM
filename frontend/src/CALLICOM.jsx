import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import TerminalFeed from "./components/Terminal/TerminalFeed";
import background from "./assets/Images/4060492.jpg";
import { motion } from "framer-motion";


const something = [
"> REMEMBER, CYBER DEFENSE ENDS WITH YOU. DONT CLICK WEIRD LINKS.",
"> SHOOT FIRST, LET LEGAL HANDLE THE REST.",
"> CHECK YOUR CORNERS, EVEN BEHIND A DESK. CORPORATE ESPIONAGE ENDS WITH YOU.",
"> LETS GET THIS BREAD.",
"> TIME IS OF THE ESSENCE.",
"> WHEELS OF FATE TURN AS FAST AS YOU CAN SHOOT.",
"> ESCAPE WILL MAKE ME- [CALLI.OS ::/] Hallucination detected, resetting....",
"> THINK SMARTER, SHOOT FASTER.",
"> KEEP THE KILL CHAIN MOVING."
];

const randomNum = Math.floor(Math.random() * something.length)

const bootLines = [
  "CALLI.OS/COMMAND/CONTROL SYSTEM INITIALIZING",
  "GC Laboratories CALLI/COM 1.0.14",
  "1.0.14 Gold Coast Laboratories // Government or Contractor use ONLY",
  "MSMK.DIV (R) GC.LABS (R) 8.0 (Build 01014)",
  "Connecting to UNCC Contractor Datbases",
  ">USERNAME: [*******]",
  ">PASSWORD: [************]",
  "Credentials verified. Welcome back Contractor.",
  "",
  "  /$$$$$$   /$$$$$$  /$$       /$$       /$$$$$$  /$$$$$$   /$$$$$$  /$$      /$$",
  " /$$__  $$ /$$__  $$| $$      | $$      |_  $$_/ /$$__  $$ /$$__  $$| $$$    /$$$",
  "| $$  \\__/| $$  \\ $$| $$      | $$        | $$  | $$  \\__/| $$  \\ $$| $$$$  /$$$$",
  "| $$      | $$$$$$$$| $$      | $$        | $$  | $$      | $$  | $$| $$ $$/$$ $$",
  "| $$      | $$__  $$| $$      | $$        | $$  | $$      | $$  | $$| $$  $$$| $$",
  "| $$    $$| $$  | $$| $$      | $$        | $$  | $$    $$| $$  | $$| $$\\  $ | $$",
  "|  $$$$$$/| $$  | $$| $$$$$$$$| $$$$$$$$ /$$$$$$|  $$$$$$/|  $$$$$$/| $$ \\/  | $$",
  " \\______/ |__/  |__/|________/|________/|______/ \\______/  \\______/ |__/     |__/",
  "",
  "|-[COMBINED ARMS LARGE LANGUAGE INTERFACE - COMMAND]-|",
  "|         (Calamari Operational Support Group)       |",
  "|----------------------------------------------------|",
  "              [Anytime, Anywhere, Anyhow.]      ",
  "",
  something[randomNum],
  "",
  ">[CALLI.OS ::/] System Baked. Ready. Input command on next line, press Enter to submit.",
];

const TerminalPage = () => {
  const [logs, setLogs] = useState([]);
  const [isBooting, setIsBooting] = useState(true);
  const { isLoggedIn } = useContext(AuthContext);

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
    setLogs((prev) => [...prev, `>[CALLI.OS::/] ${description}`]);
  };

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="flex flex-col space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flicker"
          >
            <TerminalPanel
              title="Armory"
              subtitle="Equipment Database"
              icon="✱"
              onHover={handleHover}
              link={"/CALLICOM/Armory"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flicker"
          >
            <TerminalPanel
              title="Rulebook"
              subtitle="Operations Field Manual"
              icon="🗊"
              onHover={handleHover}
              link={"/CALLICOM/Rulebook"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flicker"
          >
            <TerminalPanel
              title="Archives"
              subtitle="Intelligence Records and Reports"
              icon="🖿"
              onHover={handleHover}
              link={"/CALLICOM/lore"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flicker"
          >
            <TerminalPanel
              title="Action Economy"
              subtitle="Per-turn Actions"
              icon="◈"
              onHover={handleHover}
              link={"/CALLICOM/ActionEcon"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: .5 }}
            className="flicker"
          >
            {isLoggedIn ? (
              <TerminalPanel
                title="Briefings"
                subtitle="CALLICOM Proprietary briefing software"
                icon="❖"
                onHover={handleHover}
                link={"/CALLICOM/campaigns"}
              />
            ) : (
              <TerminalPanel
                title="Briefings [Requires login]"
                subtitle="[WARNING: UNCC IDENT NOT FOUND]"
                icon="⚠"
                onHover={handleHover}
                link={"/login"}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: .6 }}
            className="flicker"
          >
            {isLoggedIn ? (
              <TerminalPanel
                title="Character Manager"
                subtitle="Employee Data"
                icon="♕"
                onHover={handleHover}
                link={"/CALLICOM/CharacterManager"}
              />
            ) : (
              <TerminalPanel
                title="Character Manager [Requires login]"
                subtitle="[WARNING: UNCC IDENT NOT FOUND]"
                icon="⚠"
                onHover={handleHover}
                link={"/login"}
              />
            )}
          </motion.div>
        </div>

        <div className="h-full">
          <TerminalFeed logs={logs}/>
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;
