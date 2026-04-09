import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetServiceRequests(filters: any = {}) {
  const res = await request<{ data: unknown[] }>(`/service-requests${toQueryString(filters)}`);
  return res.data.map(norm);
}

export async function apiCreateServiceRequest(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/service-requests", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateServiceRequest(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}
