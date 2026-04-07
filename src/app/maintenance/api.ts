import { request, norm } from "@/lib/api/client";

export async function apiGetPreventiveMaintenance() {
  const res = await request<{ data: unknown[] }>("/maintenance");
  return res.data.map(norm);
}
