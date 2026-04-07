import { request, norm } from "@/lib/api/client";

export async function apiGetDashboardStats() {
  const res = await request<{ data: unknown }>("/dashboard/stats");
  return norm(res.data);
}

export async function apiGetDashboardTimeline() {
  const res = await request<{ data: unknown[] }>("/dashboard/timeline");
  return res.data.map(norm);
}
