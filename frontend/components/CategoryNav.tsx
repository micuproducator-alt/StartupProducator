import React from "react";
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
  return (
    <div className="mb-8">
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
              key={cat}
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
  );
};
