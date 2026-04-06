import { type ClassValue, clsx } from "clsx";
import type { Priority, WOStatus, AssetStatus, IncidentSeverity } from "@/types";

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Generate a compact unique ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

/** Sanitize user input – strip HTML tags to prevent XSS */
export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/** Format ISO date string to locale display */
export function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** Format relative time ("2 days ago") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return fmtDate(iso);
}

/** Days until a due date (negative = overdue) */
export function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

/** Currency formatter (INR) */
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

/** Number formatter with abbreviation */
export function fmtNumber(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1000)        return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/** Initials from full name */
export function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/** Deterministic avatar color from name */
const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500",  "bg-cyan-500",   "bg-fuchsia-500","bg-orange-500",
];
export function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ─── Badge variant maps ───────────────────────────────────────────────────────

export const priorityVariant: Record<Priority, string> = {
  critical: "bg-red-100 text-red-900 border border-red-300",
  high:     "bg-red-50  text-red-700  border border-red-200",
  medium:   "bg-amber-50 text-amber-700 border border-amber-200",
  low:      "bg-green-50 text-green-700 border border-green-200",
};

export const woStatusVariant: Record<WOStatus, string> = {
  open:        "bg-blue-50   text-blue-700  border border-blue-200",
  assigned:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  in_progress: "bg-amber-50  text-amber-700 border border-amber-200",
  on_hold:     "bg-gray-100  text-gray-600  border border-gray-200",
  completed:   "bg-green-50  text-green-700 border border-green-200",
  cancelled:   "bg-red-50    text-red-600   border border-red-200",
};

export const assetStatusVariant: Record<AssetStatus, string> = {
  operational:    "bg-green-50  text-green-700  border border-green-200",
  maintenance:    "bg-amber-50  text-amber-700  border border-amber-200",
  faulty:         "bg-red-50    text-red-700    border border-red-200",
  decommissioned: "bg-gray-100  text-gray-500   border border-gray-200",
};

export const severityVariant: Record<IncidentSeverity, string> = {
  low:      "bg-green-50  text-green-700  border border-green-200",
  medium:   "bg-amber-50  text-amber-700  border border-amber-200",
  high:     "bg-red-50    text-red-700    border border-red-200",
  critical: "bg-red-100   text-red-900    border border-red-300",
};

/** Priority dot colors (Tailwind) */
export const priorityDot: Record<Priority, string> = {
  critical: "bg-red-900",
  high:     "bg-red-500",
  medium:   "bg-amber-400",
  low:      "bg-green-500",
};
