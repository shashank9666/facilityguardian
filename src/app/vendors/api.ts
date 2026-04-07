import { request, norm } from "@/lib/api/client";

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
