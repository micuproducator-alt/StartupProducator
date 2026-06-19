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
                className="flex flex-col items-start justify-center cursor-pointer group min-w-0 "
                onClick={() => navigate("/")}
              >
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAAydklEQVR4nO2dd1hUx/rH3+0s7LL0LkoTREEQAxprVIxejUZjboxGY2Kuufoz5SY3iV5zTfWamKaxxZJoNPYKiigIgnSUXqT3uo3tfXd+fyxL3YauMeD5PI/PI2fmzJlzzuz3zLwz8744hBBgYGBgDAfwT7oCGBgYGOaCCRYGBsawARMsDAyMYQMmWBgYGMMGTLAwMDCGDZhgYWBgDBswwcLAwBg2YIKFgYExbMAECwMDY9iACRYGBsawARMsDAyMYQMmWBgYGMMGTLAwnggIIYJMIXN71HJUahVNqVIyhnqeQqVwUGvU1Ee9PsafC/FJVwDj6UClVtEqmiu3FNQVb8uvLYCC2iLQaDQQ+9nFcDsbRqG55UjkEu+iupIfCuuKV+TVFEBJQxlMGB0Mv75/EGfqXKFUFHg4/teKm3mJ0MljAh6Hh6BRY2H17JUdL0T9zf2RbhDjTwETLIzHgj5hkSqkg/KZ6h2xBZzpBbVFewtqi8LyawugsqUa1Bp1vzxMPstkfVh89qw3fno7pYnV3HNMgzRQ3lQB20587lZUX4I+XfmJSdHDeLJYRLDSyjLjM8uzFjzs+YsiF+6YMDr4U0vUBePJgRAifHdpt8qQsOiDTCRzBx5r47QvOXjjSExBbRH0FRgjZZjMs+PstynGyjqfdgmmB09NmR06c7bJwjCeGBYRrAmjx31a31G/4Ozdi9DCbjX7PFc7F1gzZxX4uI751RL1wHjyPDM2Il0kE02vaKkyKz+FRB7UPbK1ppc/MzaC1dHV4WyWYJFIRtMFEkFwSkmayXKu34ufNTt0psl8GE8Oixjd7Wn2eWvnrsZd+fSsS5hvqFnnBHmNhav/Pee7du4qnI2Vdb0l6oHxZMHhcOrnQmfO+PK1/+I+feUT090r0N/DolFpNUuiFrkcefcA7m+TnzenDKPp7dyORRqkMVlOK7vNZB6MJ4tFZwkpJArr5enLO8zJu/q5lVwbKxtMqEYoiyMXeuFwxk1CRAIB8Hi8wkQ5caauZUqw6Na2labK0Oajm5MN4wli8WUNHo7usebkG+PifdzS18b462BFtuogE40P1Uhm2J5srenlpvKYEiwPB7dYP3dfk9eaFjzVZB6MJ4vFBYtEIPHNyUcmUQYNBTBGGsZ7WOYYy02VAQBAJpkuZ+vL/z5JJBg22fp7+MLfZ7zkZUaFMJ4g2MJRjCeGqR6YuVDMEL7IwMlr92/86aKHw+DlVjPGT4Mj7xx4lkq2Mn/GCOOJgK3DwnhiGOvxDAUCgWBWvqnjol6+/vklWlF9yQ9NrOZVZAKZO370uM/GuI4+bpGKYDx2MMHCeKogEoiiCP/wtyP8w99+0nXBGDrYkBADA2PY8FT3sEQysX9de/2GLjEvQiwT+5AJJC6NSqvxdPS44unkcQWPMz7lbkmEUmFgXXv9Bp6YHyaWS3yIeIJIVxcvJ8+LBDxh8L6WR0CqkHo2MVtWsfisWWK5xEelUtHIJBLXzsau0Nt51GlXe5dES17vr05NW93mMa7ex4kEouhRy+KJ+WH1HQ3r+WJBiEQu8aaQKSy6Fa1ylIvXOTc715s4HM6sNWoYg3nqBKukoWznzbzELamladDMbAEECAh4AjBsbEGmkPtI5JIIAHiFSqFChH84zJk4S70wYn6ApdeMIYQIWQ9yLiQVpyzLKMuCNm57T5qHozs40h2AI+SGtHHal9lY2ZyIHDsZlk5ZnDU7dMbshxFSlVpFy67IPXun+O6ie9V50MhsAoQQ4HA4IOAJoFKrAAC8ASAMANY52TrC9OCpsOzZpfvC/Sa+Y6n7/quAECKUNpZ/nVR4Z8vtwjvQxGqGfy9/b+/auauHvJ8QIUTIqbx3KrEg+ZW0sgzo6OoEAAASgQS21nQQyyU+MoUsEgDW0Kl0mBL0DMyZOLspOmxOOJk0eOEshmGeGsHKqyk4tO/aLxvyagp6jnk5ecL7SzeXzJgwbaFuhqiuo37DscSTh2Kyr0N6WSakl2USfrqyt27lzJfhrefXeVEp1EeaSdIgDflq1jXescST1EZmU89xEoEEa+a8CitnvbzQzd71pu74oRtH0f64w3CnOBXuFKdODfQaK9/+6tZvQsaM32rO9dQaNfVi+hXJ0YTfobP7hwQAQCGR4ZMVH6oXRy70opAorJr22s17Yw/u1m1hYQs4cDX7OlzNvr55WvDUzdtf3brY3cHN5CLOvzIajYacX1t4IKkwZX1S0Z0eYdGhUA29Q51clJp5MO7w1MrW6p5jQV6B8O7STXFRYyevJhFJfIQQobypYvsv8Ue3p5akQWJBMiQWJHv/YLuH8/rc1bD6uZV0S/TsngZGvA1LppC5fXl6J3rzp3/2E6vRLqPgzMfHQ+dPmhvadzrb183n8FdrtuM2LdrQk1coFcGRW8dg2Y6VLfer848+bF1q2mo3v/bdm/LPT+3oJ1a21nQ49q9D373/4mZcX7ECAFg1+5Wgvn9XtlTB2h/e2nIlM1Zo6nosPnvWuh83SHac29VPrAAA3nlhE6yYvoxoRbbqwOFw6gAP/z0/bdhlPTlg0qByMsqzYOW3a68/aKrYNsRbfuKo1CpaRnl2zJend6K5//mb/M3d/1x/KuXsILECACASzF9mwRPzw/51+GP0/uGP+olVuO9EOPnvoy7Tg6cuJhG1axJxOJx6/Ohxn/389vfEF6e+0JOXLeDAD1d+hpXfrhVWt9a89yj3+bQwogWLI+BOXb9nY/vFjCuAAPVL2/bKJ+cYNowSQ+f+Y8Eb1j5uY/oda+O0w4a9m9fHZF/nDLUutwvv3H/t+zf3ljb2X7iNx+Hhh7e+OR3qM+FjfefRremVBHz/aXu1Rg2fn95BSy5KyTR0vS4RL2LdjxtSiuoH3yKRQITl05YGDDxOwBOkmxZt0LsRvUvEg00H3v+aLeBMN3TNvxrXc+NbZm95Xrhx/7tLLmZcAY7Q+OiLZOYyiyZm86rXvnuzIKkopd9xAh4Pn6/e9haFRNHr7waHw6k/WfGBr51Nf486Va01sPbHt3ZnlGfFmFWBp5gRK1himdjnn/veySxpKBuU5uM6BqYERa40dj4BT5C+PH35oOMqtQq2//GVw828xApz63Ir/3bZv49ujZDIB9vNlz27BKICn1lt6FyZQuamz00LQgi+OP2/qQKJIFjfed9e/OF+M7tFb5l+bj5As7Kp0Zc2yS9sk42Vjd7zOEIu7L66z7Tbg78I8yfNC92/8acfl0YtNis/wQzB6uQxo9fv2XhKnxeJKYFR4ONm3POIjZVN/eKovw06LpZJ4L1DHy3Jryk8YFZln1JGpGAhhAifHPtvXd+uel9mh84wq5zZITNeNlA+fHrii8CKlqotpsrIry08sPX49mB93gJwOBy8Of91o8IpkAj1ChKAttdzMf3qIEXmCLlT4+8nGCxzYM+xL3g8XuHn5mMwPe7eTWDyWHMMZvgLQSaSuBN9Qz/8au12XOTYySbzkwhEo0YspUrJeOeXDxM6eUy96ea2q1kTpp/Wd1yhUsB7h/69kcljDovn+yQYkYIVk32dc7c03WD6RJ/QLHPK8XLyvOho66g3TaFSwPaTX+5UqVU0Q+cLpaLArce3b+yegRtEmG8ojHLyPGesDqamwFNK7g46VlRX/ANCSE9uLaOcjG+Zc7FzMZim1qghuSglyWgBf0Em+YebzGPK8H3k5jFeRbNhxw8TfUPNmggJHTPhYzxO/0+PLxHAV2e+GXbP989ixAmWVCHz/OnqPqNud/3dffeZW56/kV3+FS1VEJsTp/9zCwD7rh2saOca9rZjjncAB5p9LsmIMVifw0ShVBRorMzRrt5GfQrTqPqHhDr6Tl4MF6zIFJN5jAlWJ48Z/Wvi7wbPxePw4Ovmc9iculAp1FZPR8Mu5FNL0yG7IvesOWU9bYw4wbqccbWlS9RlMB2Hw5ntAgcAwMPRw2j6bwknqBqNZtDu204eM/pi+hWj54aOmWC0dwUAQCAQpBH+YQbT9Xkq8HT0MHhhEoEIzwZFDTbO9ctjfLaspr3OaPpwxZinkRO3TyUoVUqD5zoznIBMJJm9pspUuzqacPwVc8t6mhhxgnUl65rRdIY1w2TXvy8uDCej6U2sZiisL9498PjlzJgEpYGhoA4/d9+D5tTh9XmvGRTYZ8dNGXRskn/Ypgmj9Zu+1s1bA04MJ8PjZdCKujFYZgR9GI4Q8Hi9uwnUGjX1Wu4No+caMh0YwtlEu8qtvA8dXZ0PHSdhpDKiBKuV07asyoChXQfDxnZIZZqT/07x3Y0DjyUWJBs9h0wkg5Oto1Hh0DEteOrSzYv/OUhIgrzGwrsvbBxknMHj8Ir9m36avCAiuseFiyPdAT5Y9i5sfuGfj7xYWN9s50gmv6bwAE9s3M0bw3po7Wrg0gZ9pBTfjR9SoU8BI2qle0Ft0V5TeWgGpuwNYWNlIwIAg4Z1AIDCuqJ+f3eJuiJq2mqNlutIdzBpUO/LhoVv4p6bOPO99PKs3XKFHAI8/HNnhUyfa6i3aE+zz9v15g6cUq1kSOVSTzqVXmmpPWyGJhFGKoV1xetM5TFl9xuU38pok9JdF1bO0jtR/dQyogSrpr3W01QeK7LVkMq0Ill1AIC/sTy17fWAECLoBKGi2fRyBxrVdIMdSICH/54AD/89QzmHRCDxSdbmeYHF0E9Vq94la/2gkocWRNqcSYCaduMfvaeRkTUkNCPqCWmIXi512yuMIZKKQCQV9YhaC6d1halzKGa49f0z0SANuZHZtCaxILmg0swQXU8LbdzH0q5M5jE2w/y0MqJ6WCKZ2GSegdtcTEHEE8wy0ItkYn+6Nb0SAIAvFli8HpYEIUSo72xcX1BbuLe0sZxc0VwJtR31IFPIgEalARE/oprFIyOSWr5dmZNfLJP067ljjDDBkivlJvPgTcyADcTcxiJTyNx0/zc2/a1DZUZUZEuCECLk1RQcis9LWJ9akgZMnnamj4AnwJyJs2Dt3NU1E0YHf+rl5Hlxx7ldqvNpl/7U+v2VMaddmZpZfZj8GqQBpVrJ0Be78WllRAmWFcm0fcrYCnAD+c36dFpRqD39d3OGe9I/aaZNpVbRruXcaD92+yStobOxX9rs0JnwyYoPlhtbt4Vhnr0Jht6uTOYh4AlmR6F6WhhRgmVjZW0yj1pjOgLwgPxmWVNpVtY9lllriul6dIl4Q6rHw1DRXLll28kvdlbrMRr/3+K34e2F64fsrO5pxNBm8L4MtV1pzMhvTaEOaSb5aWBEGd09nUxOEoJSbXq4NiC/yQUzdCoN6FR6zyYzJ4ZTnqlzukRdIJFLvIdUmSGQWJBc8Nr36/WK1bKpS/4SYoU0Q+uVGCxniL2boeJpYlU6AIBCPTTnf+a0Q3c9Icmedoa1YDWzWl5h89k9/pl83caYXIItVciGdI2+tilDDPR+YO5exarWmg+GVBkzyXyQffnj37aF6fOgSSFR4N0lG599HNcdKhoYWq/EYDl6PGFYEnOiRsvkQ21Xpu1ivka8ZjytDGvB2nFu19n6zsb1ur/DfU37HhebMePTL79MbLKHNdEntN/fo5y9zpmzzqqgtsjiXiaFUlHgf37/fJk+H1oAABH+4eBo62iWt4rHzXDpYU30CTG559OcGer++U1PPk/0DRlSmU8Dw1awKlqqtmQ+yAZrK+seX8OjnL3OjXYxPsoSSEwvOegL34z8M8Y/269BE/AE6Yzxpjsxd4oHu4Z5VC5nxlRwjXjWDPIaa/FrPiyW6hlpHrNgRfiHv23KLmlOO+mLqa0+AAAzxj9r0LGjWsSeLkg/ijiXP0Hc2O1IXBTDQWaYL4Y7w1awjiee3Amg9eDY9/gLkQuNnscT80GtVpu9LJnFZxtNd7VzgckBk94aePz5SfNM9mIK64qgtr1u0D7ERyGz3PhlH2aF/ePCUj0j9JiHhCQiif/8pHlG83AEQ/OazeYbzx8yZgJ4O4/S6+hPUp5Q3Prj7LSu+B0gyjsPwpyTwD7/vkP7vkU8JadxzZAqMswYloLVym5bdiv/NgAA0CjW/azKL894aTKFZHgaWoM00N7Vscjca7Vx2o2mvzrr73q9P8wOnTnbx3WMyfL3Xz/00C5xNRoN+eitY6ivE0GO0LBrHQAAqeKvs3HZYj0sCw0tjfHanFffN5bO4rPBmDPHgfQN66aPtXNeLdd3XN5SvIt1dnMIkg8egiqZ1cA8/voJjVw8Yo1fw1KwTiSfuqyz0QzsYdnT7PLeiDb+kaltrze7V1PXYTgcobuDG7w662W97jvxOLzi3SUbc02Vf7vwDty4d3PIDqYQQoSd57+TZ5Rn9xNMa4rxzmNli3FvFn8mAwODPHQ5j3lICAAQ4OG3Z0mU4e+cWqOGhs7GdeaUJVfKnfU5XtQxYXQwRIfP1esilXf7+4/AyAyjitsIwpw/RqbDMhiGgsXis2ddztS6h8Lj8GBFthq04Wr9/HUuvkb8lhc3lJjlM7ujq3OBIf/dOMDBtlc+STQWp3Bu2HNRz0+KNnmd7X987XO7IPm+OXUC0Db4bSc+V51PvwzvLdnUbzP0GJfRRs/Nqsgx6pO9hd26IrfKdFXEskf/ilvO6P54h4Q6Plj2bpQD3d5gelF9yQ/mlFPaWP61oUkREpEE21dt3YrHDw6WizRqqqwu22T5supUc6oxLLG4YKk15tuHHoY9MftTdFslDC2so5DIrD1vf7/W1oCPotQSs9xQwd3SDIP+iDYu+gfMnDBtvqkyPl/9H19Thm6FSgEfHN0Sse3EF8jYV1qDNOSUkrSUv+9cw7yeGw9vzFsDYX4T3++b59ngKYadjoN229DHv21LEknF/TxQIIQIsTlxzL9/s+YCT2TaIJxakm7S77gpIVFpTLupQUhjcqeBOeWYs1BTgwZ7ju2LA90+d/eG7/aQDWxcvluabtaO9rTSzA2G0j579T+sIK/Ab/SlIaXU01jvSodGOrQJgOGExVe6t3Hbl1i6TB1JhXdyYnN6gw9bG1mBPNrF++Qvm38O/L8D728buKq8qrUaCuuKd4f5hr5v6HyEEOFihv4dK6/PfQ3eXrjerGdnY2VTv3/T7tkb97+XYsq54LWcOLiWE3fM3933WPDoceDKcAEigQgSuQSa2S1QWFsM3G73z9Hhc2HzC/+kDyxj7sTZUR4O7jxjNpL82kJ48au/V7849QXwdPIQsfkcWmJBElS0VMHUcVHw8UsfbFq+Y+UBY0OtL8/s9GliNaMAD/9cAh4vjQycvNaa0jtjy+KzZylM7KmUyKUgkAiCba1t9dprAABaOe3LjBYCAO3cwUFRBzIwkKw+2HxOmKk8Yb6h7//4j2+D//3rf6JlA9b0pZVlQhunfYkxF9wyhcztWu7gANo4HA4+fulfsGTKIoMRQPAUWg2eagcaKc9oHYkOo0zdxrDFoj0skVTkf+rOOYuv3lapVbRLGVflW49vj+x73MbEVPOE0cGfnvzw19XjvccNSttx9tv3JHKpwbqeST2vGhghxYpsBZ+u3AIfLn8XN5QtE84Mp9QTHxwZPd/ETJOOmvY6iM2OgyO3jsHBG0fg96RTkFyU2iNWL09fBt++8ZXe8OYkIon/1drtx4kmYuwx+Sw4fPM3+OyPr2l7rx2EipYqeD5iHuz95w+Ofu4+Bxc9Y9w7r0QugQNxh+FfRz6OfP/Ix7NKG8q/7pt+5OaxFHPu9WLG4DBlOuRKufPJ5NMmh57VbTVQXF+6y1A6XywISSy8Y7IucfdumjVCmDlh+vzf3v9lh7dzf2FQqVXw1dmdMcbK2Hvtl/aBM892Ngz46R/fZq1+bqXJ3Qc2E5eaygI2YcsMBgge7uAsYbBs53YsupQZc/1SuunoujqCvceZNBADaL/CDZ0Net3yjh8dDGc+Pm7yJas1auqpO+ckxxJP9KvfWM8A+Oilf51+JmDSGzqbAVvAmf570qm0E0mneoy5OBwO5kycDR+8+M7KUc5eJhcRGiO1JC1pd8z+ObUPEchhlLMXfLDs3dy5E2dHmcqb+SD78ifH/ruMb8Z6HzwODxsX/QM2LHiTqBNioVQYuH7PpgpjYa0AtK6ed6z9vPz5iHnjAQCyHuRcOJ16boW5w248Dg8vz1gOiyMX/jjRJ+RDAK1QJRYkFxxLPOlZ3WbaeR6AdnvU+vmvw7zwOat1ywGYPNac24V3kk4mn4ZWjmmfVgAAk/0nwdq5q1Jnhkyfj8cNtiP1RaaQuR25dbz9TMr5fgtBnxkbAf968Z0d473HfaZ7ni3sthWH4o9eiMm+3pOPSCDCC5EL4d0l//eso62DWYt5NVJ+SPsvy4tVbP3txyZsGTit+IEII3QPokUEK7fq/om86oI/ff2Hh6M7d+mUxWZ7/5cr5c438xIrkgrvOGRX3gNdl55mRQNnhhPIlDLo4Hb2zF75uvnAnImzYHHk3972dRtjVggnc0AIETLKs2Li8xIWpZVmGF1ESCaSYUpQJCycPL/p+Unzxg8lgAZXyI08euv3nNic6yCQCAel43F4mBIUCe+8sPHL8aPHfTYwXSKXeB+MO9p4OfMqCKX9L0vA42FKUBR88OI77wd49npBPXrrODLHvc5AKCQyvDn/dRwAAJPPmnMp/epDxebzcR1duWDy/CCAR2uX6+e/7kgmmefWRSgVBcblxlckFaVAfk1hzz5Bhg0DHOkOIJKKgNkduAOHw8G4UYEwJ3QWLJmyeKGbvevNodZNLeZGcq9tz5GUxgN02wlxFBowZrwNtrM2UXB6DPYjBYsI1nBErVFTm1ktr9R3Nq4XSoSBErnEmUQkKawp1k1u9q43/T389tGpNOPdCwuAECK0cdqW1HbUb+wS8SIkcqkDhUSW0qi0mtHO3if93H0ODkWk9KFSq2jlzRXbGzub1ohkIjcKiSJ1YTgnB3uP+9KBbm9y6YVKraLVtNVuZvHZszRIQ2bYMEr83H0P/hnPZ7ihUqto9Z0N65uYzauEUlGgVCFlUEgUqQ3Fpt7D0T3W38N3H5VseGZ5KKglXREqVu1GIFJYZNfA73BPgd+sp1awMDAwhh/Dbh0WBgbG0wsmWBgYGMMGTLAwMDCGDZhgPeUolQoHIZ8baTqnfkSCrgilQu5syTphPFketU08Th6bYHHZ7YtyUmOZt67+ipLjTqLS/LsJIiEvrOjenbTHdc2RhljICzv/207E6mha9TjKv3XlKDq0611OQ03JzqGey2G2Los5vQcd+u69+wq5aa+sI5WU+NMoN+16y5Ouh6V4lDZhCEs+I4sLFkKIcDfhHLp66qfrTm6jzs1Z9JrL1OdeDFIq5c6/791aUFGSNd10KebT2Va/XiToirBkmcaorSjY+zjK7eJ0RnNYbf22NSnkUk92ZzPIpI/HXci8F9bRZTIx2Dm6Jg71XEcXzyvBYdN+JVOswIbOGLErq03BYbUCn8s0HUxgmPAobcIQlnxGFt9LmHH7oqqm/D6sevtzXyuq1vULiURhhUdFh5NIlISaB3mm3ReYCUKIcOfGqaMLl2+Ya6kyjdFUV769sjRns19QuElXzEMl686VhAnhM750dPbo2Ydm7+Qet2nrgccWLELAZ09HGg3Y2bskP8z5fC5zjp2Dq6WrNax4ae1HTzyYhyV51DahD0s+I4v2sLrYHQuy78ZC9NL1W3Vi1ZegkCkrKX1CcdU8yD9QVZZ7om8eLqt9UXtLbT9/VayOplWFObfvV5Rkn1UqFQ4AAC0NlR9dP79f1Vz/ANistiX11cW7BDy2wd6bRqOmNlQX78rPTiguvncnre81murKt5cVpF/XaHp36wt47OnN9Q+2AQBIJSL/wtyknGtn936hUauhvrp4V2Nt2Re6vCqVklFVlnuiICexoKO1bkNvGZypRfeSM6USYSCAthdVkJ1YwO5s6Qllz2xvXJN07XdUVpAGfB57en118S4uq22JTCr2Kbp3J43DbB20+ZffxZpVdC85szQ/LX6ovS+NRkNurC39uiA7obggOzEejyeADd2usG+ejpa6DQXZiQVVpbkn1CrDTun4PLYPw36w+UoiEgSXF2bE5GclFD8oyrwsEvLCjNVJIZe5VRRnXSjMuX3f0PC3o7V+fWFuUk5Bzu37dZWFu3XvSsjXPmOJWBAMoH2ehTm374u7rymViPyL7iVntjZVD/Kf/yjvDQCgpiL/QHXZvWPG7k0Hj8ucU5qXmpSfnVBcUZJ9tu8wGiENub67bTbUlH49MBamvvYPANBcX7HlQXHWBYQQQa1WU8uLMi9XlmSfRZr+XiekEmFgWUFafFFuUg6PyxzkWsicNiGXST0rSrLP5mfdKisrSIvXlYMQIlSX3z9aX128C0Br/yrNv5vQVFe+fajPyBwsKlil+anxdvYuMMonSK97DCKJzI1e+qadNu/dBFZn06qY03vWtPVpTCV5KddT4k/3eOHMz7pVdjfh3KnR/hM+1WjU1BP7t3E0Gg1Z90OlWtNAJhX5yyQif0Ouj7s4HQsu/f6dRK1WU8f4Tfi0rqpwelrC+QMAAA01pV831pZ+cfva8UWVJdlndefUVhTsvXHxl68BAFRKhQMeT5AqFDIgkSkglQgDFXKpJ4DW6Hz+t//xSGSrDndPv4MXjn1zqKo094RUIgzMunM580FR5tSsO1cr2ltqN+Zl3EiQSUX+Z458eUHXYGVSsY/WJzkO8Hi8QiYR+atUKlrqrTN17c010y+d+P5y33upLrt37Pa14ylunr6H6QyH3FO/fFYnl5kXLqyL07Hg1C+fybs4ndHefhM+JZLIYEO3gx7fSwgRkuNOoqrye4fGBIRsfVCcuSbm9O7Be3q6EfDYYGvv1O9Yyf2UlDvxf5Q5unhe8fAO2HPz8pFlTX3EfSAcZuuyc7/9r51IprCcXL0uxpzec6og53aPQy6lQu4ce3Yvam+ufs/bZ9wOmVTkf/X0T+/hcDi1TCr2yUy+kllRnD01I+lSWUN18a6aB/kHOlrrI66e3l0gEQuCM5MuVSONhnzu6Ne7hYJeQ/Kjvrey/LR4Vlvjmtize9c111dsMXR/CCFCSvxplJF0KcnJzfu0u6fv4Wtn977C43YsANAO+y8c/1bexelY4OkdsCc/69a26+f3q6BbtAy1/5oHeYea6sq+uHXlyIqWhgfbkq7/LtGoVbTM5CuvpCWe7wnJ09JQ+dHlEz9U0G0ds2ztnNLPHPkyqeZB3iGz2wQA1FUW7r5x8WCLLcMxa5TPuB3pty8uqCjOugAAkJd5s4LV2fzKpd+/+0gs5IdcO7uXU1aYHh179ucvzH1GQ8GigtXcUAGuHmOM5iEStZFsVSolI2rmEhccDgcSsfZLBgAglYrA2qbXj9W99BvBAeMmp9s7ut309gn+0tbOCZBGQ/YfN2mTnb0LMBxcYHzY9MXjJj673F7PuFulUjIu/f5d/JTZL271Cwp/x8HZI5ZIIoOdg9aLB4/bGT0j+u84ipU1SCWiHh9RMpnEm2qj9d5CZzjkjg+btlSlVEJA8OQ9wROnLQ0InvwWAMDNK0fuBwRPbvIJCP3Yzcv3sK2dE3S2N65pqi3fPnP+yiAX99EgEQugojj7wNwX1hHDoqLDZVIxcNlae5W3b/CXLm6jcq1t6DA+fMbCcROfXU6xoraODX7mR/9xkw6LBL27LURCXlj8lSPrFizfEOrqMeb4KJ9xO/hdLNDXCxuIWq2iXT75ffyEiJmFYZFzoxydPWKJRJKUzuj5YENFSc6pxtpSmBn9d6K9o9tNL59x5Z3tDQbLFAq4QKc79GzPaawt/fpeetysBcv+YefqMea4s9uocyqVEhgO+ocXGo2GHHv258tRMxef9A+atMlrTNA3UbNeSE2JPxWhE4bE2GNMJxdPafiU+aEOzh6x1ja25bYMJ8DhcOqmurIvpke/HOriPhqkYgF0tjeueXbOMnpQ6JRvmG2NUHI/JWXWwlV2YVHzJhOIRGC19/beHvW9KZVy56lzltHJFCqIBIZn1O5nxFe3t9TC31a8TXHz9PlV13OhWmvjWKbePNPi6OwBk6bMD3X18Pl1zqLX5lcUZ0Fjdw/FUPsX8DhTp819iWJFtYHS/LQvxgY/882ESTPnh0XNLSm+r/VMIZdJvGPO7Nk194XX3/L2C/7SZ+zED0MiZquTrp/YoO2VmW4THGbrsltXj763YPmGAA/vgD3Obt6nNWo1MOydUwG0v+dJU+aHIqSB3LRrxdPmvvTGirUf2a3Z+NVsc5/RULCoYImFfCAaCNOenRLDOffr/9DJA/9FmclXhGGRc6MEPPZ0hBDQbHu7n+zOFrC1693PPMZ/AqTcPDO9siTnFM3WPu/ldZ/gCETt3jqRsAvotg6DL9aHB0WZlwlEYr9eH7O9CRj2ziwAgLDIuVFqtYomFnb16wazO5sdbBm99RCL+CEACOgMh569d/wu1qz6qiLwHzf5LYVc5pZ++6JKIhbAhEkz5weGRK2m2tArhQIusDtbYHz4jNXaXoFWFAl99geKRYJgWp9GwrB3TvUZO/FDsYgf0vd4aV5qkrPrKLChaY3ceDxesfGTfUEe3gH9vI7qo/ZB/gGRoAtCI2bP1h3jsNqofZ9fYW7iKwHBkwEAoKG6ZGfu3evBUbOWGDSoiwW8fgb3zOQr20Imz24idH+UtAKBehr3QJrrH2zrYneAX+CkTbpjbp5+B1VKBbA6mlbxuJ3R5YUZEB4V3eMumNXRNFU3DB07PnKtDY1RIuRzgM1shfHhMxYCaHutZIoV0BkOuUQiia9WKRkKhRx09bLEewuLmjdZrVIy5DIx0Gwd9O7HRAgR7qVd95n87ILjuG7PD51tDesAAKxtbMuVCrlzaf5dCAh+pmfjuZ2Da6KVNQ06uk0Whtr/pKnzQwEApBIRKOQyGBMQshUAgGbrkCuViEClVDhUleaeIBJJ4Obp82vv8/U9LOCxQSzihZnTJnLuXrs8NvgZoFrTagAAJGJBsEjYBbbd7zQsat5kIZ8zFU/QjmJdPcYcJxBJfIa9c6o5z2ioWFSwiCQyCPn6919Omb3U0dqGDgQiEZ597kU7AABu96yYXfcXWC6TeDPbGsDWzqnnqz3/xbeIU59b2hR/6dCqi7/vQuI+9hCJWAA0W8MuawEAGqqL57h79TrXlIgEwVxWK9AZvbH5eNzOaI1G0/PDQkhDbq5/ALZ97DMSkdZGQqPb90R11tk9cu9eS0iI+bWdYeeUvv7979379vRE/C4gka3Axd37NIDWPgIA/V6gRCyg0Wh2g+rexe6Y6uDUG/23ranaQdcz1EG1oZu1AbmlsXKNs6t3z4+2uzzo+zXtbG2AloYKiLt4UNXcULHllTe3Lp00ZX6ovvIQQgSJWADW3eKpVMidWxurwM3L76AuT3NDxRYCgdgjsAPpbKtfb0O3A90HCACARKZ0uzXQDtcZ9k797rG5/gHY2vUfhgr5XKAzHIHW/cER8rmRcrkU/IIi3gYA4HWxZgFCQLfVvjtLvTcuu2MBQggcXTz0OuxjM1tWiEV8cBvV55nUP1hPplCBQCTx2Z0tK1Qq5SBBJ/UJomKs/ctlUk+VUgFePkE9DhBVSoUDnkAAApEo6mxrmDXwWfU8X8CpzWkTDdXF4Obl1+NxUDe0Y9j1/n6EAm6kRq0Gb9/xgwIIm3pGQ8Wis4SuHmOgsiQb5DKJN6VPvEAdcrkU3Dx9QeerR8jnRlKsrMGKqlXvmor8AyQypZ+Y4HA49TPTF40eOz5yVsyZPSkXjn9b8PrmHRQcDq+QScXg5uVnNAwMv4sF3n7je/6uLM05RaHaAM22V3h0jVEnnDqDoS3DsccZk0wq9sHhcGDV/aUB0NofcDgczH9xPdGQQz+hgANhkfN6VJzfxZxDsbLu+WJpyxaBbvjZFzazGRycemeD5XIpWFn397KKECKY40xQLOIDhdo74dHeXLNZoZCBNY3RoStHoZDB+Ekzk0MmzTI56yqTin00GnWPmAj4nKkIacDaptd7aGNNqY8N3V6vG2sA7Y9LPcAVjYDHno7D48HBySO2tqLgB6p173NhdTStkogEQGc49HvnQj4HJo1f0NSnDB9XjzFAsdJ6Rehity/C4wk9Q1NLvTcOs2UFhWrT7577ohMXq+5AKRqNhtzaWAnW3e9aqdQuuFWpeuMJqtUqmkTEBwdnzysAxtu/WKRdzjPGb8KnuvPZzJZlru5jAIfDKxRKOQx8vkI+ZyrVmgY2NNtyU21CrVIyxCJ+vw9GU23pGhweD9a03tGISNAVgccTYLTf+EEuikw9o6Fi0R5WeNS8d1RqFdy9da5RX7pCLgOKlU1PY1MoZG42NO27UqtVNB6nM1oukwLd1j6vpaFiC5vZsiL27M8IIURg2Dunzl289kNWR1OPrUmlVACRoP066IzgA8Hh8aBSau2HKpWSwWG2hCkVcrCm2ZY311dsUSkVDgq5zI1IJIEV1aYeECK0NFZ+hMfhgWZrn8fubH5FwGNPV6kUDngCsefHp5BLPRl2zqkIoZ6eIoBWhNMSziMA7cykSMAD1z5dciG/K0I3pKmrKtzdcx9EMujK1c0SCXlcoNnatcplEu+25prNdg4uwGzv/x0ozEksaGuq2QygFR1D74ZiZQ0ySW9oqPKijL22to5AoVBbBTz2dDazZYWtnSNwWe29s0gIERJjjiHdD6svsu53QKFYNzXWlPZ4G1V1z2I1VBfvIhJJPT/OuqqiQQEaHJzd48QiAfSdRayvKvrCLzAcqNa0GjweD6o+P7ji+ymn7J3cgWpDrxQJuiKY7Y1rNBoNWSTkgbPbqB7HigIeG1zceucheFzmHFs7JyAQiKK6qqIfLPXehIKuCF371c2S9YXcHSBFN4P5oCjzsrb+Whuto7NHLA6HA1Z7byzBxprSr62oNjAmIGQrv4s1y1j7FwsFwSQyBRy6l8Ko1Srag6JMCIucmwwA4OTs2cphtYG6T/ixuqrC6HETpwEOh1eYbhOtywCHA3W3oHKYrcskEiFQqTTA4/EK3TsVi/ghDk7uQNTjP8zUMxoqFhUs91H+++b8bU150b1kiL90CHFZbUs0ajVVwGNPz89KKOZ0tvT7Qtk5uCRLJELo4nRG3711VhgUOvVlhBB0cToWVJbm7gTAqWsfFIBYyAtDCBHqq4t3jfIZB9bdBks6wwHaW2rcWhurPki9dbZF3w/Wa3QgNNSUgEQsCE65cYoXMvm5NzRqNXA6W5dVl9/bSSSRufaOrolqtRpYHU2rMu9c5fkFhr+jVqtAyOdMLci5fZZGt8+j2zrkqlVKaKwt/Toz+Yqws61hnZdP0DdOrl6QcvP0ZTazZUVtRcHe+EuHcsKnRE8G0L5IhDQDhkSIoFaroKos94RcphVZOsMBmO0N0NFat+HOjT9a+jYwqVjgmZ0a22jLcMyaGDn3HQ6zFbJTYzg8LnNOUW5yJpvZGuLh7b+vralm8+7P31BVl98/qu/d+AWF7+tsbwBmW+Oae+lxje5e/rEIEAgF3Ij7GfFptgzHrLCo6I7ie8nQUFOyk9nWsO7GpUMqD2//mySSbhjRh27hZrY3rqmrKtxm7+h204ZuB7UV+Qe4rLYl5UUZH/mOC09VyKVQXX7/qKzPhIYO/6CIt+2dXCE37XoBQojQ3lK7sfpBHsxZtGY2AIDHqIA9HFYrcFhtS4ruJWe6uHun4nA4EPG7wu6lx923tXNKl0qEgQhpeozY3c+9X48VIQ0ZIQS1lQV7RYKuCEu9N92xhuqSnXxu56D1ha4ePr/a0BlQVpAW39FSu7GprmyRvaObwoamFSwbul1h8MRpkJ+VsEKhkLmJRfyQtMQL7y1YvmEPiUTmKpUKB2PtXyLmh9AZjoDD4dRKpdz51pWjQm+/8TB+0sz5AADjJ81YSCAQoSA7sQAAoOZB3qEudgdMm7s8wJw2Yefgkuzm6QO1FfnrhXxuZOadK5cnhM/cp1YpobmufLtuskcmETOsaYaCTht/RkMGIWTxf8z2xlXJcX+g87/tRBeOfYMSYn5D1eX3DykVcoe++dRqNTn99kV53IWDqLOtYQ1CCO6l36hOiPkNiQS8EIQQtDRWfnD72u/o5pUj6F76jWqFXOasO5/V2bwi7sIBdPfWOSSXSTz11UUul7ql3DyDblz8BXW01q9DCMH9jPiKhJjfkEiovYbu2LVz+1Fjbdl2hBCUFaRd14pu+wJdnuzU2Pbr5/ej+uqSr3XHxEJeyN1bZ1HMmZ9R2u0LKrGIH6xLk0pEPum3L8p194IQAh63c07chYMoPzvxvu6YgMeJjL98GCVdP4FEgq4w3fH6quKd187tQ7WVBbt1x9qaajbeuvorunZuHyq+n5Kk0ajJCCEQCbrCYs7sQRlJl4WG3kthzu2ca2f3ocrSnBMIIah5kHcg7sLBnuei0WgIxXmpCdfO7UM3rxxFzQ0VHxl8zxoNIS3xPEqMPY4kYkEgQgg6WurWx50/gNISziO5TOomEQsC4y8fRnmZN8sMlSMS8EJSb51FNy7+gtISL6j63j9CCPKzEgqund2LKkq0da6rKtoVd+Egam+p3YAQAplU7J1++6JcyOdG9L1P3XtECIGAz4m8cfEXdC8jvkKj0RAs9d7EIn7wrStHUVrieaRWq6j67q+jtX5d3IWD6G7COSSXSd1uXDyEEmJ+Q7p0lVJJu58RXxF34SBKun4CdbZqfwe6f8baf35WQsH+nZvQ7Wu/o5SbZ1BDTW+71P3rYndEJ10/geIvHULZKTFMmbT/78RUm+hid0Rr2+ZJJBLyQlRKBSMx9jjKSLok0d1zbWXhD6X5d+P13b85z2go/zAHfiOI/OyEYgcnj9gx/r02DYy/Fn8c3I7Gh88oDJ/SO/P5sGQkXZIz2xvJy177YESttjcG5q1hhKBRq6kdLXUh+gyfGE+GLnbHgr47KkSCrghWRxP4j+tdxvEoSCVCshXVcKi7kQgmWCMEHB6vmL1wddBQwo9hPF7uZdyIvxP3xwEA7WREYuyx+9PmrWjtOwv+sKiUCofWpmoAwPUY9Z8GsCEhBsZjQioWBt7PiK+QycRAIBDBd+zE78YEhH5sibLbmqrfa27Qrony9hm3w32U/6A1UCMRTLAwMDCGDdiQEAMDY9iACRYGBsawARMsDAyMYQMmWBgYGMMGTLAwMDCGDZhgYWBgDBswwcLAwBg2YIKFgYExbMAECwMDY9iACRYGBsawARMsDAyMYQMmWBgYGMMGTLAwMDCGDZhgYWBgDBswwcLAwBg2YIKFgYExbMAECwMDY9iACRYGBsawARMsDAyMYcP/A11RWMSzQVw1AAAAAElFTkSuQmCC"
                  alt="MiculProducator Logo"
                  className="h-11 sm:h-16 w-auto object-contain object-left transition-transform group-hover:scale-102"
                />
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
