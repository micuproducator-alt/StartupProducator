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
  // State pentru a deschide Bottom Sheet-ul pe mobil
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  return (
    <div className="mb-8 relative">
      {/* HEADER FILTRE */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
          Explorați Categorii
        </h2>
        <div className="flex items-center gap-3">
          {/* Butonul de "Toate" vizibil DOAR PE MOBIL pentru a deschide meniul glisant */}
          <button
            onClick={() => setIsBottomSheetOpen(true)}
            className="md:hidden text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest transition-colors"
          >
            Toate 🌟
          </button>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory("")}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full transition-colors"
            >
              Șterge Filtru
            </button>
          )}
        </div>
      </div>

      {/* CONTAINER CONTAINER DUAL: CARUSEL PE MOBIL / GRID COMOD PE DESKTOP */}
      <div className="relative w-full">
        {/* ⚡️ EFECTUL DE GRADIENT FADE: Apare doar pe mobil în partea dreaptă ca să sugereze swipe-ul */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 md:hidden" />

        {/* Aici se întâmplă magia responsive:
          - Pe mobil: flex-row, overflow-x-auto, scrollbar ascuns, snap-x (Carusel)
          - Pe desktop (md:): grid, grid-cols-6 sau grid-cols-12, overflow-hidden (Fără scroll!)
        */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-5 overflow-x-auto md:overflow-visible pb-4 scrollbar-hide snap-x w-full">
          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(isSelected ? "" : cat)}
                className="flex-shrink-0 md:flex-shrink flex flex-col items-center group snap-start outline-none w-24 md:w-auto"
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

      {/* ⚡️ INTERFAȚA PREMIUM DE TIP BOTTOM SHEET PENTRU MOBIL */}
      {isBottomSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Fundalul semi-transparent (Backdrop click to close) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsBottomSheetOpen(false)}
          />

          {/* Panoul glisant care vine de jos în sus */}
          <div className="relative bg-white w-full max-h-[85vh] rounded-t-[2.5rem] p-6 shadow-2xl z-10 overflow-y-auto flex flex-col transform animate-slide-up">
            {/* Indicatorul liniar de drag din partea de sus */}
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6 flex-shrink-0" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
                Toate Categoriile
              </h3>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Organizare pe două coloane curate pentru acces facil cu degetul mare */}
            <div className="grid grid-cols-2 gap-4 pb-8">
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={`modal-${cat}`}
                    onClick={() => {
                      onSelectCategory(isSelected ? "" : cat);
                      setIsBottomSheetOpen(false); // Închidem foaia după selecție
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-500 text-white font-black"
                        : "bg-stone-50 border-stone-100 text-stone-800 font-bold"
                    }`}
                  >
                    <span className="text-2xl">{getCategoryIcon(cat)}</span>
                    <span className="text-xs uppercase tracking-tighter leading-tight truncate">
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
