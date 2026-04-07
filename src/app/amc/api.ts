import { request, norm } from "@/lib/api/client";

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

export async function apiDeleteAMC(id: string) {
  await request(`/amc/${id}`, { method: "DELETE" });
}
