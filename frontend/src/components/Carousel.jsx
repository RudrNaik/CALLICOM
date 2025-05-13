import { useState } from "react";
import carouselData from "../data/Calamari_Carousel.json";

const Carousel = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % carouselData.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  return (
    <div className="relative w-full h-[700px] overflow-hidden m-0 p-0">
  <div
    className="flex w-full h-full transition-transform duration-700 ease-in-out"
    style={{ transform: `translateX(-${current * 100}%)` }}
  >
    {carouselData.map((slide, index) => (
      <div key={index} className="w-full h-[700px] relative flex-shrink-0">
        <img
          src={slide.image}
          alt={slide.alt}
          className="w-full h-full object-cover object-[center_50%]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 text-center px-4">
          <h1 className="text-4xl font-bold drop-shadow-lg">{slide.title}</h1>
          <p className="text-lg mt-4 max-w-xl drop-shadow-md">{slide.subtitle}</p>
        </div>
      </div>
    ))}
  </div>

  {/* Navigation Buttons */}
  <button onClick={prevSlide} className="absolute top-1/2 left-6 -translate-y-1/2 z-10 text-white hover:bg-orange-500 p-1 rounded-sm">[←]</button>
  <button onClick={nextSlide} className="absolute top-1/2 right-8 -translate-y-1/2 z-10 text-white hover:bg-orange-500 p-1 rounded-sm">[→]</button>
</div>
  );
};

export default Carousel;