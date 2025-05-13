import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";
import Equipment from "./components/Rulebook/Equipment";

const Armory = () => {
  return (
    <div
      className="font-[Geist_Mono] bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen text-white justify-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="py-10"> </div>
      <Equipment />

      <Footer />
    </div>
  );
};

export default Armory;
