import React, { useEffect, useState, useMemo, useRef } from "react";
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

  // Referință pentru secțiunea cu harta
  const mapRef = useRef<HTMLDivElement>(null);

  // State-uri pentru locații din API (modificat la any[] pentru flexibilitate cu DB)
  const [counties, setCounties] = useState<any[]>([]);
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
  // ⚡️ COD NOU: Verificăm dacă există cel puțin un filtru activat
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== "" ||
      filterCounty !== "" ||
      filterCity !== "" ||
      selectedCategory !== "" ||
      showFavoritesOnly === true ||
      routeStartCounty !== "" ||
      routeEndCounty !== ""
    );
  }, [
    searchTerm,
    filterCounty,
    filterCity,
    selectedCategory,
    showFavoritesOnly,
    routeStartCounty,
    routeEndCounty,
  ]);

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

  // Auto-scroll la hartă când se selectează "La Drum"
  useEffect(() => {
    if (searchMode === "route") {
      setTimeout(() => {
        mapRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [searchMode]);

  // Fetch județe la montare
  useEffect(() => {
    fetch(`${API_URL}/geo/counties`)
      .then((res) => res.json())
      .then((data) => {
        // Ne asigurăm că extragem array-ul corect dacă vine împachetat în data.data
        const countiesData = Array.isArray(data) ? data : data.data || [];
        setCounties(countiesData);
      })
      .catch((err) => console.error("Eroare la încărcarea județelor:", err));
  }, []);

  useEffect(() => {
    loadAds();
    window.addEventListener("miculproducator:ad_updated", loadAds);
    return () =>
      window.removeEventListener("miculproducator:ad_updated", loadAds);
  }, []);

  // Fetch orașe când se schimbă filterCounty
  useEffect(() => {
    if (filterCounty) {
      const countyObj = counties.find((c) => {
        const name = c.county_name || c.name || "";
        return name === filterCounty;
      });

      if (countyObj) {
        const code = countyObj.county_code || countyObj.id;
        setLoadingGeo(true);
        fetch(`${API_URL}/geo/locations/${code}`)
          .then((res) => res.json())
          .then((data) => {
            const locations = Array.isArray(data) ? data : data.data || [];
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
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
      <h1 className="sr-only">
        Locallio – Piața Online a Producătorilor Locali din România | Hrană
        Curată de la Oameni Gospodari
      </h1>

      {/* ⚡️ BANNER INTELIGENT: ANUNȚURI 100% GRATUITE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6 p-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-2xl md:rounded-[2rem] shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border border-emerald-400/20"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 text-emerald-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black uppercase tracking-wide">
              Susținem Gospodarii Români! 🇷🇴
            </h3>
            <p className="text-xs text-emerald-100 font-medium">
              Publicarea și vizualizarea anunțurilor pe Locallio sunt și vor
              rămâne{" "}
              <span className="font-bold underline decoration-wavy decoration-yellow-400">
                100% GRATUITE
              </span>
              . Fără comisioane!
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex-shrink-0"
        >
          Adaugă Anunț Acum
        </button>
      </motion.div>

      <div className="mb-8 md:mb-12 overflow-hidden rounded-[2rem] md:rounded-[3rem]">
        <Carousel slides={heroSlides} />
      </div>

      <div className="mb-8 md:mb-14">
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-24 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/40 space-y-6">
            <div className="flex justify-between items-end px-1">
              <h2 className="text-xs md:text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />{" "}
                Filtrează
              </h2>
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={handleResetFilters}
                className={`text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  hasActiveFilters
                    ? "text-emerald-600 hover:text-emerald-700 cursor-pointer scale-105 active:scale-95"
                    : "text-stone-300 opacity-50 pointer-events-none"
                }`}
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
                      {counties.map((c, index) => {
                        const cName =
                          c.county_name ||
                          c.name ||
                          (typeof c === "string" ? c : "");
                        const cCode = c.county_code || c.id || index;
                        return (
                          <option key={cCode} value={cName}>
                            {cName}
                          </option>
                        );
                      })}
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
                /* MODIFICARE AICI PENTRU A REZOLVA DROPDOWN-URILE DIN IMAGINEA 1NuMerge.JPG */
                <div className="space-y-4 bg-emerald-50/40 p-5 rounded-[2rem] border border-emerald-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                      Plecare
                    </label>
                    <select
                      value={routeStartCounty}
                      onChange={(e) => setRouteStartCounty(e.target.value)}
                      className="w-full bg-white rounded-xl p-3 text-sm font-bold shadow-sm outline-none cursor-pointer text-stone-800"
                    >
                      <option value="">Alege Județ</option>
                      {counties.map((c, index) => {
                        const cName =
                          c.county_name ||
                          c.name ||
                          (typeof c === "string" ? c : "");
                        const cCode = c.county_code || c.id || index;
                        return (
                          <option key={cCode} value={cName}>
                            {cName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                      Destinație
                    </label>
                    <select
                      value={routeEndCounty}
                      onChange={(e) => setRouteEndCounty(e.target.value)}
                      className="w-full bg-white rounded-xl p-3 text-sm font-bold shadow-sm outline-none cursor-pointer text-stone-800"
                    >
                      <option value="">Alege Județ</option>
                      {counties.map((c, index) => {
                        const cName =
                          c.county_name ||
                          c.name ||
                          (typeof c === "string" ? c : "");
                        const cCode = c.county_code || c.id || index;
                        return (
                          <option key={cCode} value={cName}>
                            {cName}
                          </option>
                        );
                      })}
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
              ref={mapRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-[300px] md:h-[450px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white"
            >
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
