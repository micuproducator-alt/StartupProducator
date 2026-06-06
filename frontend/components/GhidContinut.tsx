import React, { useState } from "react";

const PRODUCT_CATEGORIES = [
  { name: "Legume", icon: "🥕" },
  { name: "Fructe", icon: "🍏" },
  { name: "Miere & Apicole", icon: "🍯" },
  { name: "Lactate & Brânzeturi", icon: "🧀" },
  { name: "Carne & Mezeluri", icon: "🥩" },
  { name: "Ouă", icon: "🥚" },
  { name: "Torturi & Prăžituri", icon: "🍰" },
  { name: "Dulceață & Zacuști", icon: "🫙" },
  { name: "Băuturi & Siropuri", icon: "🍾" },
  { name: "Făinoase & Patiserie", icon: "🥖" },
  { name: "Artizanat & Lucru Manual", icon: "🧶" },
  { name: "Flori & Plante", icon: "🌸" },
  { name: "Altele", icon: "📦" },
];

const PLANS = [
  {
    id: "basic",
    name: "Starter",
    basePrice: 10,
    color: "border-stone-200 bg-white",
    badge: "bg-stone-500",
    features: [
      "Vinde 1 tip de produs",
      "Vizibil în 1 Categorie",
      "Suport Standard",
    ],
    example:
      "Dacă adaugi 'Miere de Tei', alegi o singură categorie și apare strict acolo.",
  },
  {
    id: "standard",
    name: "Grower",
    basePrice: 20,
    color:
      "border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20",
    badge: "bg-emerald-600",
    isRecommended: true,
    features: [
      "Vinde până la 3 produse",
      "Vizibil în 3 Categorii SIMULTAN",
      "Recomandat de gospodari",
    ],
    example:
      "Adaugi 'Dulceață'. Bifezi 3 categorii. Anunțul tău se multiplică automat și apare în toate cele 3 în același tempo!",
  },
  {
    id: "premium",
    name: "Pro Market",
    basePrice: 30,
    color: "border-stone-900 bg-stone-900 text-white shadow-lg",
    badge: "bg-amber-500 text-stone-900",
    features: [
      "Vinde până la 5 produse",
      "Vizibil în 5 Categorii SIMULTAN",
      "Suport Prioritar 24/7",
    ],
    example:
      "Adaugi 'Sirop de mentă'. Îl poți bifa în 5 categorii conexe. Anunțul va fi expus în 5 locuri diferite simultan pentru impact maxim!",
  },
];

export default function GhidContinut() {
  // Stat pentru tab-ul activ: 'despre', 'categorii', 'pachete'
  const [activeTab, setActiveTab] = useState<
    "despre" | "categorii" | "pachete"
  >("despre");

  return (
    <div className="font-sans text-left text-stone-700 w-full max-w-4xl mx-auto bg-white rounded-3xl p-1">
      {/* --- TAB NAVIGATION (UX MODERN) --- */}
      <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-8 border border-stone-200/50">
        <button
          onClick={() => setActiveTab("despre")}
          className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "despre"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          👋 Despre Noi
        </button>
        <button
          onClick={() => setActiveTab("categorii")}
          className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "categorii"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          🌽 Categorii
        </button>
        <button
          onClick={() => setActiveTab("pachete")}
          className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === "pachete"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          💎 Pachete & Vizibilitate
        </button>
      </div>

      {/* --- CONTINUT DINAMIC PE TAB-URI --- */}
      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* TAB 1: DESPRE */}
        {activeTab === "despre" && (
          <section className="animate-fadeIn space-y-6">
            <div className="bg-gradient-to-br from-emerald-50/60 to-stone-50 p-8 rounded-3xl border border-emerald-100/40 shadow-sm">
              <h3 className="text-2xl font-black text-stone-900 leading-tight mb-4 flex items-center gap-2">
                Ce este Locallio și cu ce se ocupă?
              </h3>
              <p className="text-base leading-relaxed text-stone-600 font-medium">
                <strong className="text-emerald-700 font-bold">
                  Locallio.ro
                </strong>{" "}
                este o piață digitală (marketplace) dedicată exclusiv micilor
                producători și gospodarilor din România. Scurtăm inteligent
                lanțul dintre producător și consumatorul final.
              </p>
              <div className="mt-6 pt-6 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-bold text-stone-800">
                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-100 shadow-2xs">
                  <span className="text-2xl">📞</span> Direct prin Telefon
                </div>
                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-100 shadow-2xs">
                  <span className="text-2xl">❌</span> Fără Comisioane pe
                  Vânzare
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: CATEGORII */}
        {activeTab === "categorii" && (
          <section className="animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-stone-900 mb-1">
                Categoriile Noastre de Produse
              </h3>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Explorează diversitatea produselor românești
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRODUCT_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-stone-50/50 border border-stone-100 rounded-2xl p-3.5 hover:bg-emerald-50/50 hover:border-emerald-200/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer group shadow-2xs"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="font-bold text-stone-800 text-sm group-hover:text-emerald-900 transition-colors">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: PACHETE */}
        {activeTab === "pachete" && (
          <section className="animate-fadeIn space-y-8">
            <div>
              <h3 className="text-2xl font-black text-stone-900 mb-1">
                Pachetele și Regula de Aur
              </h3>
              <p className="text-sm text-stone-500 font-medium">
                Alege pachetul potrivit stocului tău. Cu cât pachetul este mai
                avansat, cu atât anunțul tău obține expunere masivă prin
                multiplicare automată.
              </p>
            </div>

            {/* Grid Planuri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {PLANS.map((plan) => {
                const isPremium = plan.id === "premium";
                return (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-[2rem] p-6 flex flex-col justify-between transition-all relative ${plan.color}`}
                  >
                    {plan.isRecommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                        Cel mai popular
                      </span>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4
                          className={`text-lg font-black uppercase tracking-wider ${isPremium ? "text-white" : "text-stone-900"}`}
                        >
                          {plan.name}
                        </h4>
                      </div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span
                          className={`text-3xl font-black ${isPremium ? "text-white" : "text-stone-900"}`}
                        >
                          {plan.basePrice}
                        </span>
                        <span
                          className={`text-xs font-bold ${isPremium ? "text-stone-400" : "text-stone-400"}`}
                        >
                          RON / anunț
                        </span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((f, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm font-semibold"
                          >
                            <span
                              className={
                                plan.isRecommended
                                  ? "text-emerald-600"
                                  : isPremium
                                    ? "text-amber-400"
                                    : "text-stone-400"
                              }
                            >
                              ✓
                            </span>
                            <span
                              className={
                                isPremium ? "text-stone-200" : "text-stone-600"
                              }
                            >
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sectiunea Explicativa Multiplicare */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-l-4 border-amber-500 p-6 rounded-r-3xl space-y-4 shadow-2xs">
              <h4 className="font-black text-amber-900 text-base flex items-center gap-2">
                💡 Cum funcționează multiplicarea anunțului?
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                Când optezi pentru pachetul{" "}
                <strong className="text-stone-900 font-bold">
                  Grower (3 categorii)
                </strong>{" "}
                sau{" "}
                <strong className="text-stone-900 font-bold">
                  Pro Market (5 categorii)
                </strong>
                , adaugi marfa o singură dată. Sistemul o clonează în fundal și
                o plasează în categorii diferite simultan, crescând șansele de
                vânzare de până la 5 ori!
              </p>

              <div className="space-y-2.5 pt-2">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-3xs text-xs flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <span
                      className={`inline-block text-[9px] font-black uppercase tracking-wider text-white px-2 py-1 rounded-lg self-start sm:self-center ${plan.badge}`}
                    >
                      {plan.name}
                    </span>
                    <span className="text-stone-600 font-medium italic">
                      "{plan.example}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
