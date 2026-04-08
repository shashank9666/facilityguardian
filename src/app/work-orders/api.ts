import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetWorkOrders(filters: any = {}) {
  const res = await request<{ data: unknown[] }>(`/work-orders${toQueryString(filters)}`);
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
  await request(`/work-orders/${id}`, { method: "DELETE" });
}
