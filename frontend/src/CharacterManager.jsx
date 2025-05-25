import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import CharacterRoster from "./components/CharacterRoster/CharacterRoster";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

const CharManager = () => {
  const { isLoggedIn, user } = useContext(AuthContext);
  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"></div>
      <div
        className="grid grid-cols-1 gap-6 p-6"
        style={{ fontFamily: "Geist_Mono" }}
      >
        <div className="flex flex-col space-y-10">
          <TerminalPanel
            title="Character Creator"
            subtitle="Hiring Portal"
            link={"/CALLICOM/CharacterCreator"}
          />
        </div>
      </div>
      {isLoggedIn && (
        <div
          className="text-center text-orange-400"
          style={{ fontFamily: "Geist_Mono" }}
        >
          Logged in as: {user.userName}
        </div>
      )}

      <CharacterRoster userId={user.userName} />

      <Footer />
    </div>
  );
};

export default CharManager;
