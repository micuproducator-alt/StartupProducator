import React, { useEffect, useState, useRef } from "react";
import { Home } from "./pages/Home";
import { CreateAd } from "./pages/CreateAd";
import { AdDetails } from "./pages/AdDetails";
import { ManageAd } from "./pages/ManageAd";
import { Admin } from "./pages/Admin";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { PaymentSuccess } from "./pages/PaymentSuccess";
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
// import DonationPage from "./components/DonatingPage"; // Ajustează calea în funcție de unde ai salvat fișierul

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

    // 🚀 EXACT AICI ADAUGI NOUA RUTĂ PENTRU DONAȚIE:
    if (cleanPath === "/doneaza") {
      return <DonationPage />;
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
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-stone-100 w-full">
          {/* Am păstrat px-4 pentru o aerisire corectă stânga/dreapta pe mobil */}
          <div className="max-w-7xl mx-auto px-4 sm:my-0 sm:px-6 lg:px-8">
            {/* Schimbat h-20 în min-h și py-3 pentru a lăsa header-ul să crească organic pe verticală */}
            <div className="flex min-h-[104px] sm:min-h-[116px] py-3 justify-between items-center gap-4">
              {/* BRANDING (ACUM CU SPAȚIU GENEROS ÎN JOS) */}
              <div
                className="flex flex-col items-start justify-center cursor-pointer group min-w-0 pb-4 sm:pb-5"
                onClick={() => navigate("/")}
              >
                <img
                  src="data:image/png;base64,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"
                  alt="MiculProducator Logo"
                  className="h-11 sm:h-16 w-auto object-contain object-left transition-transform group-hover:scale-102"
                />
                {/* Subtitlul aliniat perfect sub logo, vizibil doar de la sm în sus */}
                <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.15em] bg-gradient-to-r from-blue-800 via-amber-500 to-red-700 bg-clip-text text-transparent mt-1 transition-all group-hover:opacity-80 text-left">
                  Gust autentic, de la oameni gospodari
                </span>
              </div>
              {/* BUTON DONAȚIE */}
              {/* <button
                onClick={() => setIsDonationModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wider"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 h-5 animate-pulse"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                <span className="hidden xs:inline">Susține-ne</span>
              </button> */}

              {/* NAVIGARE / BUTOANE COMPACTE ȘI ALINIATE */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* BUTON GHID (Doar iconița pe mobil pentru a lăsa spațiu ecranului) */}
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="text-base sm:text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-emerald-700 bg-stone-50 hover:bg-emerald-50/50 p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-stone-100 transition-all flex items-center justify-center min-w-[40px] h-[40px]"
                  title="Ghid Platformă"
                >
                  <span>📖</span>
                  <span className="hidden sm:inline ml-1.5">
                    Ghid Platformă
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
                  <span>Adaugă</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow">{renderRoute()}</main>

        <footer className="bg-stone-50 border-t border-stone-200/60 pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              <div className="space-y-6">
                <span className="text-lg font-bold text-stone-900 tracking-tight">
                  MiculProducator
                </span>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
                  Susținem producătorii locali prin tehnologie intuitivă,
                  conectând gospodăriile autentice cu consumatorii moderni.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
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
                  <a
                    href="#"
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
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
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
                  {/* BUTON ADĂUGAT ÎN FOOTER */}
                  <li>
                    <button
                      onClick={() => setIsGuideModalOpen(true)}
                      className="hover:text-emerald-700 transition-colors text-left"
                    >
                      Ghidul Platformei
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

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                  Contact Platformă
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Ești producător și ai nevoie de suport tehnic?
                  <br />
                  <a
                    href="mailto:suport@miculproducator.ro"
                    className="text-emerald-600 hover:underline font-bold"
                  >
                    suport@miculproducator.ro
                  </a>
                </p>
                <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest leading-loose">
                  Made with passion
                  <br />
                  for Romanian heritage.
                </p>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} MiculProducator. Digitalizing
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
        {/* <Modal
          isOpen={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          title="Susține Platforma"
        >
          <DonationPage />
        </Modal> */}

        {/* MODAL NOU: GHIDUL PLATFORMEI */}
        <Modal
          isOpen={isGuideModalOpen}
          onClose={handleCloseGuideModal}
          title="Ghidul Platformei Locallio"
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
