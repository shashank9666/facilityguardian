import { request, norm, toQueryString } from "@/lib/api/client";

export async function apiGetMeterReadings(params?: Record<string, string>) {
  const res = await request<{ data: unknown[] }>(`/meter-readings${toQueryString(params)}`);
  return res.data.map(norm);
}

export async function apiSubmitMeterReading(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/meter-readings", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiUpdateMeterReading(id: string, body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>(`/meter-readings/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return norm(res.data);
}

export async function apiDeleteMeterReading(id: string) {
  await request(`/meter-readings/${id}`, { method: "DELETE" });
}
