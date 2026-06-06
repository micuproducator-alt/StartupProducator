import React, { useState } from "react";

// ==========================================
// CONFIGURARE: Pune link-urile tale aici!
// ==========================================
const REVOLUT_ME_LINK = "https://revolut.me/numele_tau_revolut";
const PAYPAL_ME_LINK = "https://paypal.me/locallio";

export default function DonationPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(15);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"revolut" | "paypal">(
    "revolut",
  ); // Default pe Revolut
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiers = [
    {
      amount: 15,
      label: "☕ O cafea",
      description: "Ne ține treji în nopțile în care scriem cod.",
    },
    {
      amount: 50,
      label: "🌾 Un coș cu bunătăți",
      description: "Ajută la plata serverelor pentru o lună întreagă.",
    },
    {
      amount: 100,
      label: "🚜 Susținător Premium",
      description: "Finanțează direct funcționalități noi pentru gospodari.",
    },
  ];

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalAmount = selectedAmount || parseFloat(customAmount);

    if (!finalAmount || finalAmount <= 0) {
      alert("Te rugăm să introduci sau să selectezi o sumă validă.");
      setIsSubmitting(false);
      return;
    }

    // REDIRECȚIONARE CĂTRE PROCESATORUL DE PLATĂ
    if (paymentMethod === "revolut") {
      // Revolut.me acceptă formatul /suma la finalul linkului (ex: revolut.me/username/15)
      window.open(`${REVOLUT_ME_LINK}/${finalAmount}`, "_blank");
    } else {
      // PayPal.me acceptă formatul /suma la finalul linkului (ex: paypal.me/username/15)
      window.open(`${PAYPAL_ME_LINK}/${finalAmount}`, "_blank");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl overflow-hidden">
      {/* Banner Antet */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 px-6 py-8 text-center text-white rounded-2xl">
        <span className="text-3xl">❤️</span>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider mt-2">
          Susține Locallio
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Suntem o echipă mică de developeri care construiește această platformă
          gratuit, din pasiune pentru tradiții și oameni gospodari.
        </p>
      </div>

      {/* Formularul de Donație */}
      <form onSubmit={handleDonate} className="px-2 py-6 sm:p-8 space-y-6">
        {/* Opțiuni Sume Predefinite */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400 block">
            Alege o sumă de sprijin
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiers.map((tier) => (
              <button
                key={tier.amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(tier.amount);
                  setCustomAmount("");
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[120px] ${
                  selectedAmount === tier.amount
                    ? "border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-600/20"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div>
                  <span className="block font-black text-stone-800 text-xs sm:text-sm uppercase tracking-wide">
                    {tier.label}
                  </span>
                  <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                    {tier.description}
                  </p>
                </div>
                <span className="block text-lg font-black text-emerald-700 mt-2">
                  {tier.amount} RON
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sumă Personalizată */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400 block">
            Sau introdu altă sumă (RON)
          </label>
          <div className="relative rounded-2xl shadow-sm max-w-xs">
            <input
              type="number"
              placeholder="Altă sumă..."
              value={customAmount}
              onChange={(e) => {
                setSelectedAmount(null);
                setCustomAmount(e.target.value);
              }}
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-bold text-stone-800 text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-stone-400 font-bold text-xs">RON</span>
            </div>
          </div>
        </div>

        {/* METODA DE PLATĂ (REVOLUT / PAYPAL) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400 block">
            Alege metoda de plată
          </label>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {/* Buton Revolut */}
            <button
              type="button"
              onClick={() => setPaymentMethod("revolut")}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                paymentMethod === "revolut"
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10"
                  : "border-stone-200 text-stone-600 bg-white hover:border-stone-300"
              }`}
            >
              <span>💳</span> Revolut
            </button>

            {/* Buton PayPal */}
            <button
              type="button"
              onClick={() => setPaymentMethod("paypal")}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                paymentMethod === "paypal"
                  ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10"
                  : "border-stone-200 text-stone-600 bg-white hover:border-stone-300"
              }`}
            >
              <span>🅿️</span> PayPal
            </button>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Secțiune Transparență */}
        <div className="bg-stone-50 rounded-2xl p-4 flex items-start space-x-3 border border-stone-100">
          <span className="text-lg mt-0.5">🛡️</span>
          <div className="text-xs text-stone-500 leading-relaxed">
            <p className="font-bold text-stone-700 mb-0.5">
              Unde merg banii tăi?
            </p>
            100% din donații sunt folosite pentru acoperirea costurilor de
            server, baze de date și dezvoltarea de noi unelte care să-i ajute pe
            producători să își vândă produsele mai ușor.
          </div>
        </div>

        {/* Butonul de Trimite */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <span>Se redirecționează...</span>
          ) : (
            <>
              <span>
                Continuă către plată ({selectedAmount || customAmount} RON)
              </span>
              <span>🚀</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
