import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "../components/Button"; // Asigură-te că calea este corectă

interface ContactProps {
  onAddToast?: (type: "success" | "info" | "error", msg: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onAddToast }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Gospodar / Producător",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aici poți integra apelul API către backend sau serviciul de mail (ex: EmailJS, Supabase Functions etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulare trimitere

      if (onAddToast) {
        onAddToast(
          "success",
          "Mesajul tău a fost trimis! Îți vom răspunde în cel mai scurt timp.",
        );
      }

      setFormData({
        name: "",
        email: "",
        subject: "Gospodar / Producător",
        message: "",
      });
    } catch (error) {
      if (onAddToast) {
        onAddToast(
          "error",
          "Nu am putut trimite mesajul. Te rugăm să încerci din nou.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Contact | Micul Producător - Suport și Sugestii</title>
        <meta
          name="description"
          content="Ai întrebări sau sugestii? Intrate în legătură cu echipa Micul Producător. Suntem aici pentru producători locali și cumpărători."
        />
        <link rel="canonical" href={`${window.location.origin}/#/contact`} />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Header Secțiune */}
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 inline-block mb-3">
            Suntem Aici Pentru Tine
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Contactează Echipa Micul Producător
          </h1>
          <p className="mt-3 text-stone-600 font-medium max-w-xl mx-auto text-sm sm:text-base">
            Ai o întrebare legată de un anunț, vrei să ne raportezi o problemă
            sau dorești să colaborăm? Scrie-ne mai jos!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carduri cu Informații de Contact (E-E-A-T Signals) */}
          <div className="space-y-4">
            {/* Telefon */}
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">
                Telefon Support
              </h3>
              <a
                href="tel:+40700000000"
                className="text-base font-black text-stone-800 hover:text-emerald-600 transition-colors"
              >
                +40 700 000 000
              </a>
              <p className="text-xs text-stone-500 mt-1">
                Luni - Vineri: 09:00 - 18:00
              </p>
            </div>

            {/* Email */}
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">
                Adresă Email
              </h3>
              <a
                href="mailto:suport@miculproducator.ro"
                className="text-base font-black text-stone-800 hover:text-emerald-600 transition-colors"
              >
                suport@miculproducator.ro
              </a>
              <p className="text-xs text-stone-500 mt-1">
                Răspundem în maximum 24 de ore.
              </p>
            </div>

            {/* Adresă Fizică / Sediu */}
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">
                Sediu Social
              </h3>
              <p className="text-sm font-bold text-stone-800">
                Str. Principală Nr. 123
              </p>
              <p className="text-xs text-stone-500">Vaslui, România</p>
            </div>
          </div>

          {/* Formularul de Contact */}
          <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-3xl border border-stone-100 shadow-sm">
            <h2 className="text-xl font-black text-stone-900 mb-6">
              Trimite-ne un mesaj
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Numele Tău *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ex. Ion Popescu"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-2xl px-4 py-3 text-stone-800 font-medium outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Adresă Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nume@domeniu.ro"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-2xl px-4 py-3 text-stone-800 font-medium outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Subiect
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-2xl px-4 py-3 text-stone-800 font-medium outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="Gospodar / Producator">
                    Sunt Producător / Gospodar
                  </option>
                  <option value="Cumparator">
                    Am o întrebare despre o comandă/anunț
                  </option>
                  <option value="Problema Tehnica">
                    Am întâmpinat o problemă tehnică
                  </option>

                  <option value="Colaborare">Propunere de colaborare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Mesajul Tău *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Scrie detaliile mesajului tău aici..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-2xl p-4 text-stone-800 font-medium outline-none transition-all text-sm"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full sm:w-auto"
                >
                  Trimite Mesajul
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
