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
                {/* LOGO DESKTOP & TABLETE */}
                <img
                  src="data:image/png;base64,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"
                  alt="Locallio Logo Desktop"
                  className="hidden sm:block h-16 w-auto object-contain transition-transform group-hover:scale-102"
                />

                {/* LOGO MOBILE */}
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAAc80lEQVR4nO2deUCUxf/HP3vCwsJyQ8qlgiAIIiqK4ZVimoq3kGZqmWZppmmpleQVHmn60zQNzzQxSdP0i2coIipyK3Iv9y3LuQvs9fz+UIlj93lmkeuRef2lz8x8nmEZ3jvzmc98hkEQBGAwGAwdYHZ2BzAYDAYVLFgYDIY2YMHCYDC0AQsWBoOhDViwMBgMbcCChcFgaAMWLAwGQxuwYGEwGNqABQuDwdAGLFgYDIY2YMHCYDC0AQsWBoOhDViwMBgMbcCChcFgaAMWLAwGQxuwYGEwGNqABQuDwdAGLFgYDIY2YMHCYDC0AQsWBoOhDViwMBgMbcCChcFgaAMWLAwGQxvYnd0BDKa1PK8s84rJiDsYJ4x3iRUmwPujZpf6DJ1k1hpbcoWcn5Sb8m1sRvy62Iw4qJXWwo6Protk1hpbcoWcn5Sb8m1sRvy62Iw4qJXWwo6Prot"
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 00-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9"
                      />
                    </svg>
                  </button>
                </div>
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
                      Contact & Suport
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
