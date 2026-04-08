import { request, norm, toQueryString } from "@/lib/api/client";
import type { FmNotification } from "@/types";

export async function apiGetNotifications() {
  const res = await request<{ data: unknown[] }>("/notifications");
  return res.data.map(norm) as FmNotification[];
}

export async function apiMarkNotificationRead(id: string) {
  const res = await request<{ data: unknown }>(`/notifications/${id}/read`, { method: "PATCH" });
  return norm(res.data) as FmNotification;
}

export async function apiMarkAllNotificationsRead() {
  await request("/notifications/mark-all-read", { method: "PATCH" });
}

export async function apiDeleteNotification(id: string) {
  await request(`/notifications/${id}`, { method: "DELETE" });
}
