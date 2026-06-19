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
                {/* Subtitlul aliniat perfect sub textul din logo */}
                <span
                  className="hidden sm:block text-[13px] mt-0.5 pl-1.5 transition-all group-hover:opacity-80 text-left italic font-normal tracking-wide"
                  style={{ fontFamily: "'Lora', serif", color: "#8a7a5a" }}
                >
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
