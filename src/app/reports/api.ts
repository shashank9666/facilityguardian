import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetReports(params?: Record<string, string>) {
  const res = await request<{ data: unknown }>(`/reports${toQueryString(params)}`);
  return norm(res.data);
}
