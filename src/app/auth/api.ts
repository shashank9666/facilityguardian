import { request, norm } from "@/lib/api/client";

export interface AuthResponse {
  token: string;
  data: { id: string; name: string; email: string; role: string };
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await request<{ success: boolean } & AuthResponse>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  return res;
}

export async function apiGetMe() {
  const res = await request<{ success: boolean; data: unknown }>("/auth/me");
  return norm(res.data);
}

export async function apiGetUsers(f: any = {}) {
  const q = new URLSearchParams(f).toString();
  const res = await request<{ data: unknown[] }>(`/auth/users${q ? `?${q}` : ""}`);
  return res.data.map(norm);
}

export async function apiGetTechnicians(f: any = {}) {
  const q = new URLSearchParams(f).toString();
  const res = await request<{ data: unknown[] }>(`/auth/technicians${q ? `?${q}` : ""}`);
  return res.data.map(norm);
}

export async function apiRegister(body: any) {
  return await request<{ success: boolean; data: unknown }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateUser(id: string, body: any) {
  const res = await request<{ data: unknown }>(`/auth/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return norm(res.data);
}

export async function apiDeleteUser(id: string) {
  return await request<{ success: boolean }>(`/auth/users/${id}`, {
    method: "DELETE",
  });
}

export async function apiUpdateMe(body: any) {
  const res = await request<{ data: unknown }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return norm(res.data);
}
