import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import RulebookView from "./components/Compendium/RulebookView";

const Rulebook = () => {
  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-full text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>

      <RulebookView />

    </div>
  );
};

export default Rulebook;
