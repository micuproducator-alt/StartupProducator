import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Blochează scroll-ul în spate
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Containerul mare ocupă tot ecranul și NU are fundal el însuși
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* BACKGROUND / BACKDROP - Folosește doar clase native Tailwind v4 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Wrapper pentru centrarea panoului alb */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Fereastra Albă Propriu-Zisă (Modal Panel) */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 focus:outline-none"
        >
          {/* Header-ul ferestrei */}
          <div className="bg-gray-50/70 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200/60 backdrop-blur-xs">
            <h3 className="text-lg font-bold text-gray-900" id="modal-title">
              {title || "Dialog"}
            </h3>
            <button
              type="button"
              className="rounded-xl p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 focus:outline-none transition-all active:scale-90"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Conținutul din interiorul ferestrei */}
          <div className="px-4 pt-5 pb-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
