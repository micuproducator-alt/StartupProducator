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
  // Control pentru dropdown-ul fin de pe mobil
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    /* ⚡️ FIXATĂ LA SCROLL: Se prinde automat sub bara ta de navigare principală */
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 py-3 px-4 mb-6 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* TITLU DISCRET / STATUT (Ascuns pe ecrane foarte mici pentru a economisi spațiu) */}
        <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider text-stone-400">
          Filtrare:
        </span>

        {/* 📱 1. DESIGN PENTRU MOBIL: UN DROPDOWN ULTRA-FIN ȘI COMPACT */}
        <div className="relative block md:hidden w-full sm:w-64">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-stone-50 border border-stone-200 hover:border-stone-300 px-4 py-2.5 rounded-xl text-left outline-none transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">
                {selectedCategory ? getCategoryIcon(selectedCategory) : "🧺"}
              </span>
              <span className="text-xs font-bold uppercase tracking-tight text-stone-800">
                {selectedCategory || "Toate Categoriile"}
              </span>
            </div>
            {/* Săgeată discretă de dropdown */}
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
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

          {/* MENIUL CONTEXTUAL DIN DROPDOWN (Apare elegant sub buton) */}
          {isDropdownOpen && (
            <>
              {/* Click-away overlay invizibil ca să se închidă la click în exterior */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Opțiunea implicită: Resetează filtrul */}
                <button
                  onClick={() => {
                    onSelectCategory("");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-bold uppercase tracking-tight transition-colors ${
                    !selectedCategory
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  <span>🧺</span> Toate Categoriile
                </button>

                {/* Toate celelalte categorii din listă */}
                {PRODUCT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={`drop-${cat}`}
                      onClick={() => {
                        onSelectCategory(isSelected ? "" : cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-bold uppercase tracking-tight transition-colors ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      <span className="text-sm">{getCategoryIcon(cat)}</span>
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 💻 2. DESIGN PENTRU DESKTOP: BARA DE "PILLS" MINIMALISTĂ (Se vede doar de la md: în sus) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 flex-grow">
          {/* Pastila pentru Toate Categoriile */}
          <button
            onClick={() => onSelectCategory("")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-tight transition-all ${
              !selectedCategory
                ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                : "bg-white border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-900"
            }`}
          >
            <span>🧺</span> Toate
          </button>

          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={`pill-${cat}`}
                onClick={() => onSelectCategory(isSelected ? "" : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-tight transition-all ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-900"
                }`}
              >
                <span className="text-xs">{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* SECȚIUNE DISCRETĂ DE RESET FILTRU RAPID (Apare doar pe Desktop când e ceva selectat) */}
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory("")}
            className="hidden md:block text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex-shrink-0"
          >
            Șterge [x]
          </button>
        )}
      </div>
    </div>
  );
};
