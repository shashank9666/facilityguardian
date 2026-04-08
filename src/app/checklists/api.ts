import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetChecklists(params?: Record<string, string>) {
  const res = await request<{ data: unknown[] }>(`/checklists${toQueryString(params)}`);
  return res.data.map(norm);
}

export async function apiSubmitChecklist(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/checklists", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}
