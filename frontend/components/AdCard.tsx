import React, { useState } from "react";
import { Ad } from "../types";

interface AdCardProps {
  ad: Ad;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent | React.KeyboardEvent) => void;
  mini?: boolean;
  priority?: boolean;
  showRouteContext?: boolean;
  routePosition?: number;
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  onClick,
  isFavorite,
  onToggleFavorite,
  mini = false,
}) => {
  const title = ad.title || "Anunț fără titlu";
  const description = ad.description || "";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const isBio =
    title.toLowerCase().includes("bio") ||
    description.toLowerCase().includes("natural");

  const primaryCategory =
    (ad as any).ads_categories?.[0]?.categories?.name || "Produs";
  const ratingValue = Number(ad.rating || 0);
  const reviewCount = (ad as any).ads_reviews?.length || 0;
  const showRating = ratingValue > 0;

  const adsImages = (ad as any).ads_images || [];
  const hasMultipleImages = Array.isArray(adsImages) && adsImages.length > 1;

  const mainImage =
    adsImages.length > 0
      ? adsImages[currentImgIndex].url
      : (ad as any).image_url ||
        (ad as any).image ||
        "https://via.placeholder.com/400x300?text=Fara+Imagine";

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % adsImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(
      (prev) => (prev - 1 + adsImages.length) % adsImages.length,
    );
  };
  const adSlug = ad.slug || (ad as any).id;
  if (mini) {
    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md cursor-pointer flex flex-col h-full relative transition-all"
      >
        <div className="relative h-32 w-full bg-stone-50">
          <img
            src={mainImage}
            alt={adSlug}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-white/90 backdrop-blur-sm text-stone-900 shadow-sm border border-stone-100">
              {ad.price} <span className="text-[8px] opacity-60">RON</span>
            </span>
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-[10px] font-black text-stone-900 line-clamp-1 uppercase tracking-tighter">
            {title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-[2.5rem] border transition-all duration-500 cursor-pointer flex flex-col h-full relative overflow-hidden ${
        (ad as any).is_premium
          ? "border-amber-100 shadow-xl shadow-amber-50/50 hover:border-amber-200"
          : "border-stone-100 shadow-xl shadow-stone-200/30 hover:shadow-2xl hover:shadow-stone-300/40 hover:-translate-y-1"
      }`}
    >
      {/* Container Imagine */}
      <div className="relative h-72 w-full overflow-hidden bg-stone-50">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-stone-100 animate-pulse z-10" />
        )}

        <img
          src={mainImage}
          alt={title}
          className={`w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Categorie & Status */}
        <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
          <span className="bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-lg shadow-emerald-900/20">
            {primaryCategory}
          </span>
          {(ad as any).is_premium && (
            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-lg shadow-amber-900/10">
              Prioritar
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-stone-400 hover:text-rose-500 transition-all active:scale-90 z-20 border border-white"
        >
          <svg
            className={`w-4 h-4 ${isFavorite ? "fill-current text-rose-500" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Floating Price */}
        <div className="absolute bottom-5 right-5 z-20">
          <div className="bg-white/95 backdrop-blur-md text-stone-900 px-5 py-2.5 rounded-[1.5rem] shadow-xl border border-white flex items-baseline gap-2">
            <span className="text-[9px] font-black uppercase text-stone-400">
              Preț
            </span>
            <span className="text-xl font-black tracking-tighter text-rose-600">
              {ad.price}
            </span>
            <span className="text-[10px] font-black text-rose-600">RON</span>
          </div>
        </div>

        {/* Carousel Controls */}
        {hasMultipleImages && (
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={prevImage}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
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
                  strokeWidth={3}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
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
                  strokeWidth={3}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Continut Card */}
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors tracking-tight uppercase mb-2">
          {title}
        </h3>

        <div className="flex items-center text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mb-4">
          <svg
            className="w-3.5 h-3.5 mr-1.5 text-stone-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
          {ad.city}, {ad.county}
        </div>

        <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-6 italic">
          {description}
        </p>

        {/* Footer Card */}
        {/* Footer Card */}
        <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showRating && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
                <div className="flex items-center text-[10px] font-black text-amber-600">
                  <span className="mr-1">{ratingValue.toFixed(1)}</span>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                {/* Adăugăm numărul de recenzii aici */}
                {reviewCount > 0 && (
                  <span className="text-[9px] font-bold text-stone-400 border-l border-amber-200 pl-2">
                    {reviewCount} {reviewCount === 1 ? "recenzie" : "recenzii"}
                  </span>
                )}
              </div>
            )}

            {/* Badge-ul de BIO rămâne neschimbat */}
            {isBio && (
              <div className="text-[9px] font-black text-white bg-emerald-500 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                Bio
              </div>
            )}
          </div>

          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">
            {ad.created_at
              ? new Date(ad.created_at).toLocaleDateString("ro-RO")
              : "Recent"}
          </span>
        </div>
      </div>
    </div>
  );
};
