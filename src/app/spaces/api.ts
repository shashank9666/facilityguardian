import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetSpaces(filters: any = {}) {
  const res = await request<{ data: unknown[] }>(`/spaces${toQueryString(filters)}`);
  return res.data.map(norm);
}

export async function apiCreateSpace(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/spaces", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateSpace(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/spaces/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiDeleteSpace(id: string) {
  await request(`/spaces/${id}`, { method: "DELETE" });
}
