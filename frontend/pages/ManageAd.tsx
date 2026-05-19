import React, { useEffect, useState } from "react";
import { verifyManageToken, updateAd, deleteAd } from "../services/mockBackend";
import { Ad, AdStatus } from "../types";
import { Button } from "../components/Button";
import { Helmet } from "react-helmet-async";

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";

interface ManageAdProps {
  id: string;
  token: string;
  onNavigate: (path: string) => void;
}

export const ManageAd: React.FC<ManageAdProps> = ({
  id,
  token,
  onNavigate,
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // State-uri pentru locații din API
  const [counties, setCounties] = useState<
    { county_code: number; county_name: string }[]
  >([]);
  const [editCounty, setEditCounty] = useState("");
  const [editCity, setEditCity] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // 1. Fetch inițial pentru datele anunțului și lista de județe
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        // Luăm județele
        const countiesRes = await fetch(`${API_URL}/geo/counties`);
        const countiesData = await countiesRes.json();
        setCounties(countiesData);

        // Verificăm token-ul și luăm anunțul
        const data = await verifyManageToken(id, token);
        if (data) {
          setAd(data);
          setEditTitle(data.title);
          setEditDesc(data.description);
          setEditPrice(data.price);
          setEditPhone(data.phone_number);
          setEditCounty(data.county);
          setEditCity(data.city);
        } else {
          setError("Link de management invalid sau expirat.");
        }
      } catch (err) {
        setError("Eroare de sistem la verificarea token-ului.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, token]);

  // 2. Fetch orașe când se schimbă județul în modul editare
  useEffect(() => {
    if (editCounty && counties.length > 0) {
      const countyObj = counties.find((c) => c.county_name === editCounty);
      if (countyObj) {
        setLoadingGeo(true);
        fetch(`${API_URL}/geo/locations/${countyObj.county_code}`)
          .then((res) => res.json())
          .then((data) => {
            setAvailableCities(data.map((loc: any) => loc.location_name));
          })
          .catch((err) => console.error("Eroare orașe:", err))
          .finally(() => setLoadingGeo(false));
      }
    }
  }, [editCounty, counties]);

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<Ad> = {
      title: editTitle,
      description: editDesc,
      price: editPrice,
      phone_number: editPhone,
      county: editCounty,
      city: editCity,
    };

    const success = await updateAd(id, token, updates);
    if (success) {
      setAd((prev) => (prev ? { ...prev, ...updates } : null));
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-stone-100 border-b-emerald-600 rounded-full animate-spin"></div>
        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">
          Se încarcă consola...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-red-50 rounded-[2rem] text-center border border-red-100">
        <div className="text-red-500 font-black mb-4">EROARE</div>
        <p className="text-red-700 font-medium mb-6">{error}</p>
        <Button onClick={() => onNavigate("/")}>Înapoi la Prima Pagină</Button>
      </div>
    );

  if (!ad) return null;

  const previewImage =
    ad.ads_images && ad.ads_images.length > 0
      ? ad.ads_images[0].url
      : "https://via.placeholder.com/400x300?text=Fara+Imagine";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Helmet>
        <title>Administrare: {ad.title} | Micul Producător</title>
      </Helmet>

      {/* Header Consola */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Consolă Vânzător
          </h1>
          <p className="text-sm text-stone-500 mt-1 italic">
            Administrează „{ad.title}”
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
              ad.status === AdStatus.ACTIVE
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            Status: {ad.status === AdStatus.ACTIVE ? "Activ" : "În așteptare"}
          </div>
          <button
            onClick={() => onNavigate(`/ad/${ad.id}`)}
            className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors underline decoration-stone-200 underline-offset-4"
          >
            Vezi anunțul public
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coloana Stânga */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/50">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
              Previzualizare Foto
            </h3>
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 shadow-inner group relative">
              <img
                src={previewImage}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Ad Preview"
              />
            </div>
            {ad.is_premium && (
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white text-center shadow-lg shadow-amber-200/50">
                <p className="text-[10px] font-black uppercase tracking-tighter">
                  Anunț Promovat Premium
                </p>
              </div>
            )}
          </div>

          <div className="bg-stone-900 p-6 rounded-[2rem] text-white shadow-xl shadow-stone-900/20">
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">
              Cod de Identificare
            </p>
            <p className="text-xs font-mono break-all text-stone-300">
              {ad.id}
            </p>
          </div>
        </div>

        {/* Coloana Dreaptă */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-50">
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
                Informații Produs
              </h3>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Anulează
                    </Button>
                    <Button onClick={handleSave} isLoading={saving}>
                      Salvează
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editează</Button>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                    Nume Produs
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full rounded-2xl p-4 outline-none font-bold transition-all ${isEditing ? "bg-stone-50 border border-stone-200 focus:ring-2 ring-emerald-500/20" : "bg-transparent border-none p-0 text-xl"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                    Preț (RON)
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className={`w-full rounded-2xl p-4 outline-none font-bold transition-all ${isEditing ? "bg-stone-50 border border-stone-200 focus:ring-2 ring-emerald-500/20" : "bg-transparent border-none p-0 text-xl text-emerald-600"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                    Județ
                  </label>
                  {isEditing ? (
                    <select
                      value={editCounty}
                      onChange={(e) => {
                        setEditCounty(e.target.value);
                        setEditCity("");
                      }}
                      className="w-full rounded-2xl p-4 bg-stone-50 border border-stone-200 outline-none font-bold appearance-none cursor-pointer"
                    >
                      <option value="">Alege Județ</option>
                      {counties.map((c) => (
                        <option key={c.county_code} value={c.county_name}>
                          {c.county_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-bold text-stone-800 text-lg">
                      {editCounty}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                    Localitate
                  </label>
                  {isEditing ? (
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      disabled={loadingGeo || !editCounty}
                      className="w-full rounded-2xl p-4 bg-stone-50 border border-stone-200 outline-none font-bold appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">
                        {loadingGeo ? "Se încarcă..." : "Alege Localitate"}
                      </option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-bold text-stone-800 text-lg">
                      {editCity}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                  Telefon WhatsApp
                </label>
                <input
                  disabled={!isEditing}
                  type="tel"
                  value={editPhone}
                  onChange={(e) =>
                    setEditPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className={`w-full rounded-2xl p-4 outline-none font-bold transition-all ${isEditing ? "bg-stone-50 border border-stone-200 focus:ring-2 ring-emerald-500/20" : "bg-transparent border-none p-0 text-lg"}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                  Descriere Anunț
                </label>
                <textarea
                  disabled={!isEditing}
                  rows={5}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={`w-full rounded-2xl p-4 outline-none font-medium text-sm leading-relaxed transition-all ${isEditing ? "bg-stone-50 border border-stone-200 focus:ring-2 ring-emerald-500/20" : "bg-transparent border-none p-0 text-stone-600"}`}
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-black text-red-900 mb-1">
                Zonă Periculoasă
              </h3>
              <p className="text-xs text-red-600/80 font-medium">
                Ștergerea este definitivă și va elimina toate datele asociate.
              </p>
            </div>
            {showConfirmDelete ? (
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={async () => {
                    await deleteAd(id, token);
                    onNavigate("/");
                  }}
                >
                  Confirm Ștergerea
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Anulează
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                onClick={() => setShowConfirmDelete(true)}
              >
                Șterge Anunțul
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAd;
