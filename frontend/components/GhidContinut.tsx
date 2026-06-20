import React from "react";

const CATEGORIES = [
  "Legume",
  "Fructe",
  "Miere",
  "Lactate & Brânzeturi",
  "Carne & Mezeluri",
  "Ouă",
  "Cofetărie",
  "Dulcețuri & Zacuscă",
  "Băuturi & Siropuri",
  "Pâine & Patiserie",
  "Artizanat",
  "Flori & Plante",
];

const PLANS = [
  {
    name: "Starter",
    reach: "1 categorie",
    price: "10",
    line: "Pentru un singur produs, simplu și direct.",
  },
  {
    name: "Grower",
    reach: "3 categorii",
    price: "20",
    line: "Adaugi marfa o dată, apare în trei locuri deodată.",
    featured: true,
  },
  {
    name: "Pro Market",
    reach: "5 categorii",
    price: "30",
    line: "Vizibilitate maximă, în cinci rafturi simultan.",
  },
];

/* ——— BLOCURI REUTILIZABILE INTERNE ——— */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
      {children}
    </h3>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <span className="text-sm font-bold text-emerald-600 tabular-nums pt-0.5 shrink-0">
        {n}
      </span>
      <div>
        <h4 className="text-lg font-semibold text-stone-900 mb-1.5">{title}</h4>
        <p className="text-base leading-relaxed text-stone-500">{text}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-stone-100" />;
}

export default function GhidContinut() {
  return (
    <div className="font-sans text-stone-800 w-full max-w-2xl mx-auto">
      <div className="max-h-[68vh] overflow-y-auto px-2 sm:px-4 custom-scrollbar">
        {/* ——— DESCHIDERE ——— */}
        <section className="pt-6 pb-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-600 mb-4">
            Bun venit pe Locallio
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold leading-[1.15] tracking-tight text-stone-900 mb-5">
            Mâncare adevărată,
            <br />
            direct de la cei care o fac.
          </h2>
          <p className="text-base leading-relaxed text-stone-500 max-w-md mx-auto">
            Suntem locul unde gospodarii din toată țara își întâlnesc oamenii.
            Fără supermarket la mijloc, fără comisioane pe vânzare. Doar tu și
            producătorul, la un telefon distanță.
          </p>
        </section>

        <Divider />

        {/* ——— CUM FUNCȚIONEAZĂ ——— */}
        <section className="py-12">
          <SectionLabel>Cum merge</SectionLabel>
          <div className="space-y-8 mt-6">
            <Step
              n="1"
              title="Cauți"
              text="Răsfoiești după categorie sau după zonă. Vrei să cumperi de pe traseul tău spre casă? Pornește modul „La drum” și vezi tot ce e pe rută."
            />
            <Step
              n="2"
              title="Suni"
              text="Găsești ceva ce-ți place, suni direct producătorul. Vorbești om cu om — despre preț, despre livrare, despre cum a fost cultivat."
            />
            <Step
              n="3"
              title="Primești"
              text="Vă înțelegeți cum vă convine amândurora. Noi nu ne băgăm și nu luăm un leu din vânzarea ta."
            />
          </div>
        </section>

        <Divider />

        {/* ——— CATEGORII ——— */}
        <section className="py-12">
          <SectionLabel>Ce găsești aici</SectionLabel>
          <p className="text-base leading-relaxed text-stone-500 mt-4 mb-6 max-w-md">
            De la roșii crescute în grădină până la coșuri împletite de mână.
            Tot ce înseamnă muncă de gospodar, într-un singur loc.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded-full hover:bg-stone-100 transition-colors cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>

        <Divider />

        {/* ——— PACHETE ——— */}
        <section className="py-12">
          <SectionLabel>Dacă vinzi</SectionLabel>
          <p className="text-base leading-relaxed text-stone-500 mt-4 mb-8 max-w-md">
            Alegi un pachet o singură dată, după cât de mult vrei să fii văzut.
            Cu cand anunțul tău e într-un pachet mai generos, apare în mai multe
            categorii deodată — fără să-l postezi de mai multe ori.
          </p>

          <div className="space-y-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                  plan.featured
                    ? "border-emerald-200 bg-emerald-50/30 shadow-sm shadow-emerald-100/50"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h4 className="text-base font-bold text-stone-900">
                      {plan.name}
                    </h4>
                    {plan.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 leading-snug">
                    {plan.line}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 sm:block flex justify-between items-center">
                  <div className="text-xl font-bold text-stone-900 leading-none">
                    {plan.price}
                    <span className="text-xs font-normal text-stone-400 ml-0.5">
                      lei
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 font-medium bg-stone-100 sm:bg-transparent px-2 py-0.5 sm:px-0 sm:py-0 rounded-md">
                    {plan.reach}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ——— ÎNCHEIERE ——— */}
        <section className="py-12 text-center">
          <p className="text-lg font-medium text-stone-700 leading-relaxed max-w-sm mx-auto">
            Atât. Simplu, ca pe vremuri — doar că acum
            <br className="hidden sm:block" /> piața încape în buzunar.
          </p>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.25em] text-stone-300 pointer-events-none">
            Locallio
          </p>
        </section>
      </div>
    </div>
  );
}
