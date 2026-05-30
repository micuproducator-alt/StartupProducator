import React from "react";

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
    color: "border-green-500 text-green-600 bg-green-50",
    badge: "bg-green-500",
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
    color: "border-amber-500 text-amber-600 bg-amber-50",
    badge: "bg-amber-500",
    isRecommended: true,
    features: [
      "Vinde până la 3 produse",
      "Vizibil în 3 Categorii SIMULTAN",
      "Recomandat",
    ],
    example:
      "Adaugi 'Dulceață'. Bifezi 3 categorii. Anunțul tău se multiplică automat și apare în toate cele 3 în același timp!",
  },
  {
    id: "premium",
    name: "Pro Market",
    basePrice: 30,
    color: "border-blue-500 text-blue-600 bg-blue-50",
    badge: "bg-blue-500",
    features: [
      "Vinde până la 5 produse",
      "Vizibil în 5 Categorii SIMULTAN",
      "Suport Prioritar",
    ],
    example:
      "Adaugi 'Sirop de mentă'. Îl poți bifa în 5 categorii conexe. Anunțul va fi expus în 5 locuri diferite simultan pentru impact maxim!",
  },
];

export default function GhidContinut() {
  return (
    <div className="space-y-8 text-left text-gray-700 font-sans max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Sectiunea 1 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          Ce este Locallio și cu ce se ocupă?
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">
          <strong>Locallio.ro</strong> este o piață digitală (marketplace)
          dedicată exclusiv micilor producători și gospodarilor din România.
          Scurtăm lanțul dintre producător și consumator. Cumpărătorii te
          contactează <strong>direct prin telefon</strong>, fără intermediari și
          fără comisioane ascunse pe vânzări!
        </p>
      </section>

      {/* Sectiunea 2 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          Categoriile Noastre de Produse
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRODUCT_CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm"
            >
              <span>{cat.icon}</span>
              <span className="font-medium text-gray-700">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sectiunea 3 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          Pachetele și Regula de Aur a Vizibilității
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Alege pachetul potrivit. Cu cât pachetul este mai mare, cu atât
          anunțul tău se multiplică în mai multe categorii!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-xl p-4 flex flex-col justify-between ${plan.isRecommended ? "border-amber-500 bg-amber-50/30" : "border-gray-200"}`}
            >
              <div>
                <h4 className="font-bold text-gray-900 flex items-center justify-between">
                  {plan.name}{" "}
                  {plan.isRecommended && (
                    <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded">
                      Popular
                    </span>
                  )}
                </h4>
                <div className="text-lg font-black text-gray-900 my-1">
                  {plan.basePrice} RON
                </div>
                <ul className="text-xs text-gray-500 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Multiplicarea */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl space-y-2">
          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1">
            💡 Cum funcționează multiplicarea?
          </h4>
          <p className="text-xs text-blue-950">
            Când alegi pachetul <strong>Grower (3 categorii)</strong> sau{" "}
            <strong>Pro Market (5 categorii)</strong>, adaugi anunțul o singură
            dată, bifezi categoriile dorite, iar platforma îl va afișa automat
            în toate acele secțiuni simultan!
          </p>
          <div className="space-y-1.5 pt-1">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="bg-white p-2 rounded border border-blue-100 text-[11px]"
              >
                <span
                  className={`inline-block text-white text-[9px] font-bold uppercase px-1 rounded mr-1 ${plan.badge}`}
                >
                  {plan.name}
                </span>
                <span className="text-gray-600 italic">"{plan.example}"</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
