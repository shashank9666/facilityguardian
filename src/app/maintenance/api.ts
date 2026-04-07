import { request, norm } from "@/lib/api/client";

export async function apiGetMaintenance() {
  const res = await request<{ data: unknown[] }>("/maintenance");
  return res.data.map(norm);
}

// Alias for preventive maintenance specifically
export const apiGetPreventiveMaintenance = apiGetMaintenance;
