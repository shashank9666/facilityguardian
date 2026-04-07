"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const icons = {
  success: <CheckCircle size={16} className="text-emerald-500" />,
  error:   <XCircle    size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info:    <Info       size={16} className="text-blue-500" />,
};

const borders = {
  success: "border-l-emerald-500",
  error:   "border-l-red-500",
  warning: "border-l-amber-500",
  info:    "border-l-blue-500",
};

export function ToastContainer() {
  const { state, dispatch } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
      {state.toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-4 bg-white/95 backdrop-blur-md border border-slate-200 border-l-4 rounded-2xl",
            "px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[300px] max-w-md pointer-events-auto",
            "animate-[slideIn_.3s_cubic-bezier(0,0,0.2,1)]",
            borders[t.type]
          )}
        >
          <div className="flex-shrink-0">{icons[t.type]}</div>
          <span className="text-[13.5px] font-medium text-slate-700 flex-1 leading-tight">{t.message}</span>
          <button
            onClick={() => dispatch({ type: "TOAST_REMOVE", payload: t.id })}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-all"
          >×</button>
        </div>
      ))}
    </div>,
    document.body
  );
}
