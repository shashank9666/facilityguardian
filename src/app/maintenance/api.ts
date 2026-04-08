import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetMaintenance(filters: Record<string, string> = {}) {
  const res = await request<{ data: unknown[] }>(`/maintenance${toQueryString(filters)}`);
  return res.data.map(norm);
}

export async function apiCreateMaintenance(body: any) {
  const res = await request<{ data: any }>("/maintenance", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return norm(res.data);
}

export async function apiUpdateMaintenance(id: string, body: any) {
  const res = await request<{ data: any }>(`/maintenance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return norm(res.data);
}

export async function apiDeleteMaintenance(id: string) {
  return await request(`/maintenance/${id}`, { method: "DELETE" });
}

export const apiGetPreventiveMaintenance = apiGetMaintenance;
