import React, { useState, useEffect } from "react";
import { PRODUCT_CATEGORIES } from "../types";

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Legume":
      return "🥦";
    case "Fructe":
      return "🍎";
    case "Miere & Apicole":
      return "🍯";
    case "Lactate & Brânzeturi":
      return "🧀";
    case "Carne & Mezeluri":
      return "🥩";
    case "Ouă":
      return "🥚";
    case "Torturi & Prăjituri":
      return "🍰";
    case "Dulceață & Zacuști":
      return "🥫";
    case "Băuturi & Siropuri":
      return "🍷";
    case "Făinoase & Patiserie":
      return "🥖";
    case "Artizanat & Lucru Manual":
      return "🧶";
    case "Flori & Plante":
      return "🌻";
    default:
      return "🧺";
  }
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY > 180) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
        setIsDropdownOpen(false);
      }

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Dispariție fluidă înainte de footer
      if (documentHeight - (scrollY + windowHeight) < 400) {
        setIsNearFooter(true);
        setIsDropdownOpen(false);
      } else {
        setIsNearFooter(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ========================================================= */}
      {/* 🟢 1. BARA DE CATEGORII NORMALĂ (Când ești sus de tot)     */}
      {/* ========================================================= */}
      <div className="mb-8 px-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
            Explorați Categorii
          </h2>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory("")}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full transition-colors"
            >
              Șterge Filtru
            </button>
          )}
        </div>

        <div className="flex space-x-5 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={`normal-${cat}`}
                onClick={() => onSelectCategory(isSelected ? "" : cat)}
                className="flex-shrink-0 flex flex-col items-center group snap-start outline-none"
              >
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm border-2 transition-all duration-300 transform ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 scale-105 rotate-3"
                      : "bg-white border-stone-100 text-gray-700 hover:border-emerald-200 hover:shadow-md"
                  }`}
                >
                  {getCategoryIcon(cat)}
                </div>
                <span
                  className={`mt-3 text-[11px] font-black uppercase tracking-tighter text-center w-24 leading-tight transition-colors ${
                    isSelected
                      ? "text-emerald-600"
                      : "text-stone-400 group-hover:text-stone-900"
                  }`}
                >
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ⚡️ 2. ICONIȚĂ DECENTĂ ȘI ULTRA-MINIMALISTĂ LA SCROLL (LUPĂ / EMORJI)     */}
      {/* ===================================================================== */}
      <div
        className={`fixed top-1/3 left-0 z-50 transition-all duration-300 ${
          isScrolled && !isNearFooter
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-12 pointer-events-none"
        }`}
      >
        <div className="relative flex items-center">
          {/* Micro-butonul lipit pe margine - Stil capsulă semi-rotundă */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center bg-stone-950/95 backdrop-blur-md text-white shadow-xl h-12 w-11 rounded-r-xl border-y border-r border-stone-800 outline-none transition-all active:scale-90 hover:bg-stone-900"
          >
            {/* Afișează iconița categoriei active, iar dacă nu e nimic selectat, pune o lupă fină */}
            <span className="text-xl transition-transform duration-200 hover:scale-110">
              {selectedCategory ? getCategoryIcon(selectedCategory) : "🔍"}
            </span>
          </button>

          {/* Dropdown-ul care pleacă elegant direct din micro-buton */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute left-full top-0 ml-2 w-60 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl shadow-2xl max-h-[50vh] overflow-y-auto z-20 p-2 space-y-1 animate-in fade-in slide-in-from-left-3 duration-200">
                <div className="px-2 py-1 border-b border-stone-100 mb-1 flex justify-between items-center">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    Filtrează după:
                  </span>
                  {selectedCategory && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>

                {/* Opțiunea reset: Toate produsele */}
                <button
                  onClick={() => {
                    onSelectCategory("");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold uppercase tracking-tight transition-colors ${
                    !selectedCategory
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-base">🧺</span>
                  <span>Toate Categoriile</span>
                </button>

                {/* Generarea listei de categorii */}
                {PRODUCT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={`scroll-sidebar-${cat}`}
                      onClick={() => {
                        onSelectCategory(isSelected ? "" : cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold uppercase tracking-tight transition-colors ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <span className="text-base">{getCategoryIcon(cat)}</span>
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
