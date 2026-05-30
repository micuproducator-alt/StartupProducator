import React, { useEffect, useState } from "react";
import GhidContinut from "./GhidContinut";

interface GhidModalProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  isTriggeredByNavbar?: boolean;
}

export default function GhidModal({
  isOpenExternal,
  onCloseExternal,
  isTriggeredByNavbar,
}: GhidModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isTriggeredByNavbar) {
      setIsOpen(!!isOpenExternal);
    } else {
      // Verificăm dacă utilizatorul a mai intrat pe site ca să nu îi arătăm pop-up-ul la fiecare refresh
      const hasSeenGuide = localStorage.getItem("hasSeenLocallioGuide");
      if (!hasSeenGuide) {
        setIsOpen(true);
      }
    }
  }, [isOpenExternal, isTriggeredByNavbar]);

  const handleClose = () => {
    setIsOpen(false);
    if (!isTriggeredByNavbar) {
      localStorage.setItem("hasSeenLocallioGuide", "true");
    }
    if (onCloseExternal) onCloseExternal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col border border-gray-100 transform transition-all scale-100 max-h-[90vh]">
        {/* Header Pop-up */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-emerald-600 rounded-t-2xl text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Ghidul Platformei Locallio
            </h2>
            <p className="text-xs text-emerald-100">
              Află în 2 minute cum funcționează piața noastră digitală
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-sm font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Conținutul propriu-zis (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          <GhidContinut />
        </div>

        {/* Footer Pop-up */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl">
          <button
            onClick={handleClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-md"
          >
            Am înțeles, mulțumesc!
          </button>
        </div>
      </div>
    </div>
  );
}
