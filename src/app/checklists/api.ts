import { request, norm } from "@/lib/api/client";

export async function apiGetChecklists(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await request<{ data: unknown[] }>(`/checklists${qs}`);
  return res.data.map(norm);
}

export async function apiSubmitChecklist(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/checklists", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}
