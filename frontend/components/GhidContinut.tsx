import React from "react";
import { motion } from "framer-motion";

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

/* ——— BLOCURI REUTILIZABILE INTERNE ——— */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6">
      {children}
    </h3>
  );
}

function Pillar({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300">
      <span className="text-2xl shrink-0 p-2 bg-emerald-50 rounded-xl">
        {icon}
      </span>
      <div>
        <h4 className="text-base font-bold text-stone-950 mb-1">{title}</h4>
        <p className="text-sm leading-relaxed text-stone-500">{text}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-stone-100 my-10" />;
}

export default function MisiuneaNoastraContinut() {
  return (
    <div className="font-sans text-stone-800 w-full max-w-2xl mx-auto">
      <div className="max-h-[65vh] overflow-y-auto px-2 sm:px-4 custom-scrollbar">
        {/* ——— VISUL NOSTRU ——— */}
        <section className="pt-4 pb-8 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-4">
            Rădăcini Puternice, Viitor Curat
          </p>
          <h2 className="text-3xl sm:text-4xl font-black leading-[1.15] tracking-tight text-stone-900 mb-5">
            Scurtăm drumul de la pământ,
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              direct pe masa ta.
            </span>
          </h2>
          <p className="text-base leading-relaxed text-stone-600 font-medium max-w-xl mx-auto">
            Locallio s-a născut dintr-un vis simplu, dar puternic: acela de a
            transforma România într-un hub central al gustului autentic.
            Conectăm inima gospodăriilor românești direct cu comunitățile
            urbane, eliminând complet intermediarii și comisioanele.
          </p>
        </section>

        <Divider />

        {/* ——— CEI 4 PILONI ——— */}
        <section>
          <SectionLabel>Valorile Platformei</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Pillar
              icon="📍"
              title="Vizibilitate Absolută"
              text="Aducem micii producători din anonimat direct pe harta României. Indiferent cât de ascunsă e grădina ta, meriți să fii găsit de cumpărători din orice colț al țării."
            />
            <Pillar
              icon="🤝"
              title="Conexiune Rapidă"
              text="Facilităm legături umane, directe și calde. Fără birocrație, fără cozi, fără contracte complicate. Doar un telefon sau un mesaj pe WhatsApp între tine și producător."
            />
            <Pillar
              icon="🍃"
              title="Transparență Totală"
              text="Cumperi direct de la sursă, cunoscând povestea din spatele fiecărui produs. Știi exact cine a cultivat pământul și cum a fost pregătită hrana ta."
            />
            <Pillar
              icon="📈"
              title="Economie Locală"
              text="Fiecare leu investit pe Locallio rămâne în buzunarul celui care a muncit. Sprijinim dezvoltarea satelor românești și păstrarea tradițiilor vii."
            />
          </div>
        </section>

        <Divider />

        {/* ——— CATEGORII ——— */}
        <section>
          <SectionLabel>Comunitatea Noastră Biodiversă</SectionLabel>
          <p className="text-sm leading-relaxed text-stone-500 mb-6 max-w-md">
            De la miere pură de pădure și brânzeturi maturate în tihnă, până la
            artizanat cusut cu suflet. Locallio găzduiește tot ce are România
            mai roditor:
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 bg-stone-50 border border-stone-200 rounded-full hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>

        <Divider />

        {/* ——— CUVÂNT DE ÎNCHEIERE ——— */}
        <section className="pb-8 text-center">
          <p className="text-xl font-bold bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent leading-relaxed max-w-md mx-auto italic">
            „O țară care își hrănește producătorii, este o țară care își asigură
            un viitor sănătos.”
          </p>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">
            Locallio • Împreună Creștem România
          </p>
        </section>
      </div>
    </div>
  );
}
