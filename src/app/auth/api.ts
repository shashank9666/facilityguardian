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

export async function apiGetUsers() {
  const res = await request<{ data: unknown[] }>("/auth/users");
  return res.data.map(norm);
}
