import React, { useEffect, useState } from "react";
import { Ad } from "../types";
import { Button } from "../components/Button";
import { AdCard } from "../components/AdCard";
import { Helmet } from "react-helmet-async";
import {
  fetchAdById,
  addReview,
  fetchRelatedAds,
} from "../services/adsService";

interface AdDetailsProps {
  id: string;
  initialData?: Ad | null;
  onNavigate?: (path: string) => void;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToast?: (type: "success" | "info" | "error", msg: string) => void;
}

export const AdDetails: React.FC<AdDetailsProps> = ({
  id,
  initialData,
  onNavigate,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToast,
}) => {
  const [ad, setAd] = useState<Ad | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEmail, setShowEmail] = useState(false);

  // Review Form State
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);

  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);

  // 1. Incarcare anunt principal
  useEffect(() => {
    let isMounted = true;

    // Resetam starea vizuala la schimbarea ID-ului
    setCurrentImageIndex(0);
    setShowEmail(false);

    const loadAd = async () => {
      // Daca avem deja date initiale potrivite, nu afisam spinner-ul
      if (!initialData || initialData.id !== id) {
        setLoading(true);
      } else {
        setAd(initialData);
      }

      try {
        const data = await fetchAdById(id);
        if (!isMounted) return;

        // Calc medie rating
        if (data.ads_reviews && data.ads_reviews.length > 0) {
          const total = data.ads_reviews.reduce(
            (sum: number, r: any) => sum + Number(r.rating || 0),
            0,
          );
          data.rating = total / data.ads_reviews.length;
        } else {
          data.rating = 0;
        }

        setAd(data);
      } catch (err) {
        console.error("Eroare la incarcarea anuntului:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAd();

    return () => {
      isMounted = false;
    };
  }, [id, initialData]);

  // 2. Incarcare anunturi similare
  useEffect(() => {
    let isMounted = true;

    if (ad) {
      const loadRelated = async () => {
        const currentCatNames =
          ad.ads_categories
            ?.map((c: any) => c.categories?.name)
            .filter(Boolean) || [];

        if (currentCatNames.length > 0) {
          try {
            const similar = await fetchRelatedAds(currentCatNames, ad.id);
            if (isMounted) setRelatedAds(similar);
          } catch (error) {
            console.error("Eroare la incarcarea anunturilor similare:", error);
          }
        }
      };
      loadRelated();
    }

    return () => {
      isMounted = false;
    };
  }, [ad?.id]);

  const handleRelatedClick = (relatedAd: Ad) => {
    setAd(relatedAd);
    if (onNavigate) onNavigate(`ad/${relatedAd.slug || relatedAd.id}`);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const imagesCount = ad?.ads_images?.length || 0;
    if (imagesCount > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imagesCount);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const imagesCount = ad?.ads_images?.length || 0;
    if (imagesCount > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
    }
  };

  const handleShare = async () => {
    const identifier = ad?.slug || id;
    const url = `${window.location.origin}/#/ad/${identifier}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title,
          text: `Vezi acest produs pe MiculProducator: ${ad?.title}`,
          url: url,
        });
      } catch (err) {
        // Ignoram erorile de tip "User cancelled share"
      }
    } else {
      await navigator.clipboard.writeText(url);
      if (onAddToast) onAddToast("info", "Link copiat în clipboard!");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;

    const trimmedName = reviewName.trim();
    const trimmedComment = reviewComment.trim();

    if (trimmedName.length < 2) {
      onAddToast?.("error", "Te rugăm să introduci un nume valid.");
      return;
    }
    if (trimmedComment.length < 10) {
      onAddToast?.("error", "Comentariul trebuie să aibă minim 10 caractere.");
      return;
    }

    setSubmittingReview(true);

    try {
      const savedReview = await addReview(ad.id, {
        author_name: trimmedName,
        rating: Number(reviewRating),
        comment: trimmedComment,
      });

      setAd((prev) => {
        if (!prev) return null;

        const normalizedReview = {
          ...savedReview,
          author: savedReview.author || trimmedName,
        };

        const updatedReviews = [normalizedReview, ...(prev.ads_reviews || [])];

        const totalRating = updatedReviews.reduce(
          (sum, r) => sum + Number(r.rating || 0),
          0,
        );

        const newReviewCount = updatedReviews.length;

        return {
          ...prev,
          ads_reviews: updatedReviews,
          rating: totalRating / newReviewCount,
          reviewCount: newReviewCount,
        };
      });

      setReviewName("");
      setReviewComment("");
      setReviewFormVisible(false);

      onAddToast?.("success", "Mulțumim! Recenzia a fost adăugată.");
    } catch (error: any) {
      const message = error.message?.includes("deja o recenzie")
        ? error.message
        : "Nu s-a putut salva recenzia. Încearcă mai târziu.";
      onAddToast?.("error", message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !ad) {
    return (
      <div className="p-12 text-center text-stone-500 font-bold">
        Se încarcă detaliile...
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="p-12 text-center text-rose-500 font-bold">
        Anunțul nu a fost găsit.
      </div>
    );
  }

  const userPhone = ad.phone_number;

  const whatsappLink = userPhone
    ? `https://wa.me/40${userPhone.replace(/\D/g, "").replace(/^0/, "").replace(/^40/, "")}?text=Salut,%20am%20v%C4%83zut%20anun%C8%9Bul%20t%C4%83u%20"${encodeURIComponent(ad.title)}"%20pe%20Locallio.`
    : null;

  const mapsLink =
    ad.city && ad.county
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ad.city}, ${ad.county}, Romania`)}`
      : null;

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: ad.title,
    image:
      ad.ads_images && ad.ads_images.length > 0
        ? ad.ads_images.map((img) => img.url)
        : [],
    description: ad.description,
    brand: {
      "@type": "Brand",
      name: "Micul Producător",
    },
    offers: {
      "@type": "Offer",
      url: `${window.location.origin}/#/ad/${ad.slug || ad.id}`,
      priceCurrency: "RON",
      price: ad.price,
      availability: "https://schema.org/InStock",
      areaServed: ad.county,
    },
    ...(ad.rating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ad.rating,
        reviewCount: ad.ads_reviews?.length || 1,
      },
    }),
  };

  const StarRating = ({
    rating,
    size = "sm",
  }: {
    rating: number;
    size?: "sm" | "lg";
  }) => {
    const starClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
    return (
      <div className="flex items-center text-yellow-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`${starClass} ${i <= Math.round(rating) ? "fill-current" : "text-gray-300"}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white">
      <Helmet>
        <title>{`${ad.title} | Preț ${ad.price} RON | Micul Producător`}</title>
        <link
          rel="canonical"
          href={`${window.location.origin}/#/ad/${ad.slug || ad.id}`}
        />
        <meta
          name="description"
          content={`Cumpără ${ad.title} direct de la producător din ${ad.city}, ${ad.county}. ${ad.description?.substring(0, 150)}...`}
        />
        <meta
          name="keywords"
          content={`${ad.title}, produse naturale, ${ad.city}, legume de tara, proaspat`}
        />

        <meta property="og:title" content={ad.title} />
        <meta
          property="og:description"
          content={`Localitate: ${ad.city}. Preț: ${ad.price} RON`}
        />
        <meta
          property="og:image"
          content={
            ad.ads_images && ad.ads_images.length > 0
              ? ad.ads_images[0].url
              : "link-imagine-placeholder.jpg"
          }
        />

        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <div className="overflow-hidden">
        {/* Gallery Section */}
        <div className="bg-stone-50 aspect-video rounded-3xl overflow-hidden mb-8 relative group select-none border border-stone-100">
          {(ad.ads_images?.length || 0) > 0 ? (
            <img
              src={ad.ads_images?.[currentImageIndex]?.url}
              alt={ad.title}
              className="w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-300">
              Fără imagini
            </div>
          )}

          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button
              onClick={() => onToggleFavorite?.()}
              className="p-3 rounded-2xl bg-white/90 shadow-sm backdrop-blur-md hover:bg-white transition-all transform active:scale-90"
            >
              <svg
                className={`w-5 h-5 ${isFavorite ? "text-rose-500 fill-current" : "text-stone-400"}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-white/90 shadow-sm backdrop-blur-md hover:bg-white transition-all transform active:scale-90"
            >
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>

          {(ad.ads_images?.length || 0) > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/50 text-stone-800 hover:bg-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/50 text-stone-800 hover:bg-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {ad.ads_images?.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-1">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-stone-900 leading-tight mb-3">
                {ad.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                <div className="flex items-center text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/50 shadow-sm">
                  <span className="mr-2 text-xs">
                    {Number(ad.rating || 0).toFixed(1)}
                  </span>
                  <StarRating rating={Number(ad.rating || 0)} />
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-stone-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {ad.city}, {ad.county}
                </div>
                <div className="text-stone-300">•</div>
                <div>
                  {ad.created_at
                    ? new Date(ad.created_at).toLocaleDateString("ro-RO")
                    : ""}
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto max-w-xs bg-stone-900 text-white px-5 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg shadow-stone-200/50 flex flex-col justify-center">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] block mb-0.5 opacity-60">
                Preț Gospodar
              </span>
              <span className="text-2xl sm:text-3xl font-black whitespace-nowrap">
                {ad.price}{" "}
                <span className="text-xs sm:text-sm font-bold uppercase text-stone-400">
                  RON
                </span>
              </span>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">
              Descriere Produs
            </h3>

            <div className="prose prose-stone max-w-none text-stone-600 bg-stone-50/50 p-8 rounded-[2rem] border border-stone-100 leading-relaxed font-medium whitespace-pre-line">
              {ad.description}
            </div>
          </div>

          <div className="mt-8 p-4 sm:p-8 bg-emerald-50/50 rounded-3xl sm:rounded-[2.5rem] border border-emerald-100/50 w-full animate-in fade-in duration-300">
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 w-full">
              {/* WhatsApp / Telefon */}
              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs hover:shadow-xl hover:bg-[#20ba5a] transition-all active:scale-[0.98] shadow-md cursor-pointer text-center"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.735-3.822c1.62.963 3.42 1.47 5.258 1.471 5.566 0 10.093-4.524 10.096-10.094.002-2.699-1.047-5.236-2.952-7.143C17.27 2.505 14.735 1.458 12.01 1.458c-5.574 0-10.102 4.525-10.104 10.097-.001 1.774.463 3.511 1.348 5.038L2.244 21.8l5.127-1.345z" />
                  </svg>
                  WhatsApp
                </a>
              ) : (
                userPhone && (
                  <a
                    href={`tel:${userPhone}`}
                    className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 bg-stone-900 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs hover:shadow-xl transition-all active:scale-[0.98] shadow-md cursor-pointer text-center"
                  >
                    Sună Producătorul
                  </a>
                )
              )}

              {/* Google Maps */}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs hover:shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md cursor-pointer text-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                    />
                  </svg>
                  Arată Locația
                </a>
              )}

              {/* Email Button */}
              {!showEmail ? (
                <button
                  type="button"
                  onClick={() => setShowEmail(true)}
                  className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-stone-50 transition-all active:scale-[0.98] shadow-md cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-stone-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                  Afișează Email
                </button>
              ) : (
                <a
                  href={`mailto:${ad.email}`}
                  className="w-full h-14 sm:h-16 flex flex-col items-center justify-center bg-white border-2 border-emerald-100 text-stone-800 rounded-xl sm:rounded-2xl transition-all shadow-md px-2 overflow-hidden hover:bg-stone-50/50"
                >
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                    Trimite mail direct:
                  </span>
                  <span className="text-xs font-black text-emerald-700 truncate max-w-full">
                    {ad.email}
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* Section Recenzii */}
          <div className="mt-20 pt-16 border-t border-stone-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                Recenzii și Opinii
              </h3>
              <button
                onClick={() => setReviewFormVisible(!reviewFormVisible)}
                className="text-[10px] font-bold uppercase tracking-widest text-emerald-600"
              >
                {reviewFormVisible ? "Anulează" : "Adaugă o Recenzie"}
              </button>
            </div>

            {reviewFormVisible && (
              <div className="bg-stone-50 p-8 rounded-[2rem] mb-12 border border-stone-100 shadow-sm">
                <form onSubmit={handleSubmitReview}>
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                        Rating-ul tău
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none transition-transform active:scale-90"
                          >
                            <svg
                              className={`w-8 h-8 ${star <= reviewRating ? "text-yellow-500 fill-current" : "text-stone-300"}`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full bg-white border border-stone-100 rounded-xl p-4 outline-none"
                      placeholder="Numele tău"
                    />
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-stone-100 rounded-xl p-4 outline-none"
                      placeholder="Comentariu..."
                    />
                  </div>
                  <Button type="submit" isLoading={submittingReview}>
                    Publică Recenzie
                  </Button>
                </form>
              </div>
            )}

            <div className="space-y-8">
              {ad.ads_reviews && ad.ads_reviews.length > 0 ? (
                ad.ads_reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="group bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs uppercase border border-emerald-100">
                          {(review.author || "U")[0]}
                        </div>
                        <div>
                          <div className="font-black text-stone-900 uppercase text-[11px] tracking-wider">
                            {review.author || "Utilizator Anonim"}
                          </div>
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString(
                                  "ro-RO",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )
                              : "Recent"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>

                    <p className="text-stone-600 text-sm leading-relaxed italic pl-2 border-l-2 border-emerald-100 ml-5">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-stone-50/50 rounded-[2.5rem] border-2 border-dashed border-stone-100 py-16 flex flex-col items-center justify-center">
                  <div className="text-stone-200 mb-4">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Fii primul care lasă o recenzie
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Anunturi Similare */}
          {relatedAds.length > 0 && (
            <div className="mt-24 mb-8">
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight mb-8">
                Produse Similare
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedAds.map((related) => (
                  <AdCard
                    key={related.id}
                    ad={related}
                    onClick={() => handleRelatedClick(related)}
                    mini={true}
                    isFavorite={false}
                    onToggleFavorite={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
