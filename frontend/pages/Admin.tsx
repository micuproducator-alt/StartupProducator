import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  getAllAds,
  adminDeleteAd,
  adminUpdateAd,
} from "../services/mockBackend";
import { Ad, AdStatus } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { getCounties, getCities } from "../data/locations";

interface AdminProps {
  onNavigate: (path: string) => void;
}

const EditAdForm: React.FC<{
  ad: Ad;
  onSave: (updates: Partial<Ad>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}> = ({ ad, onSave, onCancel, saving }) => {
  const [title, setTitle] = useState(ad.title);
  const [description, setDescription] = useState(ad.description);
  const [price, setPrice] = useState(String(ad.price));
  const [phone, setPhone] = useState(ad.phoneNumber);
  const [county, setCounty] = useState(ad.location.county);
  const [city, setCity] = useState(ad.location.city);

  const availableCities = useMemo(() => getCities(county), [county]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      price: Number(price),
      phoneNumber: phone,
      location: { ...ad.location, county, city },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Titlu Produs
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Preț (RON)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Județ
          </label>
          <select
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setCity("");
            }}
            className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white outline-none"
          >
            {getCounties().map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Localitate
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white outline-none"
            required
          >
            <option value="">Alege oraș...</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          Telefon Contact (WhatsApp)
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          Descriere
        </label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm leading-relaxed"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anulează
        </Button>
        <Button type="submit" isLoading={saving}>
          Salvează Modificări
        </Button>
      </div>
    </form>
  );
};

export const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "moderation" | "system"
  >("dashboard");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "0000") {
      setIsAuthenticated(true);
      fetchData();
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAds();
      setAds(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const originalAds = [...ads];
    setAds((prev) => prev.filter((a) => String(a.id) !== String(id)));

    try {
      const success = await adminDeleteAd(id);
      if (success) {
        window.dispatchEvent(new CustomEvent("miculproducator:ad_updated"));
        const freshData = await getAllAds();
        setAds(freshData);
        setConfirmDeleteId(null);
      } else {
        setAds(originalAds);
      }
    } catch (e) {
      setAds(originalAds);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (updates: Partial<Ad>) => {
    if (!editingAd) return;
    setSaving(true);
    try {
      const success = await adminUpdateAd(editingAd.id, updates);
      if (success) {
        setEditingAd(null);
        window.dispatchEvent(new CustomEvent("miculproducator:ad_updated"));
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const totalAds = ads.length;
    const totalActive = ads.filter((a) => a.status === AdStatus.ACTIVE).length;
    const uniqueSellers = new Set(ads.map((a) => a.email)).size;
    return { totalAds, totalActive, uniqueSellers };
  }, [ads]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 animate-scale-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              Admin Access
            </h2>
            <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">
              Pin Required (0000)
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 block w-full border-2 border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-center text-3xl tracking-[0.5em] font-mono outline-none transition-all"
              maxLength={4}
              autoFocus
            />
            <Button
              type="submit"
              className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-indigo-200"
            >
              Autentificare
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">
              MP<span className="text-gray-900">ADMIN</span>
            </span>
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest hidden md:block">
              Console v1.2.0
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Refresh data"
            >
              <svg
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-72 flex-shrink-0 space-y-2">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
              },
              {
                id: "moderation",
                label: "Moderare Anunțuri",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
              {
                id: "system",
                label: "Mentenanță",
                icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                    : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={tab.icon}
                  />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-8 animate-fade-in">
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Volum Total
                  </p>
                  <p className="text-4xl font-black text-gray-900">
                    {stats.totalAds}
                  </p>
                  <div className="mt-4 h-1 w-12 bg-indigo-600 rounded-full"></div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Vânzători
                  </p>
                  <p className="text-4xl font-black text-gray-900">
                    {stats.uniqueSellers}
                  </p>
                  <div className="mt-4 h-1 w-12 bg-indigo-600 rounded-full"></div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Active
                  </p>
                  <p className="text-4xl font-black text-green-500">
                    {stats.totalActive}
                  </p>
                  <div className="mt-4 h-1 w-12 bg-green-500 rounded-full"></div>
                </div>
              </div>
            )}

            {activeTab === "moderation" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    Queue Moderare
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {ads.length} înregistrări
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-8 py-4">AD ID</th>
                        <th className="px-8 py-4">Produs / Locație</th>
                        <th className="px-8 py-4">Contact</th>
                        <th className="px-8 py-4">Preț</th>
                        <th className="px-8 py-4 text-right">Intervenție</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ads.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-8 py-20 text-center text-gray-400 font-bold italic"
                          >
                            Niciun anunț în baza de date.
                          </td>
                        </tr>
                      ) : (
                        ads.map((ad) => (
                          <tr
                            key={ad.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-8 py-5">
                              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                                {ad.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {ad.title}
                              </div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                {ad.location.city}, {ad.location.county}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-xs text-gray-500 font-medium">
                              <div>{ad.email}</div>
                              <div>{ad.phoneNumber}</div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-sm font-black text-green-600">
                                {ad.price} RON
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right whitespace-nowrap">
                              {confirmDeleteId === ad.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-[10px] font-black text-red-600 uppercase tracking-tight mr-1 animate-pulse">
                                    Sigur?
                                  </span>
                                  <button
                                    onClick={() => handleDelete(ad.id)}
                                    disabled={deletingId === ad.id}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-black uppercase hover:bg-red-700"
                                  >
                                    DA
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-black uppercase hover:bg-gray-300"
                                  >
                                    NU
                                  </button>
                                </div>
                              ) : (
                                <div className="space-x-3">
                                  <button
                                    onClick={() => setEditingAd(ad)}
                                    className="text-xs font-black text-indigo-600 hover:text-indigo-900 uppercase tracking-widest transition-colors"
                                  >
                                    Editează
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(ad.id)}
                                    className="text-xs font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                                  >
                                    Șterge
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    Mentenanță Sistem
                  </h3>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Pentru a reseta baza de date (Wipe), vă rugăm folosiți
                    consola de management directă.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-2xl"
                    onClick={fetchData}
                  >
                    Refresh Sincronizare
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!editingAd}
        onClose={() => setEditingAd(null)}
        title={
          editingAd
            ? `Editare Admin: ${editingAd.id.slice(0, 8).toUpperCase()}`
            : "Editare"
        }
      >
        {editingAd && (
          <EditAdForm
            ad={editingAd}
            onSave={handleSaveEdit}
            onCancel={() => setEditingAd(null)}
            saving={saving}
          />
        )}
      </Modal>
    </div>
  );
};
