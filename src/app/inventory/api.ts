import { request, norm } from "@/lib/api/client";

export async function apiGetInventory() {
  const res = await request<{ data: unknown[] }>("/inventory");
  return res.data.map(norm);
}

export async function apiCreateInventoryItem(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/inventory", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateInventoryItem(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiAdjustStock(id: string, delta: number) {
  const res = await request<{ data: unknown }>(`/inventory/${id}/adjust`, { 
    method: "POST", 
    body: JSON.stringify({ adjustment: delta }) 
  });
  return norm(res.data);
}
