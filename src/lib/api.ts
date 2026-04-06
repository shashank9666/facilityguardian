// ─── FMNexus API Client ────────────────────────────────────────────────────────
// Thin wrapper around fetch that handles auth tokens, error normalization,
// and maps MongoDB _id → id for all responses.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

// ── Token storage ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fm_token");
}
export function setToken(t: string)  { localStorage.setItem("fm_token", t); }
export function clearToken()         { localStorage.removeItem("fm_token"); }

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
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
function norm(doc: any): any {
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

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  data: { id: string; name: string; email: string; role: string };
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await request<{ success: boolean } & AuthResponse>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  return res;
}

export async function apiGetMe() {
  const res = await request<{ success: boolean; data: unknown }>("/auth/me");
  return norm(res.data);
}

// ── Assets ────────────────────────────────────────────────────────────────────
export async function apiGetAssets(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await request<{ data: unknown[] }>(`/assets${qs}`);
  return res.data.map(norm);
}

export async function apiCreateAsset(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/assets", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateAsset(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/assets/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiDeleteAsset(id: string) {
  return request<{ success: boolean }>(`/assets/${id}`, { method: "DELETE" });
}

// ── Work Orders ───────────────────────────────────────────────────────────────
export async function apiGetWorkOrders(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await request<{ data: unknown[] }>(`/work-orders${qs}`);
  return res.data.map(norm);
}

export async function apiCreateWorkOrder(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/work-orders", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateWorkOrder(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/work-orders/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiDeleteWorkOrder(id: string) {
  return request<{ success: boolean }>(`/work-orders/${id}`, { method: "DELETE" });
}

// ── Vendors ───────────────────────────────────────────────────────────────────
export async function apiGetVendors() {
  const res = await request<{ data: unknown[] }>("/vendors");
  return res.data.map(norm);
}

export async function apiCreateVendor(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/vendors", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateVendor(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/vendors/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export async function apiGetIncidents() {
  const res = await request<{ data: unknown[] }>("/incidents");
  return res.data.map(norm);
}

export async function apiCreateIncident(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/incidents", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateIncident(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export async function apiGetInventory() {
  const res = await request<{ data: unknown[] }>("/inventory");
  return res.data.map(norm);
}

export async function apiGetInventoryStats() {
  const res = await request<{ data: Record<string, number> }>("/inventory/stats");
  return res.data;
}

export async function apiCreateInventoryItem(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/inventory", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateInventoryItem(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiDeleteInventoryItem(id: string) {
  await request(`/inventory/${id}`, { method: "DELETE" });
}

export async function apiRestockItem(id: string, quantity: number) {
  const res = await request<{ data: unknown }>(`/inventory/${id}/restock`, {
    method: "PATCH", body: JSON.stringify({ quantity }),
  });
  return norm(res.data);
}

// ── Spaces ────────────────────────────────────────────────────────────────────
export async function apiGetSpaces() {
  const res = await request<{ data: unknown[] }>("/spaces");
  return res.data.map(norm);
}

// ── Maintenance ───────────────────────────────────────────────────────────────
export async function apiGetMaintenance() {
  const res = await request<{ data: unknown[] }>("/maintenance");
  return res.data.map(norm);
}

// ── AMC Contracts ─────────────────────────────────────────────────────────────
export async function apiGetAMC() {
  const res = await request<{ data: unknown[] }>("/amc");
  return res.data.map(norm);
}

export async function apiCreateAMC(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/amc", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateAMC(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/amc/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function apiGetDocuments() {
  const res = await request<{ data: unknown[] }>("/documents");
  return res.data.map(norm);
}

export async function apiGetDocumentStats() {
  const res = await request<{ data: Record<string, number> }>("/documents/stats");
  return res.data;
}

export async function apiCreateDocument(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/documents", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateDocument(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Checklists ────────────────────────────────────────────────────────────────
export async function apiGetChecklists(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await request<{ data: unknown[] }>(`/checklists${qs}`);
  return res.data.map(norm);
}

export async function apiSubmitChecklist(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/checklists", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Meter Readings ────────────────────────────────────────────────────────────
export async function apiGetMeterReadings() {
  const res = await request<{ data: unknown[] }>("/meter-readings");
  return res.data.map(norm);
}

export async function apiSubmitMeterReading(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/meter-readings", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

// ── Users (admin) ─────────────────────────────────────────────────────────────
export async function apiGetUsers() {
  const res = await request<{ data: unknown[] }>("/auth/users");
  return res.data.map(norm);
}
