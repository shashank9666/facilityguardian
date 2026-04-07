"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-all"
      aria-modal="true" role="dialog"
    >
      <div className={cn(
        "w-full bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh]",
        "animate-[slideUp_.25s_ease-out]", sizeMap[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-red-500 transition-all active:scale-95"
            aria-label="Close"
          >
            <X size={20} className="stroke-[2.5px]" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 custom-scrollbar">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
