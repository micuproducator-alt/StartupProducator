import React, { useEffect, useState } from "react";
import MisiuneaNoastraContinut from "./MisiuneaNoastraContinut";

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
      // Evităm spamul la refresh, dar păstrăm logica în caz că vrei să apară o singură dată automat
      const hasSeenMission = localStorage.getItem("hasSeenLocallioMission");
      if (!hasSeenMission) {
        setIsOpen(true);
      }
    }
  }, [isOpenExternal, isTriggeredByNavbar]);

  const handleClose = () => {
    setIsOpen(false);
    if (!isTriggeredByNavbar) {
      localStorage.setItem("hasSeenLocallioMission", "true");
    }
    if (onCloseExternal) onCloseExternal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl flex flex-col border border-stone-100 transform transition-all scale-100 max-h-[90vh] overflow-hidden">
        {/* Header Pop-up (Pompinteligent, culori de impact) */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-stone-50 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white relative">
          <div>
            <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full uppercase font-black tracking-widest text-emerald-100 mb-2 inline-block">
              Manifestul Locallio
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Misiunea Noastră Platformei
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Descoperă cum reconstruim legătura dintre gospodari și masa ta.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all text-xs font-bold w-9 h-9 flex items-center justify-center cursor-pointer absolute right-6 top-6 sm:right-8 sm:top-8"
          >
            ✕
          </button>
        </div>

        {/* Conținutul propriu-zis (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white">
          <MisiuneaNoastraContinut />
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
