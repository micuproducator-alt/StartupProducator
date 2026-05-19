import React, { useState, useEffect } from "react";
import { Button } from "./Button";

export interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

interface CarouselProps {
  slides: Slide[];
  autoPlayInterval?: number;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  autoPlayInterval = 6000,
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goTo = (index: number) => setCurrent(index);
  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] md:h-[450px] bg-gray-900 rounded-2xl overflow-hidden shadow-xl mb-10 group">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-black">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover opacity-60"
            />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-16 bg-gradient-to-r from-black/80 via-black/40 to-transparent text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-2xl leading-tight tracking-tight drop-shadow-sm">
              {slide.title}
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-xl text-gray-100 drop-shadow-sm">
              {slide.description}
            </p>
            {slide.ctaText && (
              <Button
                variant="primary"
                onClick={slide.onCtaClick}
                className="text-lg px-8 py-3 bg-indigo-600 hover:bg-indigo-500 border-none shadow-lg transform transition hover:-translate-y-0.5"
              >
                {slide.ctaText}
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
