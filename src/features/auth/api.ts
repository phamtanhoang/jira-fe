import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SessionRow,
} from "./types";

type ApiResponse = { message?: string; otpExpiresIn?: number };

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.signUp, data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.verifyEmail, data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api
      .post<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>(ENDPOINTS.auth.signIn, data)
      .then((r) => r.data),

  refresh: () =>
    api
      .post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        ENDPOINTS.auth.refresh,
      )
      .then((r) => r.data),

  logout: () =>
    api.post(ENDPOINTS.auth.logOut).then((r) => r.data),

  me: () =>
    api.get<AuthUser>(ENDPOINTS.auth.me).then((r) => r.data),

  updateProfile: (data: { name?: string; image?: string | null }) =>
    api.patch<{ message: string; user: AuthUser }>(ENDPOINTS.auth.me, data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>(`${ENDPOINTS.auth.auth}/change-password`, data).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ message: string; user: AuthUser }>(
        `${ENDPOINTS.auth.auth}/avatar`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.forgotPassword, data).then((r) => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<ApiResponse>(ENDPOINTS.auth.resetPassword, data).then((r) => r.data),

  // ─── Sessions (my devices) ───────────────────────────

  listSessions: () =>
    api.get<SessionRow[]>(ENDPOINTS.auth.sessions).then((r) => r.data),

  revokeSession: (sessionId: string) =>
    api
      .delete<{ message: string; wasCurrent: boolean }>(
        ENDPOINTS.auth.session(sessionId),
      )
      .then((r) => r.data),

  revokeOtherSessions: () =>
    api
      .post<{ message: string; count: number }>(
        ENDPOINTS.auth.sessionsRevokeOthers,
      )
      .then((r) => r.data),

  revokeAllSessions: () =>
    api
      .post<{ message: string; count: number }>(
        ENDPOINTS.auth.sessionsRevokeAll,
      )
      .then((r) => r.data),

  oauthProviders: () =>
    api
      .get<{ google: boolean; github: boolean }>(ENDPOINTS.auth.oauthProviders)
      .then((r) => r.data),
};
