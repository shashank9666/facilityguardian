"use client";

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
  return (
    <div className="fixed top-5 right-5 z-[2000] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 bg-white border border-slate-200 border-l-4 rounded-lg",
            "px-4 py-3 shadow-lg min-w-[260px] max-w-sm pointer-events-auto",
            "animate-[slideIn_.2s_ease]",
            borders[t.type]
          )}
        >
          {icons[t.type]}
          <span className="text-sm text-slate-700 flex-1">{t.message}</span>
          <button
            onClick={() => dispatch({ type: "TOAST_REMOVE", payload: t.id })}
            className="text-slate-300 hover:text-slate-500 ml-2 text-lg leading-none"
          >×</button>
        </div>
      ))}
    </div>
  );
}
