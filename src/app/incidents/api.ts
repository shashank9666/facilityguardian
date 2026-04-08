import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetIncidents(filters: any = {}) {
  const res = await request<{ data: unknown[] }>(`/incidents${toQueryString(filters)}`);
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
