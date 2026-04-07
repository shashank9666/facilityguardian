import { request, norm } from "@/lib/api/client";

export async function apiGetReports(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await request<{ data: unknown }>(`/reports${qs}`);
  return norm(res.data);
}
