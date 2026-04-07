import { request, norm } from "@/lib/api/client";

export async function apiGetMeterReadings() {
  const res = await request<{ data: unknown[] }>("/meter-readings");
  return res.data.map(norm);
}

export async function apiSubmitMeterReading(body: Record<string, unknown>) {
  const res = await request<{ data: unknown }>("/meter-readings", { method: "POST", body: JSON.stringify(body) });
  return norm(res.data);
}
