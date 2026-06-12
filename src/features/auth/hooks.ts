"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ROUTES,
  COOKIE_AUTH,
  COOKIE_ROLE,
  writeAuthCookie,
  clearAuthCookie,
} from "@/lib/constants";
import { STALE_AUTH_USER } from "@/lib/constants/query-stale";
import {
  clearScheduledRefresh,
  resumeRefreshIfNeeded,
  scheduleTokenRefresh,
} from "@/lib/api/token-refresh";
import { handleApiError, showMessage } from "@/lib/utils";
import { authApi } from "./api";
import type {
  CreatePatPayload,
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "./types";

// ─── Current User ────────────────────────────────────────
export function useCurrentUser() {
  // Gate the query on the `COOKIE_AUTH` flag so unauthenticated tabs
  // never fire `/auth/me`. Without this every public page (sign-in,
  // landing, error boundary) burns a Neon DB round-trip on mount,
  // which adds up fast on a free-tier compute budget.
  const hasAuthCookie =
    typeof document !== "undefined" &&
    document.cookie.includes(`${COOKIE_AUTH}=1`);

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: hasAuthCookie,
    retry: false,
    // Mounted on every layout + header + sidebar + many page components.
    // Without a long staleTime each page nav after 60s would refetch;
    // identity rarely changes during a session, so 5 minutes is safe.
    staleTime: STALE_AUTH_USER,
    refetchOnWindowFocus: false,
  });

  // Keep the role cookie in sync with server truth — cheap side-effect that
  // lets middleware (edge) bypass maintenance redirects for admins even when
  // the user lands from a cold browser.
  const role = data?.role;
  useEffect(() => {
    if (!role) return;
    writeAuthCookie(COOKIE_ROLE, role);
  }, [role]);

  // Resume the proactive refresh timer on app boot. setTimeout is lost
  // on every full-page reload, so without this the user would burn one
  // 401-then-recover cycle the first time the post-reload access token
  // expires. `resumeRefreshIfNeeded` reads the persisted expiry from
  // localStorage and either re-arms the timer or fires a refresh now if
  // the stored expiry is already past its safety window.
  const isAuthenticated = !!data;
  useEffect(() => {
    if (isAuthenticated) resumeRefreshIfNeeded();
  }, [isAuthenticated]);

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
  };
}

// ─── Login ───────────────────────────────────────────────
export function useLogin({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (result) => {
      writeAuthCookie(COOKIE_AUTH, "1");
      const role = result?.user?.role;
      if (role) {
        writeAuthCookie(COOKIE_ROLE, role);
      }
      if (result?.user) {
        queryClient.setQueryData(["auth", "me"], result.user);
      }
      // Arm the proactive refresh timer using the access token's
      // remaining lifetime. Without this, the user's next request after
      // ~JWT_ACCESS_TOKEN_EXPIRATION seconds returns 401 → visible as a
      // red row in DevTools Network even though the interceptor recovers.
      if (result?.expiresIn) {
        scheduleTokenRefresh(result.expiresIn);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        // Honour `?returnTo=` set by middleware when the user was bounced
        // from a deep link. Restrict to same-origin internal paths so a
        // crafted link can't redirect us off-site after sign-in.
        const returnTo = searchParams?.get("returnTo");
        const safeTarget =
          returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : ROUTES.DASHBOARD;
        router.push(safeTarget);
      }
    },
    onError: handleApiError,
  });
}

// ─── Register ────────────────────────────────────────────
export function useRegister({ onSuccess }: { onSuccess?: (email: string) => void } = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: (result, variables) => {
      showMessage("REGISTER_SUCCESS");
      const expiresAt = result.otpExpiresIn
        ? Date.now() + result.otpExpiresIn * 1000
        : "";
      if (onSuccess) {
        onSuccess(variables.email);
      } else {
        router.push(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(variables.email)}&expiresAt=${expiresAt}`);
      }
    },
    onError: handleApiError,
  });
}

// ─── Verify Email ────────────────────────────────────────
export function useVerifyEmail({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: VerifyEmailPayload) => authApi.verifyEmail(data),
    onSuccess: () => {
      showMessage("EMAIL_VERIFIED");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.SIGN_IN);
      }
    },
    onError: handleApiError,
  });
}

// ─── Forgot Password ────────────────────────────────────
export function useForgotPassword({ onSuccess }: { onSuccess?: () => void } = {}) {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => authApi.forgotPassword(data),
    onSuccess: () => {
      showMessage("FORGOT_PASSWORD_SUCCESS");
      onSuccess?.();
    },
    onError: handleApiError,
  });
}

// ─── Reset Password ─────────────────────────────────────
export function useResetPassword({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => authApi.resetPassword(data),
    onSuccess: () => {
      showMessage("RESET_PASSWORD_SUCCESS");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.SIGN_IN);
      }
    },
    onError: handleApiError,
  });
}

// ─── Update Profile ─────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; image?: string | null }) =>
      authApi.updateProfile(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.setQueryData(["auth", "me"], result.user);
    },
    onError: handleApiError,
  });
}

// ─── Upload Avatar ──────────────────────────────────────
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.setQueryData(["auth", "me"], result.user);
    },
    onError: handleApiError,
  });
}

// ─── Change Password ────────────────────────────────────
// `currentPassword` is optional: OAuth-only users (no password yet) omit
// it to perform a first-time "set password" — BE skips the verify step
// when `user.hasPassword` is false. Existing-password users MUST send it,
// otherwise BE returns CURRENT_PASSWORD_REQUIRED.
//
// On a first-time set we invalidate `["auth","me"]` so the next render
// observes `user.hasPassword === true` and the profile form switches
// from "Set password" to "Change password" mode without a reload. For
// the regular change-password path the flag doesn't move, so the
// invalidation is skipped to avoid an unnecessary BE round-trip.
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { currentPassword?: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: (result) => {
      showMessage(result.message);
      if (result.firstTimeSet) {
        void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      }
    },
    onError: handleApiError,
  });
}

// ─── Logout ──────────────────────────────────────────────
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      showMessage("LOGOUT_SUCCESS");
    },
    onSettled: () => {
      clearAuthCookie(COOKIE_AUTH);
      clearAuthCookie(COOKIE_ROLE);
      // Stop the proactive refresh timer + wipe the persisted expiry
      // so the next visit (logged-out tab) doesn't try to resume.
      clearScheduledRefresh();
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
  });
}

// ─── Sessions (my devices) ──────────────────────────────
export function useMySessions() {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => authApi.listSessions(),
  });
}

export function useRevokeMySession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: (result) => {
      showMessage(result.message);
      if (result.wasCurrent) {
        // Rare path: user revoked the session they're currently on.
        clearAuthCookie(COOKIE_AUTH);
        clearAuthCookie(COOKIE_ROLE);
        clearScheduledRefresh();
        queryClient.clear();
        router.push(ROUTES.SIGN_IN);
      } else {
        queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      }
    },
    onError: handleApiError,
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
    },
    onError: handleApiError,
  });
}

export function useRevokeAllMySessions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.revokeAllSessions(),
    onSuccess: () => {
      showMessage("LOGOUT_SUCCESS");
      clearAuthCookie(COOKIE_AUTH);
      clearAuthCookie(COOKIE_ROLE);
      clearScheduledRefresh();
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
    onError: handleApiError,
  });
}

// ─── Personal access tokens ──────────────────────────────
const PAT_KEY = ["auth", "tokens"] as const;

export function useMyTokens() {
  return useQuery({
    queryKey: PAT_KEY,
    queryFn: () => authApi.listTokens(),
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePatPayload) => authApi.createToken(payload),
    // No success toast — the dialog itself surfaces the raw token, that's
    // the meaningful user feedback. A toast would just clutter the UI.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAT_KEY });
    },
    onError: handleApiError,
  });
}

export function useRevokeToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.revokeToken(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: PAT_KEY });
    },
    onError: handleApiError,
  });
}

// ─── OAuth accounts ──────────────────────────────────────
const OAUTH_ACCOUNTS_KEY = ["auth", "oauth-accounts"] as const;

export function useMyOAuthAccounts() {
  return useQuery({
    queryKey: OAUTH_ACCOUNTS_KEY,
    queryFn: () => authApi.listOAuthAccounts(),
  });
}

export function useUnlinkOAuthAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => authApi.unlinkOAuthAccount(provider),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: OAUTH_ACCOUNTS_KEY });
    },
    onError: handleApiError,
  });
}

// ─── GDPR ────────────────────────────────────────────────
const DELETION_KEY = ["auth", "deletion-status"] as const;

export function useDeletionStatus() {
  return useQuery({
    queryKey: DELETION_KEY,
    queryFn: () => authApi.deletionStatus(),
  });
}

export function useRequestDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.requestDeletion(),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: DELETION_KEY });
    },
    onError: handleApiError,
  });
}

export function useCancelDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.cancelDeletion(),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: DELETION_KEY });
    },
    onError: handleApiError,
  });
}
