import { request, norm } from "@/lib/api/client";

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
