import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "../components/Button";

interface ContactProps {
  onAddToast?: (type: "success" | "info" | "error", msg: string) => void;
  onNavigate?: (path: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onAddToast, onNavigate }) => {
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
      // Preluăm variabila VITE_API_URL (https://startupproducator.onrender.com)
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (onAddToast) {
          onAddToast(
            "success",
            "Mesajul tău a fost trimis! Îți vom răspunde în cel mai scurt timp.",
          );
        }

        // Resetăm formularul
        setFormData({
          name: "",
          email: "",
          subject: "Gospodar / Producător",
          message: "",
        });
      } else {
        throw new Error(data.error || "Eroare la trimiterea mesajului.");
      }
    } catch (error: any) {
      if (onAddToast) {
        onAddToast(
          "error",
          error.message ||
            "Nu am putut trimite mesajul. Te rugăm să încerci din nou.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAds = () => {
    if (onNavigate) {
      onNavigate("/");
    } else {
      window.location.hash = "#/";
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Contact | Locallio - Suport și Sugestii</title>
        <meta
          name="description"
          content="Ai întrebări sau sugestii? Intră în legătură cu echipa Locallio. Suntem aici pentru producători locali și cumpărători."
        />
        <link rel="canonical" href={`${window.location.origin}/#/contact`} />
      </Helmet>

      <div className="max-w-3xl mx-auto">
        {/* Header Secțiune */}
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 inline-block mb-3">
            Suntem Aici Pentru Tine
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Contactează Echipa Locallio
          </h1>
          <p className="mt-3 text-stone-600 font-medium max-w-xl mx-auto text-sm sm:text-base">
            Ai o întrebare legată de un anunț, vrei să ne raportezi o problemă
            sau dorești să colaborăm? Scrie-ne mai jos!
          </p>
        </div>

        {/* Formularul de Contact Centrat */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-stone-100 shadow-sm">
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

        {/* Casetă evidențiată JOS: Return la Anunțuri */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-3xl p-6 gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Căutai un produs sau un producător local?
            </h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Întoarce-te la piața digitală și vezi produsele proaspete din zona
              ta.
            </p>
          </div>

          <button
            onClick={handleBackToAds}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-md hover:shadow-emerald-200 transition-all duration-200 group active:scale-95"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Inapoi la Anunțuri
          </button>
        </div>
      </div>
    </div>
  );
};
