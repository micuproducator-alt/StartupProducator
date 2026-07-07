import React, { useState, useEffect, useRef, useMemo } from "react";
import { PRODUCT_CATEGORIES } from "../types";
import { generateSlug } from "../utils/slug";
import { createFullAd } from "../services/adsService";
import {
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";

// --- DEFINIȚII TIPURI ---
interface CreateAdProps {
  onNavigate: (path: string) => void;
  onClose?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

interface Plan {
  id: "basic" | "standard" | "premium";
  name: string;
  productCount: number;
  basePrice: number;
  features: string[];
}

// --- CONSTANTE ---
const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Starter",
    productCount: 1,
    basePrice: 10,
    features: [
      "Vinde 1 tip de produs",
      "Vizibil în 1 Categorie",
      "Suport Standard",
    ],
  },
  {
    id: "standard",
    name: "Grower",
    productCount: 3,
    basePrice: 20,
    features: [
      "Vinde până la 3 produse",
      "Vizibil în 3 Categorii",
      "Recomandat",
    ],
  },
  {
    id: "premium",
    name: "Pro Market",
    productCount: 5,
    basePrice: 30,
    features: [
      "Vinde până la 5 produse",
      "Vizibil în 5 Categorii",
      "Suport Prioritar",
    ],
  },
];

const DURATIONS = [
  { days: 30, multiplier: 1, discount: 0, label: "30 Zile" },
  { days: 90, multiplier: 3, discount: 5, label: "90 Zile" },
  { days: 180, multiplier: 6, discount: 10, label: "180 Zile" },
  { days: 360, multiplier: 12, discount: 15, label: "360 Zile" },
];

export const CreateAd: React.FC<CreateAdProps> = ({ onNavigate }) => {
  // ⚡️ MODIFICARE: Intrăm direct în pasul de formular ("form") în loc de "plan"
  const [step, setStep] = useState<"plan" | "form" | "payment" | "success">(
    "form",
  );
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // ⚡️ MODIFICARE: Setăm implicit planul basic pentru a nu fi null la deschiderea directă a formularului
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(PLANS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [counties, setCounties] = useState<
    { county_code: number; name: string }[]
  >([]);
  const [availableCities, setAvailableCities] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedCountyCode, setSelectedCountyCode] = useState("");
  const [city, setCity] = useState("");
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [createdAdData, setCreatedAdData] = useState<{
    adId: string;
    plan_type: string;
    email: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⚡️ CALCUL INTERFAȚĂ: Forțăm prețul la 0 RON dacă e Basic la 30 de zile
  const totalPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    if (selectedPlan.id === "basic" && selectedDuration.days === 30) {
      return 0;
    }
    const unitDiscount = Math.ceil(
      selectedPlan.basePrice * (selectedDuration.discount / 100),
    );
    const discountedUnitPrice = selectedPlan.basePrice - unitDiscount;
    return discountedUnitPrice * selectedDuration.multiplier;
  }, [selectedPlan, selectedDuration]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

    fetch(`${apiUrl}/geo/counties`)
      .then((res) => res.json())
      .then((data) => {
        setCounties(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedCountyCode) {
      setLoadingGeo(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";

      fetch(`${apiUrl}/geo/locations/${selectedCountyCode}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableCities(data);
          setCity("");
        })
        .finally(() => setLoadingGeo(false));
    }
  }, [selectedCountyCode]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const validFiles = filesArray.filter((f) => f.type.startsWith("image/"));

      if (images.length + validFiles.length > 5) {
        alert("Maxim 5 fotografii.");
        return;
      }

      setLoading(true);
      setLoadingMessage("Optimizăm fotografiile...");

      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFiles = await Promise.all(
          filesArray.map(async (file: File) => {
            const compressedBlob = await imageCompression(file, options);
            return new File([compressedBlob], file.name, { type: file.type });
          }),
        );

        setImages((prev) => [...prev, ...compressedFiles]);
        setPreviews((prev) => [
          ...prev,
          ...compressedFiles.map((f) => URL.createObjectURL(f)),
        ]);
      } catch (err) {
        console.error(err);
        setSubmissionError("Eroare la procesarea pozelor.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setLoading(true);
    setLoadingMessage("Salvare anunț și trimitere email...");

    try {
      const imageUrls: string[] = [];
      for (const img of images) {
        const fileName = `${Math.random().toString(36).substring(7)}-${Date.now()}.${img.name.split(".").pop()}`;

        const { error: uploadError } = await supabase.storage
          .from("ad-images")
          .upload(fileName, img, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("ad-images")
          .getPublicUrl(fileName);

        if (data?.publicUrl) imageUrls.push(data.publicUrl);
      }
      const countyName =
        counties.find((c) => c.county_code === parseInt(selectedCountyCode))
          ?.name || "";
      const adSlug = `${generateSlug(title)}-${Math.random().toString(36).substring(7)}`;

      // ⚡️ VERIFICARE PACKET PROMOȚIONAL:
      const isPromoFree =
        selectedPlan!.id === "basic" && selectedDuration.days === 30;

      const resultAd = await createFullAd(
        {
          title,
          slug: adSlug,
          description,
          price: parseFloat(price),
          email,
          phoneNumber,
          location: { county: countyName, city },
          categories: selectedCategories,
          duration: selectedDuration.days,
          plan_type: selectedPlan!.id,
          // Dacă e cel gratis sau forțat acum, intră direct active, altfel pending
          status: isPromoFree ? "active" : "pending",
        },
        imageUrls,
      );
      if (resultAd) {
        // ⚡️ REPARAȚIE FORCE-UPDATE ÎN SUPABASE:
        if (isPromoFree) {
          console.log("⚡️ Forțăm activarea anunțului gratuit în DB...");

          const { error: updateError } = await supabase
            .from("ads")
            .update({ status: "active" })
            .eq("id", resultAd.id);

          if (updateError) {
            console.error("Eroare la activarea forțată:", updateError);
          } else {
            console.log("✅ Anunțul a fost activat direct în Supabase!");
          }
        }

        // ⚡️ NOU: Declanșăm automat trimiterea email-ului instant prin backend-ul tău în acest moment!
        try {
          const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:3000/api";
          await fetch(`${apiUrl}/payment/create-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adId: resultAd.id,
              plan_type: selectedPlan!.id,
              duration: selectedDuration.days,
              email: resultAd.email,
              onlyTriggerEmail: true, // Trimitem un flag către backend dacă e nevoie să știe că doar trimite emailul acum
            }),
          });
          console.log("✉️ Cererea de email trimisă automat cu succes!");
        } catch (emailErr) {
          console.error("Eroare la apelul automat de email:", emailErr);
        }

        setCreatedAdData({
          adId: resultAd.id,
          plan_type: selectedPlan!.id,
          email: resultAd.email,
        });
        setStep("payment");
      }
    } catch (err: any) {
      setSubmissionError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡️ LOGICĂ FINALIZARE/PLATĂ DIFERENȚIATĂ:
  const handlePayment = async () => {
    if (!createdAdData || !selectedPlan) return;

    const isPromoFree =
      selectedPlan.id === "basic" && selectedDuration.days === 30;

    // Cazul 1: Pachetul este cel gratuit. Sărim complet peste Stripe!
    if (isPromoFree) {
      console.log("🎁 Pachet gratuit Starter 30 zile finalizat cu succes.");
      window.location.href = "/?payment=success";
      return;
    }

    // Cazul 2: Pachet normal cu plată. Trimitem utilizatorul securizat la Stripe!
    setLoading(true);
    setLoadingMessage("Te conectăm la Stripe...");
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";

      const response = await fetch(`${apiUrl}/payment/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: createdAdData.adId,
          plan_type: selectedPlan.id,
          duration: selectedDuration.days,
          email: createdAdData.email,
        }),
      });
      const session = await response.json();
      if (session.url) window.location.href = session.url;
    } catch (err) {
      setSubmissionError("Eroare plată.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto p-4">
      {loading && (
        <div className="fixed inset-0 bg-white/90 z-[100] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-2" />
          <p className="font-bold">{loadingMessage}</p>
        </div>
      )}

      {step === "plan" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-black text-center mb-10">
            ALEGE PLANUL
          </h2>
          <div className="flex justify-center mb-8">
            <div className="p-1 bg-stone-100 rounded-2xl flex gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d.days}
                  type="button"
                  onClick={() => setSelectedDuration(d)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedDuration.days === d.days ? "bg-white shadow-sm" : "text-stone-400"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isPromoFree =
                plan.id === "basic" && selectedDuration.days === 30;
              const displayPrice = isPromoFree
                ? 0
                : Math.ceil(
                    plan.basePrice * (1 - selectedDuration.discount / 100),
                  ) * selectedDuration.multiplier;

              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setStep("form");
                  }}
                  className="bg-white border-2 p-8 rounded-[2.5rem] cursor-pointer hover:border-emerald-500 transition-all group"
                >
                  <h3 className="text-stone-400 font-black text-xs mb-4 uppercase">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-black mb-6">
                    {displayPrice}{" "}
                    <span className="text-sm">
                      RON{" "}
                      {isPromoFree && (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 font-black rounded-md animate-pulse">
                          GRATIS
                        </span>
                      )}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center text-xs font-bold text-stone-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />{" "}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="w-full bg-stone-900 text-white text-center py-4 rounded-2xl text-[10px] font-black uppercase group-hover:bg-emerald-600 transition-colors">
                    Selectează
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500"
        >
          <button
            type="button"
            onClick={() => setStep("plan")}
            className="flex items-center text-stone-400 font-bold text-[10px] uppercase mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Schimbă Planul Publicitar
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-2 bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none focus:border-emerald-500"
              placeholder="Titlu"
            />
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none focus:border-emerald-500"
              placeholder="Preț"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (selectedCategories.includes(cat))
                    setSelectedCategories((prev) =>
                      prev.filter((c) => c !== cat),
                    );
                  else if (
                    selectedCategories.length < selectedPlan!.productCount
                  )
                    setSelectedCategories((prev) => [...prev, cat]);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${selectedCategories.includes(cat) ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-400 border-stone-100"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={selectedCountyCode}
              onChange={(e) => setSelectedCountyCode(e.target.value)}
              className="bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none"
              required
            >
              <option value="">Județ</option>
              {counties.map((c) => (
                <option key={c.county_code} value={c.county_code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!selectedCountyCode || loadingGeo}
              className="bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none disabled:opacity-50"
              required
            >
              <option value="">{loadingGeo ? "..." : "Oraș"}</option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-stone-50 border-2 p-4 rounded-2xl outline-none focus:border-emerald-500"
            placeholder="Descriere"
          />

          <div className="space-y-4">
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-stone-100"
                  >
                    <img
                      src={src}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImages(images.filter((_, i) => i !== idx));
                        setPreviews(previews.filter((_, i) => i !== idx));
                      }}
                      className="absolute inset-0 bg-rose-600/70 text-white opacity-0 hover:opacity-100 transition-opacity text-[8px] font-black uppercase"
                    >
                      Șterge
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length < 5 && (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 cursor-pointer hover:bg-stone-100 p-4 text-center transition-all">
                <div className="bg-emerald-100 p-3 rounded-full mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8 text-emerald-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-black text-stone-800">
                  Apasă aici și adaugă poze la produs
                </span>
                <span className="text-xs text-stone-400 mt-0.5">
                  Fă o poză sau alege din galeria telefonului ({previews.length}
                  /5 poze)
                </span>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                  accept="image/*"
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none"
              placeholder="Email"
            />
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value.replace(/\D/g, ""))
              }
              className="bg-stone-50 border-2 p-4 rounded-2xl font-bold outline-none"
              placeholder="Telefon"
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl">
            <input
              type="checkbox"
              id="agreed"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 mt-1 accent-emerald-600"
              required
            />
            <label
              htmlFor="agreed"
              className="text-[11px] text-emerald-900 font-medium"
            >
              Sunt de acord cu termenii și condițiile.
            </label>
          </div>

          {submissionError && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase">
              <AlertCircle className="inline w-4 h-4 mr-2" /> {submissionError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            Publică Anunțul Acum
          </button>
        </form>
      )}

      {step === "payment" && (
        <div className="text-center animate-in zoom-in duration-500 max-w-md mx-auto py-10">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2">ANUNȚ PUBLICAT!</h2>
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-4">
            ✉️ Emailul de confirmare a fost trimis automat!
          </p>
          <p className="text-stone-500 text-xs mb-8">
            Anunțul tău este deja salvat și activ pe platformă. Dacă dorești să
            susții proiectul nostru local și să ne ajuți să creștem comunitatea,
            poți alege să donezi opțional prin Stripe.
          </p>
          <div className="bg-stone-50 p-6 rounded-[2rem] border-2 border-stone-100 mb-10 text-left">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-black text-stone-400 uppercase">
                Status Anunț
              </span>
              <span className="font-black text-emerald-600 text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                Activ & Confirmat
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-4">
              <span className="text-[10px] font-black text-stone-400 uppercase">
                Susținere Opțională
              </span>
              <span className="text-xl font-black text-stone-900">
                {totalPrice > 0 ? totalPrice : 10} RON
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePayment}
              className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-emerald-700 shadow-xl flex items-center justify-center gap-2"
            >
              Donează / Susține cu Stripe <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/?payment=success";
              }}
              className="w-full bg-white text-stone-400 border py-4 rounded-[1.5rem] font-bold uppercase text-[10px] hover:bg-stone-50 transition-all"
            >
              Poate mai târziu, mergi la prima pagină
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
