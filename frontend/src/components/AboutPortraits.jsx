import React from "react";
import profiles from "../data/About_Profiles"

const AboutPortraits = () => {
    return (
      <div>
        <section className="py-20 px-6 text-white font-mono max-w-screen-lg mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
        Meet the creators
      </h2>

      <div className="grid grid-cols-2 gap-10">
        {profiles.map((dev, index) => (
          <div
            key={index}
            className="bg-neutral-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center"
          >
            {dev.image ? (
              <img
                src={dev.image}
                alt={dev.alt}
                className="w-32 h-32 object-cover rounded-full mb-4 border-2 border-orange-400"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-600 rounded-full mb-4 flex items-center justify-center text-sm text-gray-300">
                No Image
              </div>
            )}
            <h3 className="text-xl font-semibold mb-1">{dev.name}</h3>
            <p className="text-orange-400 mb-2">{dev.title}</p>
            <p className="text-sm">{dev.bio}</p>
          </div>
        ))}
      </div>
    </section>

      </div>
    );
  };
  
  export default AboutPortraits;