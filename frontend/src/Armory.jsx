import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import Equipment from "./components/Rulebook/Equipment";

const Armory = () => {
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-full min-h-screen text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>
      <Equipment />
    </div>
  );
};

export default Armory;
