"use client";

import { Button } from "@/components/ui/Button";
import { AlertCircle, ShieldAlert, Home, ArrowLeft } from "lucide-react";

export function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <AlertCircle size={40} className="text-slate-400" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-600 mb-4">Page Not Found</h2>
      <p className="text-slate-400 max-w-sm mb-8">
        The module you are looking for doesn't exist or has been moved to a different location.
      </p>
      <div className="flex gap-4">
        <Button variant="secondary" leftIcon={<ArrowLeft size={16}/>} onClick={() => window.history.back()}>
          Go Back
        </Button>
        <Button variant="primary" leftIcon={<Home size={16}/>} onClick={onHome}>
          Return Home
        </Button>
      </div>
    </div>
  );
}

export function Unauthorized({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
        <ShieldAlert size={40} className="text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">403</h1>
      <h2 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h2>
      <p className="text-slate-400 max-w-sm mb-8">
        You don't have the required permissions to access this module. Please contact your administrator if you believe this is an error.
      </p>
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<Home size={16}/>} onClick={onHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
