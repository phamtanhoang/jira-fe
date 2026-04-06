import { api } from "@/lib/api";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
} from "./types";

type ApiResponse = { success?: string; error?: string };

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse>("/auth/register", data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailPayload) =>
    api.post<ApiResponse>("/auth/verify-email", data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<{ user: AuthUser }>("/auth/login", data).then((r) => r.data),

  refresh: () =>
    api.post<{ user: AuthUser }>("/auth/refresh").then((r) => r.data),

  logout: () =>
    api.post("/auth/logout").then((r) => r.data),

  me: () =>
    api.get<AuthUser>("/auth/me").then((r) => r.data),
};
