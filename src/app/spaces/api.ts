import { request, norm } from "@/lib/api/client";

export async function apiGetSpaces() {
  const res = await request<{ data: unknown[] }>("/spaces");
  return res.data.map(norm);
}
