import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
type Size = "xs" | "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:   "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700",
  secondary: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
  ghost:     "bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-800",
  danger:    "bg-red-500 text-white border-red-500 hover:bg-red-600",
  success:   "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
  warning:   "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-2 py-1 text-xs rounded",
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-sm rounded-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  children, variant = "secondary", size = "md",
  leftIcon, rightIcon, loading, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border transition-all duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        variantClasses[variant], sizeClasses[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
