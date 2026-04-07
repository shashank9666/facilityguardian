import { request, norm } from "@/lib/api/client";

export async function apiGetDocuments() {
  const res = await request<{ data: unknown[] }>("/documents");
  return res.data.map(norm);
}

export async function apiGetDocumentStats() {
  const res = await request<{ data: Record<string, number> }>("/documents/stats");
  return res.data;
}

export async function apiCreateDocument(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/documents", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateDocument(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}
