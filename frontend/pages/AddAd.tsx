import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";

export default function AddAd() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // State pentru ID-ul categoriei selectate (default pe 1 - Legume)
  const [selectedCatId, setSelectedCatId] = useState<number>(1);

  // Lista de categorii EXACT cum apar în baza ta de date (vezi poza din Studio)
  const dbCategories = [
    { id: 1, name: "Legume" },
    { id: 2, name: "Fructe" },
    { id: 3, name: "Lactate" },
    { id: 4, name: "Carne" },
    { id: 5, name: "Miere" },
    { id: 6, name: "Ouă" },
    { id: 7, name: "Torturi & Prăjituri" },
    { id: 8, name: "Dulceață & Zacuști" },
    { id: 9, name: "Băuturi & Siropuri" },
    { id: 10, name: "Făinoase & Patiserie" },
    { id: 11, name: "Artizanat & Lucru Manual" },
    { id: 12, name: "Flori & Plante" },
    { id: 13, name: "Altele" },
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      const adData = Object.fromEntries(formData.entries());

      let imageUrl = "";

      if (file) {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        };
        const optimizedFile = await imageCompression(file, options);

        const fileName = `${Math.random()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("ad-images")
          .upload(fileName, optimizedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("ad-images")
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // --- AICI ESTE REPARAȚIA CRITICĂ ---
      const payload = {
        title: adData.title,
        description: adData.description,
        price: Number(adData.price),
        email: adData.email,
        phone_number: adData.phone,
        county: adData.county,
        city: adData.city,
        categoryId: Number(selectedCatId), // Trimitem ID-ul selectat, nu cifra 1!
        images: imageUrl ? [imageUrl] : [], // Backend-ul vrea un array numit "images"
      };

      const response = await fetch("http://localhost:3000/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Succes! Anunțul a fost adăugat în categoria corectă.`);
        e.target.reset();
        setFile(null);
      } else {
        console.error("Eroare Backend:", result);
        alert("Eroare: " + (result.message || JSON.stringify(result.errors)));
      }
    } catch (error: any) {
      alert("Eroare la trimitere: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2 className="text-2xl font-bold mb-4">Adaugă Anunț Nou</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* SELECTORUL DE CATEGORIE - Aceasta era piesa lipsă */}
        <div>
          <label className="block text-sm font-bold mb-1">
            Selectează Categoria:
          </label>
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(Number(e.target.value))}
            className="w-full p-2 border rounded-lg bg-white"
            required
          >
            {dbCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <input
          name="title"
          placeholder="Titlu (ex: Miere de Salcâm)"
          required
          className="p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Descriere detaliată..."
          required
          className="p-2 border rounded h-24"
        />
        <input
          name="price"
          type="number"
          placeholder="Preț (RON)"
          required
          className="p-2 border rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email contact"
          required
          className="p-2 border rounded"
        />
        <input
          name="phone"
          placeholder="Telefon"
          required
          className="p-2 border rounded"
        />
        <input
          name="county"
          placeholder="Județ"
          required
          className="p-2 border rounded"
        />
        <input
          name="city"
          placeholder="Oraș"
          required
          className="p-2 border rounded"
        />

        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed">
          <label className="block text-xs font-bold uppercase mb-2">
            Imagine Produs:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`p-3 rounded-xl font-bold text-white transition-all ${loading ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-600"}`}
        >
          {loading ? "Se publică..." : "Publică Anunțul"}
        </button>
      </form>
    </div>
  );
}
