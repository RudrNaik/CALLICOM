import React from "react";
import background from "./assets/Images/4060492.jpg";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Carousel from "./components/Carousel";
import Footer from "./components/Footer";
import { Link } from "react-router-dom";

function Calamari() {
  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen"
      style={{ backgroundImage: `url(${background})` }}
    >
      <section className="flex w-screen h-[700px]">
        <Sidebar />
        <Carousel /> 
      </section>

      {/* News and Media Links */}
      <section>
        <section className="w-full min-h-[200px] bg-transparent text-white grid grid-cols-1 md:grid-cols-2">
          {/* Left */}
          <div className="p-10 flex flex-col justify-center gap-6">
            <p className="text-xs font-mono tracking-widest text-orange-400">
              NEWS
            </p>
            <h1 className="text-6xl font-extrabold">LATEST UPDATES</h1>
            <p className="text-lg text-gray-300">
              Stay connected with the latest news, including upcoming releases,
              developer updates, and playtest information.
            </p>
            <button className="w-fit bg-black text-white px-6 py-3 uppercase font-mono text-sm tracking-widest hover:bg-orange-400 hover:text-black transition">
              See All News ↗
            </button>
          </div>

          {/* Right */}
          <div className="bg-orange-400 grid grid-cols-2 grid-rows-[auto_1fr] text-xl font-mono p-6 gap-4">
            {/* Social Icons Column */}
            <div className="flex flex-col">
              <a href="https://media.discordapp.net/attachments/1002301423935033494/1192709670360592485/attachment-1-1-1.gif?ex=68238930&is=682237b0&hm=fe992efe1190b2741852b7169af0e4f7338d2d666f433d7a5c6fe1b01a9cca00&">
                <button className="text-black hover:text-orange-400 hover:bg-black px-2 py-1 text-left w-full transition-colors">
                  [🎮] Discord
                </button>
              </a>
              <a href="https://bsky.app/profile/spinypine2.bsky.social">
                <button className="text-black hover:text-orange-400 hover:bg-black px-2 py-1 text-left w-full transition-colors">
                  [✉️] Bluesky
                </button>
              </a>
              <a href="https://x.com/Spinypine2">
                <button className="text-black hover:text-orange-400 hover:bg-black px-2 py-1 text-left w-full transition-colors">
                  [❌] X
                </button>
              </a>
              <a href="https://steamcommunity.com/id/spinypine/">
                <button className="text-black hover:text-orange-400 hover:bg-black px-2 py-1 text-left w-full transition-colors">
                  [🕹️] Steam
                </button>
              </a>
            </div>

            {/* Description */}
            <div className="bg-black text-orange-400 p-4 flex flex-col justify-between">
              <div>
                <div className="text-sm uppercase font-bold mb-2">STEAM</div>
                <p className="leading-snug tracking-wide text-xs">
                  COMING TO STEAM, PLAYSTATION 5, AND XBOX SERIES X/S WITH FULL
                  CROSS PLAY AND CROSS SAVE ON SEPTEMBER 23, 2025. WISHLIST NOW
                  AND STAY UP TO DATE WITH THE LATEST DETAILS.
                </p>
              </div>

              <button className="mt-4 border border-orange-400 px-4 py-2 uppercase text-xs font-bold hover:bg-orange-400 hover:text-black transition">
                Wishlist Now ↗
              </button>
            </div>
          </div>
        </section>
      </section>

      {/* Creator titles */}
      <section className="w-full bg-transparent text-white px-6 py-16">
        <div className="max-w-screen-xl mx-auto">
          <p className="text-sm font-mono tracking-widest uppercase mb-6">
            A TACTICAL TEAM BASED RPG
          </p>

          <h1 className="text-6xl font-extrabold leading-none tracking-tight uppercase">
            From the
            <br />
            Creators of
            <br />
            <span className="text-yellow-400">Rainbow Six: Firewall</span>
            <br />
            and
            <br />
            <span className="text-red-600">Black Lotus</span>
          </h1>
        </div>
      </section>

      {/* Lore Hook */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[300px] w-full bg-gray-200 text-black">
        {/* LEFT*/}
        <div className="flex flex-col justify-center gap-10 p-10 max-w-3xl mx-auto">
          {/* Intro Hook */}
          <p className="font-mono text-md leading-relaxed tracking-wide uppercase">
            YOU ARE A CONTRACTOR, A REGISTERED FIGHTER WORKING FOR YOUR COMPANY
            OF CHOICE. OR A MERCENARY, TAKING JOBS FOR THE HIGHEST BIDDER NO
            MATTER THE DANGER OR MORALS
            <br />
            <br />
            SURVIVE, AND REAP THE REWARDS OF BECOMING OLD IN A YOUNG MAN'S GAME.
            DIE? AND BE FORGOTTEN LIKE THE THOUSANDS OF OTHERS TRYING TO GET
            RICH QUICK OR PAY OFF A DEBT.
          </p>

          {/* THE WORLD */}
          <div className="bg-black text-white p-6">
            <p className="text-xs font-mono text-orange-400 uppercase mb-2">
              The World
            </p>
            <h2 className="text-4xl font-black uppercase">The Crash</h2>
            <p className="mt-4 text-gray-300 leading-relaxed text-sm">
              ”By the turn of the 21st century, the world was moving towards a
              bright future. Quantum computing in the 2010s created faster
              computers worldwide. Medical nanites in 2013 sped up recovery
              rates and cured diseases previously incurable. And PMCs became
              legitimate businesses under the UN to establish security and peace
              worldwide. It should have been a golden age, a time of rapid human
              technological development."
              <br />
              <br />
              ”However, in 2016 everything would fall apart. The largest solar
              flare in recorded history hit the earth. Satellites, Internet,
              GPS, everything connecting the world was flung into the abyss of
              space or fried, starting what was dubbed on remnants of social
              media as ‘The Crash’. Within the first week alone, the death toll
              spiraled into the hundreds of thousands from just the loss of
              vital infrastructure such as hospitals, emergency services, food,
              and water. Within the first month, dozens of countries dissolved
              into failed states. In the first year, civil unrest due to lack of
              supply wracked whatever countries still stood. By the end of the
              year, soldiers and contractors left behind in hot-zones turned
              into warlords and mercenaries for their own survival. Taking
              contracts and jobs from underground fixers in exchange for basic
              necessities.
              <br />
              <br />
              ”Two years later, whatever global hegemons had existed were
              shattered. In it’s wake, a rising China expanded into southeast
              Asia, and a waning NATO struggled to get on its feet. One by one,
              from Mongolia, to Taiwan, to Pakistan, they fell into Chinese
              orbit accepting aid to rebuild in the absence of the US. Chinese
              vessels sit in the ports of Cambodia and Singapore, while warships
              poise themselves to strike deeper south off the coast of Australia
              and New Zealand.”
            </p>

            <p className="mt-4 text-orange-400 leading-relaxed text-sm">
              "The world holds it's breath, and waits."
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full h-[1000px] ml-auto">
          <img
            src="/Japan_Splash.png"
            alt="Calamari Environment"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      <section>
        <section className="w-full min-h-[200px] bg-transparent text-white grid grid-cols-1 md:grid-cols-2">
          {/* Left Side */}
          <div className="p-10 flex flex-col justify-center gap-6">
            <p className="text-xs font-mono tracking-widest text-orange-400">
              MAN 200 METERS NORTH
            </p>
            <h1 className="text-6xl font-extrabold">THE GAMEPLAY</h1>
            <p className="text-lg text-gray-100">
              Developed with inspiration from the likes of Battlefield, Modern
              Warfare, Rainbow Six, and Ghost Recon, Calamari strips down the
              cumbersome mechanics of other tabletops into simple add [x] and
              subtract [y], with a heavy emphasis on stacking the odds in your
              favor before you execute. Every roll is lethal, thresholds are
              low, and oftentime, one roll can mean the difference of life and
              death.
            </p>
            <p className="text-lg text-gray-100">
              Character creation is even easier, as our companion
              auto-calculates information based off of your input, and with
              classes coming with pre-determined skillsets it's just a matter of
              distributing a few extra points, choosing your gear and gadgets,
              and jumping into a session.
            </p>
            <a href="https://docs.google.com/document/d/1CzHhGABZYwjduxuukAZZ-BtgGbUaNpohkvClDNkapcM/edit?usp=sharing">
              <button className="w-fit bg-black text-white px-6 py-3 uppercase font-mono text-sm tracking-widest hover:bg-orange-400 hover:text-black transition">
                Check out the rulebook ↗
              </button>
            </a>
          </div>

          <div className="h-fit ml-auto">
            <img
              src="/Goose_Photo_Card.png"
              className="w-full h-full object-cover"
            ></img>
          </div>
        </section>
      </section>

      <section>
        <section className="w-full min-h-[200px] bg-transparent text-white grid grid-cols-1 md:grid-cols-2">
          <div className="h-fit ml-auto">
            <img src="/guns.png" className="w-full h-full object-cover"></img>
          </div>

          {/* Right Side */}
          <div className="p-10 flex flex-col justify-center gap-6">
            <p className="text-xs font-mono tracking-widest text-orange-400">
              GUNS GUNS GUNS
            </p>
            <h1 className="text-6xl font-extrabold">WEAPONS AND EQUIPMENT</h1>
            <p className="text-lg text-gray-100">
              Similar to DnD, but different, Players get to choose specific
              equipment and weapons as their items and gear. From high powered
              railguns to advanced combat drones, each class brings something to
              the table with the set of gear and equipment assigned to each.
            </p>

            <p className="text-lg text-gray-100">
              All classes have specific subclasses and then gameplay subsets
              within them. Such as Assault consisting of the Raider and Rifleman
              subclasses, or Engineer with specializing into Combat engineering
              and Anti-tank or Technical engineering with drone warfare.
            </p>

            <p className="text-lg text-gray-100">
              And with earning skill points and currency consistently, you're
              never stagnating and stuck with a certain set of equipment unless
              the DM decides so. Not to mention modding and homebrew support for
              custom gadgets and ideas.
            </p>

            <Link to="/CALLICOM/Armory">
              <button className="w-fit bg-black text-white px-6 py-3 uppercase font-mono text-sm tracking-widest hover:bg-orange-400 hover:text-black transition">
                See The Armory ↗
              </button>
            </Link>
          </div>
        </section>
      </section>

      <Footer />
    </div>
  );
}

export default Calamari;
