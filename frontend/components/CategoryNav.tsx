import React, { useState } from "react";
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

  return (
    <>
      {/* ========================================== */}
      {/* 💻 STRUCTURA 100% ORIGINALĂ PENTRU DESKTOP */}
      {/* ========================================== */}
      <div className="hidden md:block mb-8">
        <div className="flex items-center justify-between mb-6 px-2">
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
                key={`desktop-${cat}`}
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

      {/* ========================================== */}
      {/* 📱 STRUCTURA FILTRU IN STÂNGA PENTRU MOBIL  */}
      {/* ========================================== */}
      <div className="block md:hidden sticky top-3 left-4 z-40 w-fit mb-4">
        <div className="relative">
          {/* Butonul minimalist tip Pill - Lipit pe ecran în stânga */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-stone-200 shadow-lg px-4 py-2.5 rounded-full outline-none transition-all active:scale-95"
          >
            <span className="text-base">
              {selectedCategory ? getCategoryIcon(selectedCategory) : "🧺"}
            </span>
            <span className="text-xs font-black uppercase tracking-tight text-stone-800">
              {selectedCategory || "Categorii"}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
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

          {/* Dropdown-ul fin care face expand direct sub buton */}
          {isDropdownOpen && (
            <>
              {/* Overlay invizibil pentru a închide dropdown-ul la click în exterior */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-stone-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-20 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Resetare filtru */}
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

                {/* Opțiunile de categorii */}
                {PRODUCT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={`mobile-drop-${cat}`}
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
