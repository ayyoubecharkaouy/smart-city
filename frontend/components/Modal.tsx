"use client";

import { X } from "lucide-react";
import { memo, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

function Modal({
  isOpen,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative flex max-h-[80%] w-full max-w-4xl flex-col overflow-hidden border border-[#173525] bg-[#0a1710] rounded-4xl shadow-2xl animate-in slide-in-from-left duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-900 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <div className="h-full w-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default memo(Modal);
