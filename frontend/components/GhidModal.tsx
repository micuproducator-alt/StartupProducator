import React, { useEffect, useState } from "react";
import GhidContinut from "./GhidContinut"; // Asigură-te că numele componentei exportate este cel corect

interface MisiuneaNoastraProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  isTriggeredByNavbar?: boolean;
}

export default function MisiuneaNoastra({
  isOpenExternal,
  onCloseExternal,
  isTriggeredByNavbar,
}: MisiuneaNoastraProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isTriggeredByNavbar) {
      setIsOpen(!!isOpenExternal);
    } else {
      // Afișăm modalul doar dacă a fost apelat extern sau la nevoie
      setIsOpen(!!isOpenExternal);
    }
  }, [isOpenExternal, isTriggeredByNavbar]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  // Închidere pe tasta ESC (Acessibilitate / UX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl flex flex-col border border-stone-100 transform transition-all scale-100 max-h-[90vh] overflow-hidden">
        {/* Header Pop-up */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-stone-50 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white relative">
          <div>
            <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full uppercase font-black tracking-widest text-emerald-100 mb-2 inline-block">
              Manifestul Locallio
            </span>
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl font-black tracking-tight mt-1"
            >
              Misiunea Platformei Locallio
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Descoperă cum reconstruim legătura dintre gospodari și masa ta.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Închide fereastra"
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all text-xs font-bold w-9 h-9 flex items-center justify-center cursor-pointer absolute right-6 top-6 sm:right-8 sm:top-8"
          >
            ✕
          </button>
        </div>

        {/* Conținutul propriu-zis (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white">
          <GhidContinut />
        </div>

        {/* Footer Pop-up */}
        <div className="p-5 border-t border-stone-50 bg-stone-50/50 flex justify-end rounded-b-[2.5rem]">
          <button
            onClick={handleClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            Susțin și eu misiunea!
          </button>
        </div>
      </div>
    </div>
  );
}
