import { request, norm } from "@/lib/api/client";

export async function apiGetSettings() {
  const res = await request<{ data: unknown }>("/settings");
  return norm(res.data);
}

export async function apiUpdateSettings(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/settings", { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}
