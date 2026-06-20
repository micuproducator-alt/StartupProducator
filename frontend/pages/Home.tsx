import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdCard } from "../components/AdCard";
import { AdCardSkeleton } from "../components/AdCardSkeleton";
import { Carousel, Slide } from "../components/Carousel";
import { CategoryNav } from "../components/CategoryNav";
import { Ad, ToastType } from "../types";
import { getCountiesOnRoute } from "../utils/routeGraph";
import { LiveMap } from "../components/LiveMap";
import {
  Search,
  MapPin,
  Navigation,
  ShoppingBasket,
  Heart,
} from "lucide-react";

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";

interface HomeProps {
  onNavigate: (path: string) => void;
  onOpenCreateModal: () => void;
  onAdClick: (ad: Ad) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAddToast?: (type: ToastType, msg: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onOpenCreateModal,
  onAdClick,
  favoriteIds,
  onToggleFavorite,
}) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [searchMode, setSearchMode] = useState<"local" | "route">("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // State-uri pentru locații din API
  const [counties, setCounties] = useState<
    { county_code: number; county_name: string }[]
  >([]);
  const [filterCounty, setFilterCounty] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [routeStartCounty, setRouteStartCounty] = useState("");
  const [routeEndCounty, setRouteEndCounty] = useState("");
  const [calculatedRouteCounties, setCalculatedRouteCounties] = useState<
    string[]
  >([]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterCounty("");
    setFilterCity("");
    setSelectedCategory("");
    setShowFavoritesOnly(false);
    setRouteStartCounty("");
    setRouteEndCounty("");
    setCurrentPage(1);
  };

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/ads`);
      const data = await response.json();
      const adsData = data.data || data;
      setAds(Array.isArray(adsData) ? adsData : []);
    } catch (err) {
      console.error("Eroare la încărcarea anunțurilor:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch județe la montare
  useEffect(() => {
    fetch(`${API_URL}/geo/counties`)
      .then((res) => res.json())
      .then((data) => setCounties(data))
      .catch((err) => console.error("Eroare la încărcarea județelor:", err));
  }, []);

  useEffect(() => {
    loadAds();
    window.addEventListener("miculproducator:ad_updated", loadAds);
    return () =>
      window.removeEventListener("miculproducator:ad_updated", loadAds);
  }, []);

  // 2. Fetch orașe când se schimbă filterCounty
  useEffect(() => {
    if (filterCounty) {
      // REPARAT: Folosim c.county_name în loc de c.name conform erorii TS
      const countyObj = counties.find((c) => c.county_name === filterCounty);

      if (countyObj) {
        setLoadingGeo(true);
        fetch(`${API_URL}/geo/locations/${countyObj.county_code}`)
          .then((res) => res.json())
          .then((data) => {
            const locations = Array.isArray(data) ? data : data.data || [];
            // Dacă API-ul de orașe returnează tot structură cu nume, asigură-te că loc.name sau loc.city_name e corect
            setAvailableCities(
              locations.map((loc: any) => loc.name || loc.city_name || loc),
            );
            setFilterCity("");
          })
          .catch((err) => console.error("Eroare la încărcarea orașelor:", err))
          .finally(() => setLoadingGeo(false));
      }
    } else {
      setAvailableCities([]);
      setFilterCity("");
    }
    setCurrentPage(1);
  }, [filterCounty, counties]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, searchMode, showFavoritesOnly, filterCity]);

  useEffect(() => {
    if (searchMode === "route" && routeStartCounty && routeEndCounty) {
      const path = getCountiesOnRoute(routeStartCounty, routeEndCounty);
      setCalculatedRouteCounties(path);
    } else {
      setCalculatedRouteCounties([]);
    }
  }, [searchMode, routeStartCounty, routeEndCounty]);

  const processedAds = useMemo(() => {
    const normalize = (text: string) =>
      String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    return ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory) {
        const target = normalize(selectedCategory);
        matchesCategory =
          ad.ads_categories?.some((rel: any) => {
            const nameFromDB = normalize(rel.categories?.name);
            return nameFromDB === target;
          }) || false;
      }

      const matchesCounty = filterCounty ? ad.county === filterCounty : true;
      const matchesCity = filterCity ? ad.city === filterCity : true;

      const matchesFavorite = showFavoritesOnly
        ? favoriteIds.includes(ad.id)
        : true;

      const matchesRoute =
        searchMode === "route" && calculatedRouteCounties.length > 0
          ? calculatedRouteCounties.includes(ad.county)
          : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCounty &&
        matchesCity &&
        matchesFavorite &&
        matchesRoute
      );
    });
  }, [
    ads,
    searchTerm,
    selectedCategory,
    filterCounty,
    filterCity,
    showFavoritesOnly,
    favoriteIds,
    searchMode,
    calculatedRouteCounties,
  ]);

  const currentAds = processedAds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const heroSlides: Slide[] = [
    {
      id: "1",
      image:
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=70&w=800",
      title: "Hrană Curată de la Oameni Gospodari",
      description:
        "Conectăm producătorii locali din România direct cu masa ta.",
      ctaText: "Publică Anunț",
      onCtaClick: onOpenCreateModal,
    },
  ];

  return (
    <div className="max-w-400 mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
      {/* ===== SEO H1 ===== */}
      <h1 className="sr-only">
        Locallio – Piața Online a Producătorilor Locali din România | Hrană
        Curată de la Oameni Gospodari
      </h1>

      <div className="mb-8 md:mb-12 overflow-hidden rounded-4xl md:rounded-[3rem]">
        <Carousel slides={heroSlides} />
      </div>

      <div className="mb-8 md:mb-14">
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        <aside className="w-full lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/40 space-y-6">
            <div className="flex justify-between items-end px-1">
              <h2 className="text-xs md:text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />{" "}
                Filtrează
              </h2>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-stone-300 hover:text-rose-500 uppercase tracking-tighter transition-colors"
              >
                Resetează
              </button>
            </div>

            <div className="relative group">
              <input
                type="text"
                placeholder="Caută produse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-emerald-500/20 transition-all outline-none"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-emerald-500 transition-colors"
                size={20}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-[1.25rem]">
              <button
                onClick={() => setSearchMode("local")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${searchMode === "local" ? "bg-white shadow-md text-stone-900" : "text-stone-400"}`}
              >
                <MapPin size={14} /> Aproape
              </button>
              <button
                onClick={() => setSearchMode("route")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${searchMode === "route" ? "bg-white shadow-md text-stone-900" : "text-stone-400"}`}
              >
                <Navigation size={14} /> La Drum
              </button>
            </div>

            <div className="space-y-4">
              {searchMode === "local" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                      Județ
                    </label>
                    <select
                      value={filterCounty}
                      onChange={(e) => setFilterCounty(e.target.value)}
                      className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-sm font-bold text-stone-800 outline-none cursor-pointer"
                    >
                      <option value="">Toată România</option>
                      {counties.map((c) => (
                        // REPARAT: Schimbat din c.name în c.county_name
                        <option key={c.county_code} value={c.county_name}>
                          {c.county_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filterCounty && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                        Oraș
                      </label>
                      <select
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        disabled={loadingGeo}
                        className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-sm font-bold text-stone-800 outline-none disabled:opacity-50"
                      >
                        <option value="">
                          {loadingGeo ? "Se încarcă..." : "Toate localitățile"}
                        </option>
                        {availableCities.map((cityName, index) => (
                          <option key={index} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 bg-emerald-50/40 p-5 rounded-4xl border border-emerald-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                      Plecare
                    </label>
                    <select
                      value={routeStartCounty}
                      onChange={(e) => setRouteStartCounty(e.target.value)}
                      className="w-full bg-white rounded-xl p-3 text-sm font-bold shadow-sm outline-none"
                    >
                      <option value="">Alege Județ</option>
                      {counties.map((c) => (
                        // REPARAT: Schimbat din c.name în c.county_name
                        <option key={c.county_code} value={c.county_name}>
                          {c.county_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                      Destinație
                    </label>
                    <select
                      value={routeEndCounty}
                      onChange={(e) => setRouteEndCounty(e.target.value)}
                      className="w-full bg-white rounded-xl p-3 text-sm font-bold shadow-sm outline-none"
                    >
                      <option value="">Alege Județ</option>
                      {counties.map((c) => (
                        // REPARAT: Schimbat din c.name în c.county_name
                        <option key={c.county_code} value={c.county_name}>
                          {c.county_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${showFavoritesOnly ? "bg-rose-50 text-rose-600 shadow-sm" : "bg-stone-50 text-stone-400"}`}
              >
                <span className="text-xs font-black uppercase tracking-widest">
                  Favoritele mele
                </span>
                <Heart
                  size={20}
                  className={showFavoritesOnly ? "fill-current" : ""}
                />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8 md:space-y-12">
          {(searchMode === "route" || filterCounty) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-75 md:h-112.5 rounded-4xl md:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white"
            >
              {/* REPARAT: Forțăm tipul obiectului trimis prin as any dacă componenta LiveMap nu acceptă intern routeCounties */}
              <LiveMap
                ads={processedAds}
                {...({
                  routeCounties: calculatedRouteCounties,
                  startCounty: routeStartCounty,
                  endCounty: routeEndCounty,
                  onMarkerClick: onAdClick,
                } as any)}
              />
            </motion.div>
          )}

          <div id="listings">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => (
                  <AdCardSkeleton key={i} />
                ))}
              </div>
            ) : processedAds.length === 0 ? (
              <div className="py-20 text-center bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                <ShoppingBasket className="w-16 h-16 text-stone-200 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  Niciun rezultat
                </h2>
                <p className="text-stone-400 text-sm max-w-sm mx-auto">
                  Încearcă să schimbi categoria sau zona de căutare.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence mode="popLayout">
                  {currentAds.map((ad) => (
                    <motion.div
                      key={ad.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <AdCard
                        ad={ad}
                        onClick={() => onAdClick(ad)}
                        isFavorite={favoriteIds.includes(ad.id)}
                        onToggleFavorite={() => onToggleFavorite(ad.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {!loading && processedAds.length > itemsPerPage && (
            <div className="flex justify-center flex-wrap gap-3 pt-6">
              {[...Array(Math.ceil(processedAds.length / itemsPerPage))].map(
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      const el = document.getElementById("listings");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-12 h-12 rounded-2xl text-sm font-black transition-all ${currentPage === i + 1 ? "bg-stone-900 text-white scale-110" : "bg-white border text-stone-400 hover:bg-stone-50"}`}
                  >
                    {i + 1}
                  </button>
                ),
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
