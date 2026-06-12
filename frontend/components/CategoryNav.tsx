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

  // Monitorizăm scroll-ul pentru a schimba starea barei
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    /* ⚡️ CONTAINĂRUL ULTRA-INTELIGENT STICKY
       - Când e sus: este un div normal în pagină
       - Când dai scroll: se lipește magnetic la top-0, adaugă un blur fin de fundal și reduce padding-ul
    */
    <div
      className={`sticky top-0 z-40 transition-all duration-300 w-full ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-stone-100 py-2 shadow-sm"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 transition-all">
        {/* ========================================================================= */}
        {/* STAREA A: UTILIZATORUL ESTE SUS (Afișăm titlul și layout-ul complet extins) */}
        {/* ========================================================================= */}
        {!isScrolled && (
          <div className="flex items-center justify-between mb-6 animate-in fade-in duration-200">
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
        )}

        {/* ========================================================================= */}
        {/* 🔄 METAMORFOZA RESPONSIVE (De la rând lung la Dropdown în stânga la Scroll) */}
        {/* ========================================================================= */}
        <div
          className={`flex ${isScrolled ? "justify-start" : "justify-start"} items-center w-full`}
        >
          {isScrolled ? (
            /* 🟢 MODUL LA SCROLL: Dropdown minimalist poziționat fix în STÂNGA barei */
            <div className="relative animate-in slide-in-from-left-4 fade-in duration-300">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-stone-900 text-white border border-stone-800 shadow-md px-4 py-2 rounded-full outline-none transition-all active:scale-95"
              >
                <span className="text-sm">
                  {selectedCategory ? getCategoryIcon(selectedCategory) : "🧺"}
                </span>
                <span className="text-xs font-black uppercase tracking-wider">
                  {selectedCategory || "Categorii"}
                </span>
                <svg
                  className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown-ul elegant atașat la pastila din stânga */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-stone-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-20 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        onSelectCategory("");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[11px] font-black uppercase tracking-tight transition-colors ${
                        !selectedCategory
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      <span>🧺</span> Toate Categoriile
                    </button>

                    {PRODUCT_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={`scroll-drop-${cat}`}
                          onClick={() => {
                            onSelectCategory(isSelected ? "" : cat);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[11px] font-black uppercase tracking-tight transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-stone-500 hover:bg-stone-50"
                          }`}
                        >
                          <span className="text-base">
                            {getCategoryIcon(cat)}
                          </span>
                          <span className="truncate text-stone-800">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 💻 MODUL ORIGINAL SUS: Caruselul tău complet cu iconițe mari */
            <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-hide snap-x w-full animate-in fade-in duration-200">
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={`normal-list-${cat}`}
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
          )}
        </div>
      </div>
    </div>
  );
};
