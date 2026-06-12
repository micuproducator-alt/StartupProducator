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
  // State pentru a controla dacă grid-ul este extins pe mobil
  const [isExpanded, setIsExpanded] = useState(false);

  // Pe mobil afișăm doar primele 3 categorii dacă meniul nu este extins
  const visibleCategories = isExpanded
    ? PRODUCT_CATEGORIES
    : PRODUCT_CATEGORIES.slice(0, 3);

  return (
    <div className="mb-8 px-2 transition-all duration-300">
      {/* HEADER: TITLU + ȘTERGE FILTRU */}
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

      {/* ⚡️ GRID EXTENSIBIL & RESPONSIVE */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-x-3 gap-y-5 md:gap-5">
        {/* Mapăm categoriile vizibile (3 sau toate pe mobil, obligatoriu TOATE pe desktop) */}
        {(typeof window !== "undefined" && window.innerWidth >= 768
          ? PRODUCT_CATEGORIES
          : visibleCategories
        ).map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(isSelected ? "" : cat)}
              className="flex flex-col items-center group outline-none w-full"
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
                className={`mt-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-tighter text-center w-full leading-tight transition-colors truncate px-1 ${
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

        {/* ⚡️ BUTONUL DE TOGGLE (Apare doar pe mobil și se transformă din Plus în Minus) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex flex-col items-center group outline-none w-full"
        >
          <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl shadow-sm border-2 border-dashed border-stone-200 bg-stone-50/50 text-stone-500 group-hover:border-emerald-500 group-hover:text-emerald-600 transition-all">
            {isExpanded ? "✕" : "＋"}
          </div>
          <span className="mt-2.5 text-[10px] font-black uppercase tracking-tighter text-center text-stone-400 group-hover:text-stone-900">
            {isExpanded ? "Mai puțin" : "Toate"}
          </span>
        </button>
      </div>
    </div>
  );
};
