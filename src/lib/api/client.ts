// ─── FMNexus API Client Core ───────────────────────────────────────────────────
// Base request wrapper + token management + normalization.

export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

export function toQueryString(params?: Record<string, any>) {
  if (!params) return "";
  const filtered = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "" && v !== "All")
    .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {});
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : "";
}

// ── Token storage ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fm_token");
}
export function setToken(t: string)  { localStorage.setItem("fm_token", t); }
export function clearToken()         { localStorage.removeItem("fm_token"); }

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json as T;
}

// ── ID normalizer: maps _id → id recursively on objects ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function norm(doc: any): any {
  if (!doc || typeof doc !== "object") return doc;
  if (Array.isArray(doc)) return doc.map(norm);
  const { _id, __v, ...rest } = doc;
  const out: Record<string, unknown> = { ...(_id !== undefined ? { id: String(_id) } : {}), ...rest };
  for (const key of Object.keys(out)) {
    out[key] = norm(out[key] as unknown);
  }
  // Defensive defaults: ensure known array fields are never undefined
  const ARRAY_FIELDS = ["tags", "checklist", "auditLog", "timeline", "fields", "options", "attachments", "images"];
  for (const f of ARRAY_FIELDS) {
    if (out[f] === undefined || out[f] === null) out[f] = [];
  }
  return out;
}
