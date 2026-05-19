import React, { useEffect, useState } from "react";
import { Ad } from "../types";
import { Button } from "../components/Button";
import { AdCard } from "../components/AdCard";
import { Helmet } from "react-helmet-async";
import {
  fetchAdById,
  fetchActiveAds,
  addReview,
  fetchRelatedAds,
} from "../services/adsService";
// Adaugă fetchRelatedAds aici:

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAdById(id);
        console.log("OBIECTUL AD PRIMIT:", data);
        console.log("RECENZII IN OBIECT:", data.ads_reviews);
        console.log("DEBUG IMAGINI:", data.ads_images);

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
        console.log("URL IMAGINE TEST:", data.ads_images?.[0]?.url);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (ad) {
      const loadRelated = async () => {
        const currentCatNames =
          ad.ads_categories
            ?.map((c: any) => c.categories?.name)
            .filter(Boolean) || [];

        if (currentCatNames.length > 0) {
          const similar = await fetchRelatedAds(currentCatNames, ad.id);
          setRelatedAds(similar);
        }
      };
      loadRelated();
    }
  }, [ad?.id]); // Rulăm doar când se schimbă anunțul principal

  const handleRelatedClick = (relatedAd: Ad) => {
    setAd(relatedAd);
    setCurrentImageIndex(0);
    setShowEmail(false);
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
    const url = window.location.origin + `/#/ad/${identifier}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title,
          text: `Vezi acest produs pe MiculProducator: ${ad?.title}`,
          url: url,
        });
      } catch (err) {}
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

    // 1. Validări de bază
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
      // 2. Trimitem la backend (addReview returnează rândul nou din DB)
      const savedReview = await addReview(ad.id, {
        author_name: trimmedName,
        rating: Number(reviewRating),
        comment: trimmedComment,
      });

      // 3. Actualizăm starea locală (UI-ul se va schimba instant)
      setAd((prev) => {
        if (!prev) return null;

        // Ne asigurăm că obiectul nou are structura corectă pentru afișare
        const normalizedReview = {
          ...savedReview,
          author: savedReview.author || trimmedName, // Fallback în caz că DB întârzie
        };

        const updatedReviews = [normalizedReview, ...(prev.ads_reviews || [])];

        // Recalculăm media notelor (Rating-ul global al anunțului)
        const totalRating = updatedReviews.reduce(
          (sum, r) => sum + Number(r.rating || 0),
          0,
        );

        const newReviewCount = updatedReviews.length;

        return {
          ...prev,
          ads_reviews: updatedReviews,
          rating: totalRating / newReviewCount,
          reviewCount: newReviewCount, // Update și la numărul total de recenzii
        };
      });

      // 4. Curățăm formularul
      setReviewName("");
      setReviewComment("");
      setReviewFormVisible(false);

      // 5. Feedback vizual
      onAddToast?.("success", "Mulțumim! Recenzia a fost adăugată.");
    } catch (error: any) {
      const message = error.message.includes("deja o recenzie")
        ? error.message
        : "Nu s-a putut salva recenzia. Încearcă mai târziu.";
      onAddToast?.("error", message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-gray-500">
        Se încarcă detaliile...
      </div>
    );
  if (!ad)
    return (
      <div className="p-12 text-center text-red-500">
        Anunțul nu a fost găsit.
      </div>
    );

  const whatsappLink = ad.phone_number
    ? `https://wa.me/40${ad.phone_number.replace(/^0/, "")}?text=Salut, am vazut anuntul "${ad.title}" pe MiculProducator.`
    : null;

  // --- LOGICA SCHEMA DATA PENTRU GOOGLE ---
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
    aggregateRating:
      ad.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ad.rating,
            reviewCount: ad.ads_reviews?.length || 1,
          }
        : undefined,
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
      {/* --- SEO START --- */}
      <Helmet>
        <title>{`${ad.title} | Preț ${ad.price} RON | Micul Producător`}</title>
        <link
          rel="canonical"
          href={`${window.location.origin}/#/ad/${ad.slug || ad.id}`}
        />
        <meta
          name="description"
          content={`Cumpără ${ad.title} direct de la producător din ${ad.city}, ${ad.county}. ${ad.description.substring(0, 150)}...`}
        />
        <meta
          name="keywords"
          content={`${ad.title}, produse naturale, ${ad.city}, legume de tara, proaspat`}
        />

        {/* Open Graph pentru Facebook/WhatsApp share */}
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

        {/* Date Structurate pentru Google JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>
      {/* --- SEO END --- */}

      <div className="overflow-hidden">
        {/* Gallery Section */}
        <div className="bg-stone-50 aspect-video rounded-3xl overflow-hidden mb-8 relative group select-none border border-stone-100">
          {(ad.ads_images?.length || 0) > 0 ? (
            <img
              src={ad.ads_images?.[currentImageIndex]?.url}
              alt=""
              className="w-full h-full object-cover"
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
            <div className="bg-stone-900 text-white px-8 py-5 rounded-3xl shadow-xl shadow-stone-200">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-1 opacity-60">
                Preț Gospodar
              </span>
              <span className="text-3xl font-black">
                {ad.price}{" "}
                <span className="text-sm font-bold uppercase">RON</span>
              </span>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">
              Descriere Produs
            </h3>
            <div className="prose prose-stone max-w-none text-stone-600 bg-stone-50/50 p-8 rounded-[2rem] border border-stone-100 leading-relaxed font-medium">
              {ad.description}
            </div>
          </div>

          <div className="mt-12 p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50">
            <div className="flex flex-col sm:flex-row gap-4">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-16 flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all active:scale-95"
                >
                  Contact WhatsApp
                </a>
              )}

              {!showEmail ? (
                <button
                  onClick={() => setShowEmail(true)}
                  className="flex-1 h-16 flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
                >
                  Afișează Email
                </button>
              ) : (
                <a
                  href={`mailto:${ad.email}`}
                  className="flex-1 h-16 flex flex-col items-center justify-center bg-white border-2 border-emerald-100 text-stone-800 rounded-2xl transition-all shadow-md"
                >
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    Email:
                  </span>
                  <span className="text-xs font-black text-emerald-700">
                    {ad.email}
                  </span>
                </a>
              )}
            </div>
          </div>

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
                        {/* Avatar Placeholder - Stil Profi */}
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

                      {/* Rating-ul vine din componenta ta StarRating */}
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
