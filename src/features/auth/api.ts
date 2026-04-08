import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "./types";

type ApiResponse = { message?: string };

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.signUp, data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.verifyEmail, data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<{ user: AuthUser }>(ENDPOINTS.auth.signIn, data).then((r) => r.data),

  refresh: () =>
    api.post<{ user: AuthUser }>(ENDPOINTS.auth.refresh).then((r) => r.data),

  logout: () =>
    api.post(ENDPOINTS.auth.logOut).then((r) => r.data),

  me: () =>
    api.get<AuthUser>(ENDPOINTS.auth.me).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.forgotPassword, data).then((r) => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.resetPassword, data).then((r) => r.data),
};
