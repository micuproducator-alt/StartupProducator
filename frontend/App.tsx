import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Home } from "./pages/Home";
import { CreateAd } from "./pages/CreateAd";
import { AdDetails } from "./pages/AdDetails";
import { ManageAd } from "./pages/ManageAd";
import { Admin } from "./pages/Admin";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { Contact } from "./pages/Contacts";
import { Modal } from "./components/Modal";
import { ToastContainer } from "./components/Toast";
import GhidContinut from "./components/GhidContinut"; // <--- Importăm conținutul ghidului creat anterior
import { Ad, AppNotification, ToastMessage, ToastType } from "./types";
import { HelmetProvider } from "react-helmet-async";
import {
  fetchNotifications,
  clearAllNotifications,
} from "./services/mockBackend";
import { fetchActiveAds } from "./services/adsService";
import DonationPage from "./components/DonatingPage"; // Ajustat importul pentru a randa pagina de donație

// ===== SEO: configurare globală + meta per rută =====
const SITE_URL = "https://www.locallio.ro";

const getRouteMeta = (cleanPath: string) => {
  if (cleanPath === "/adminAccess") {
    return {
      title: "Administrare Platformă | Locallio",
      description: "Panou de administrare Locallio.",
      noindex: true,
    };
  }
  if (cleanPath === "/payment-success") {
    return {
      title: "Plată Confirmată | Locallio",
      description: "Confirmarea plății pentru anunțul tău pe Locallio.",
      noindex: true,
    };
  }
  if (cleanPath.startsWith("/manage/")) {
    return {
      title: "Gestionează Anunțul | Locallio",
      description: "Administrează-ți anunțul publicat pe Locallio.",
      noindex: true,
    };
  }
  if (cleanPath === "/" || cleanPath === "" || cleanPath.startsWith("/ad/")) {
    return {
      title:
        "Locallio – Piața Producătorilor Locali din România | Produse Artizanale & Ecologice",
      description:
        "Descoperă și comandă direct de la producători locali verificați din România: brânzeturi, miere, legume, conserve și produse artizanale, fără intermediari.",
      noindex: false,
    };
  }
  return {
    title: "Pagina nu a fost găsită | Locallio",
    description: "Pagina căutată nu există pe Locallio.",
    noindex: true,
  };
};

/**
 * ROOT APPLICATION COMPONENT
 * Handles routing, global modals, notifications, and shared state like favorites.
 */
const App: React.FC = () => {
  // NAVIGATION: Uses hash-based routing (#/) to ensure SPA works across all hosting providers.
  const [currentPath, setCurrentPath] = useState(window.location.hash || "#/");

  // MODAL STATES: Controlled at root to allow them to be opened from anywhere in the tree.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false); // <--- Stare pentru modalul ghidului
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // SELECTED AD: Used when opening the Ad Details modal from the Home grid.
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // SHARED STATE: Favorites and Toasts are managed globally for cross-page consistency.
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // AUTO-POPUP GHID: Se deschide automat doar o singură dată la prima vizită a utilizatorului
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("locallio_has_seen_guide");
    if (!hasSeenGuide) {
      setIsGuideModalOpen(true);
    }
  }, []);

  // Închiderea ghidului din pop-up-ul automat setează bifa în browser
  const handleCloseGuideModal = () => {
    setIsGuideModalOpen(false);
    localStorage.setItem("locallio_has_seen_guide", "true");
  };

  // INTERCEPTARE LINK: Deschide automat anunțul ca Pop-up, compatibil și cu ID și cu SLUG
  // INTERCEPTARE LINK: Suportă link-uri de Share (#/ad/slug), dar și link-uri din email (?adId=id)
  useEffect(() => {
    const checkDirectAdLink = async () => {
      let adParam = "";

      // 1. Verificăm mai întâi dacă avem link de tip EMAIL (cu query parameter: ?adId=...)
      const urlParams = new URLSearchParams(window.location.search);
      const emailAdId = urlParams.get("adId");

      if (emailAdId) {
        adParam = emailAdId;
        // Curățăm URL-ul din browser ca să arate frumos în formatul SPA standard cu hash
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else {
        // 2. Dacă nu e link din email, verificăm dacă este link normal de Share (#/ad/...)
        const path = currentPath.replace("#", "");
        if (path.startsWith("/ad/")) {
          adParam = path.split("/ad/")[1];
        }
      }

      // Dacă am extras un ID sau un Slug prin una dintre cele două metode, căutăm anunțul
      if (adParam) {
        try {
          const activeAds = await fetchActiveAds();

          // Căutăm în baza de date fie după ID (UUID-ul din email), fie după SLUG (din share)
          const matchingAd = activeAds.find(
            (a: Ad) => a.id === adParam || a.slug === adParam,
          );

          if (matchingAd) {
            setSelectedAd(matchingAd);
            // Sincronizăm URL-ul final în formatul curat și corect de share
            window.location.hash = `#/ad/${matchingAd.slug || matchingAd.id}`;
          } else {
            console.warn("Anunțul din link nu a fost găsit în baza de date.");
          }
        } catch (error) {
          console.error("Eroare la încărcarea automată a anunțului:", error);
        }
      }
    };

    checkDirectAdLink();
  }, [currentPath]);

  // Când utilizatorul închide modalul manual (apasă pe X), curățăm URL-ul înapoi în homepage simplu
  const handleCloseAdModal = () => {
    setSelectedAd(null);
    if (window.location.hash.includes("/ad/")) {
      window.location.hash = "#/";
    }
  };

  useEffect(() => {
    // Initial load of favorites from client storage
    const saved = localStorage.getItem("miculproducator_favorites");
    if (saved) setFavorites(JSON.parse(saved));
    loadNotifications();

    // Event listener for backend changes to trigger notification refreshes
    const handleNotifUpdate = () => loadNotifications();
    window.addEventListener(
      "miculproducator:notifications_updated",
      handleNotifUpdate,
    );

    // Outside click detection for the Notification dropdown UI
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener(
        "miculproducator:notifications_updated",
        handleNotifUpdate,
      );
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    const data = await fetchNotifications();
    setNotifications(data);
  };

  /** Global feedback system for user actions */
  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /** Handles the addition/removal of ads to local wishlist */
  const handleToggleFavorite = (id: string) => {
    let newFavs: string[];
    if (favorites.includes(id)) {
      newFavs = favorites.filter((fav) => fav !== id);
      addToast("info", "Eliminat de la favorite");
    } else {
      newFavs = [...favorites, id];
      addToast("success", "Adăugat la favorite");
    }
    setFavorites(newFavs);
    localStorage.setItem("miculproducator_favorites", JSON.stringify(newFavs));
  };

  /** Centralized navigation handler */
  const navigate = (path: string) => {
    window.location.hash = path;
    window.scrollTo(0, 0);
  };

  /** Syncs internal state with browser URL changes */
  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash || "#/");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // ===== SEO: meta calculată pentru ruta curentă =====
  const seoCleanPath = currentPath.replace("#", "").split("?")[0];
  const seoMeta = getRouteMeta(seoCleanPath);
  const seoCanonical = `${SITE_URL}/${seoCleanPath === "/" ? "" : seoCleanPath.replace(/^\//, "")}`;

  /**
   * ROUTER SWITCH
   * Determines which page to render based on the URL hash.
   */
  const renderRoute = () => {
    const path = currentPath.replace("#", "");
    const cleanPath = path.split("?")[0];

    // Home Route (Observă că randăm Home și când suntem pe calea de /ad/, asigurând fundalul corect)
    if (cleanPath === "/" || cleanPath === "" || cleanPath.startsWith("/ad/")) {
      return (
        <Home
          onNavigate={navigate}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onAdClick={(ad) => {
            setSelectedAd(ad);
            // Dacă anunțul are slug, punem slug în URL, altfel punem id-ul standard
            window.location.hash = `#/ad/${ad.slug || ad.id}`;
          }}
          favoriteIds={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToast={addToast}
        />
      );
    }

    // Platform Administration
    if (cleanPath === "/adminAccess") return <Admin onNavigate={navigate} />;

    // Post-checkout landing page
    if (cleanPath === "/payment-success")
      return <PaymentSuccess onNavigate={navigate} />;

    // Seller Management Route: #/manage/ID/TOKEN
    if (cleanPath.startsWith("/manage/")) {
      const parts = cleanPath.split("/");
      const id = parts[2];
      const token = parts[3];
      if (id && token) {
        return <ManageAd id={id} token={token} onNavigate={navigate} />;
      }
    }

    // RUTA PENTRU DONAȚIE
    if (cleanPath === "/doneaza") {
      return <DonationPage />;
    }

    // RUTA PENTRU CONTACT
    if (cleanPath === "/Contacts") {
      return <Contact onAddToast={addToast} onNavigate={navigate} />;
    }

    // Aceasta rămâne ultima, pentru pagini inexistente
    return (
      <div className="p-24 text-center animate-fade-in">
        <h2 className="text-4xl font-black text-stone-200 mb-4">404</h2>
        <p className="text-stone-400 font-medium mb-8">
          Pagina nu a fost găsită
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-emerald-600 font-bold uppercase tracking-widest text-xs border-b-2 border-emerald-100 pb-1"
        >
          Înapoi la Acasă
        </button>
      </div>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col font-sans text-stone-800 px-5">
        <Helmet>
          <html lang="ro" />
          <title>{seoMeta.title}</title>
          <meta name="description" content={seoMeta.description} />
          <link rel="canonical" href={seoCanonical} />
          {seoMeta.noindex ? (
            <meta name="robots" content="noindex, nofollow" />
          ) : (
            <meta
              name="robots"
              content="index, follow, max-image-preview:large"
            />
          )}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Locallio" />
          <meta property="og:locale" content="ro_RO" />
          <meta property="og:title" content={seoMeta.title} />
          <meta property="og:description" content={seoMeta.description} />
          <meta property="og:url" content={seoCanonical} />
          <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seoMeta.title} />
          <meta name="twitter:description" content={seoMeta.description} />
          <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />
        </Helmet>
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-stone-100 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:my-0 sm:px-6 lg:px-8">
            <div className="flex min-h-[104px] sm:min-h-[116px] py-3 justify-between items-center gap-4">
              {/* BRANDING */}
              <div
                className="flex items-start justify-center cursor-pointer group min-w-0 pb-4 sm:pb-5"
                onClick={() => navigate("/")}
              >
                {/* LOGO PENTRU DESKTOP ȘI TABLETE (image_1.png) */}
                {/* Este ascuns pe mobile (hidden) și vizibil de la 'sm' în sus (sm:block) */}
                <img
                  src="data:image/png;base64,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" // Înlocuiește cu calea reală către image_1.png
                  alt="Locallio Logo Desktop"
                  className="hidden sm:block h-16 w-auto object-contain transition-transform group-hover:scale-102"
                />

                {/* LOGO PENTRU MOBILE (image_2.png) */}
                {/* Este vizibil implicit pe mobile (block) și ascuns de la 'sm' în sus (sm:hidden) */}
                <img
                  src="data:image/png;base64,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" // Înlocuiește cu calea reală către image_2.png
                  alt="Locallio Logo Mobile"
                  className="block sm:hidden h-11 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </div>

              {/* NAVIGARE / BUTOANE */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* BUTON GHID */}
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="text-base sm:text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-emerald-700 bg-stone-50 hover:bg-emerald-50/50 p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-stone-100 transition-all flex items-center justify-center min-w-[40px] h-[40px]"
                  title="Misiunea Locallio"
                >
                  <span>📖</span>
                  <span className="hidden sm:inline ml-1.5">
                    Misiunea Locallio
                  </span>
                </button>
                {/* BUTON CONTACT (Navighează la pagina/formularul de contact) */}
                <button
                  onClick={() => navigate("/Contacts")} // Pune calea exactă pe care o folosești și în footer
                  className="text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center"
                  title="Contact & Support"
                >
                  <span>✉️</span>
                  <span className="ml-1.5">Contactează-ne</span>
                </button>

                {/* CLOPOȚEL NOTIFICĂRI */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-all border border-stone-100/40 bg-stone-50/30 relative flex items-center justify-center w-[40px] h-[40px]"
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-xl shadow-stone-200/50 z-50 border border-stone-100 animate-scale-in">
                      <div className="py-3 px-5 bg-stone-50/50 border-b border-stone-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        <span>Notificări</span>
                        <button
                          onClick={async () => {
                            await clearAllNotifications();
                            loadNotifications();
                          }}
                          className="text-emerald-600 hover:underline"
                        >
                          Șterge tot
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-stone-400 italic">
                            Nicio notificare momentan.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-5 py-4 border-b border-stone-50 text-sm cursor-pointer hover:bg-stone-50 transition-colors ${!n.isRead ? "bg-emerald-50/30" : ""}`}
                            >
                              <p className="font-bold text-stone-800">
                                {n.title}
                              </p>
                              <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BUTONUL ADĂUGĂ ANUNȚ */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-[40px] px-4 sm:px-6 text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest rounded-xl shadow-sm text-white bg-stone-900 hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center"
                >
                  <span>Publică Anunț</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow">{renderRoute()}</main>

        <footer className="bg-stone-50 border-t border-stone-200/60 pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              {/* COLOANA BRAND (Stânga) */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-black text-stone-900 tracking-tight">
                    Locallio
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    powered by{" "}
                    <a
                      href="https://www.artcllick.ro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black tracking-wide bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent hover:brightness-110 transition-all duration-300 border-b border-transparent hover:border-orange-500/20 pb-0.5"
                    >
                      Artcllick.ro
                    </a>
                  </span>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
                  Susținem producătorii locali prin tehnologie intuitivă,
                  conectând gospodăriile autentice cu consumatorii moderni.
                </p>

                <div className="flex gap-4 pt-1">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61590795770947"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all"
                    aria-label="Facebook"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/locallio.ro/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all"
                    aria-label="Instagram"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0 3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all"
                    aria-label="LinkedIn"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* COLOANA NAVIGAȚIE (Centru) */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                  Navigație
                </h4>
                <ul className="space-y-3 text-xs text-stone-600 font-medium">
                  <li>
                    <button
                      onClick={() => navigate("/")}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      Acasă
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsGuideModalOpen(true)}
                      className="hover:text-emerald-700 transition-colors text-left"
                    >
                      Misiunea Locallio
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/Contacts")}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      Contactează-ne
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsTermsModalOpen(true)}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      Termeni și Condiții
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      Confidențialitate
                    </button>
                  </li>
                </ul>
              </div>

              {/* COLOANA CONTACT (Dreapta) */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                  Contact Platformă
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Ești producător și ai nevoie de suport tehnic?
                  <br />
                  <a
                    href="mailto:micuproducator@gmail.com"
                    className="text-emerald-600 hover:underline font-bold"
                  >
                    micuproducator@gmail.com
                  </a>
                </p>
                <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest leading-loose">
                  Made with passion
                  <br />
                  for Romanian heritage.
                </p>
              </div>
            </div>

            {/* FOOTER BOTTOM BAR */}
            <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} Locallio. Digitalizing
                Tradition.
              </p>
              <div className="flex gap-6 text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">
                <span>Sustenabil</span>
                <span>Local</span>
                <span>Transparent</span>
              </div>
            </div>
          </div>
        </footer>

        {/* MODALS */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Publică un Anunț Nou"
        >
          <CreateAd
            onNavigate={navigate}
            onClose={() => setIsCreateModalOpen(false)}
            onOpenTerms={() => setIsTermsModalOpen(true)}
            onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          />
        </Modal>

        {/* MODAL GHIDUL PLATFORMEI */}
        <Modal
          isOpen={isGuideModalOpen}
          onClose={handleCloseGuideModal}
          title="Misiunea Locallio"
        >
          <GhidContinut />
        </Modal>

        <Modal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          title="Termeni și Condiții"
        >
          <Terms />
        </Modal>

        <Modal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          title="Politică de Confidențialitate"
        >
          <Privacy />
        </Modal>

        <Modal
          isOpen={!!selectedAd}
          onClose={handleCloseAdModal}
          title="Detalii Anunț"
        >
          {selectedAd && (
            <AdDetails
              id={selectedAd.id}
              initialData={selectedAd}
              onClose={handleCloseAdModal}
              isFavorite={favorites.includes(selectedAd.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedAd.id)}
              onAddToast={addToast}
            />
          )}
        </Modal>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </HelmetProvider>
  );
};

export default App;
