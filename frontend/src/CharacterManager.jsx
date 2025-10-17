import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import CharacterRoster from "./components/CharacterRoster/CharacterRoster";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { motion } from "framer-motion";

const CharManager = () => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !user?.userName) {
      navigate("/login");
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || !user?.userName) {
    return null;
  }

  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white justify-center "
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>
      <div
        className="p-6"
        style={{ fontFamily: "Geist_Mono" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flicker"
        >
          <div className="flex flex-col space-y-10">
            <TerminalPanel
              title="Character Creator"
              subtitle="Hiring Portal"
              link={"/CALLICOM/CharacterCreator"}
            />
          </div>
        </motion.div>
      </div>

      <div
        className="text-center text-orange-400"
        style={{ fontFamily: "Geist_Mono" }}
      >
        Logged in as: {user.userName}
      </div>

      <CharacterRoster userId={user.userName} />

      <Footer />
    </div>
  );
};

export default CharManager;
