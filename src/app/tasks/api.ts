import { request, norm } from "@/lib/api/client";

export async function apiGetMyTasks() {
  const res = await request<{ data: unknown[] }>("/my-tasks");
  return res.data.map(norm);
}
