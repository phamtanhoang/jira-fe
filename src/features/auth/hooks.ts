"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ROUTES,
  COOKIE_AUTH,
  COOKIE_ROLE,
  COOKIE_MAX_AGE_1Y,
} from "@/lib/constants";
import { STALE_AUTH_USER } from "@/lib/constants/query-stale";
import { handleApiError, showMessage } from "@/lib/utils";
import { authApi } from "./api";
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "./types";

// ─── Current User ────────────────────────────────────────
export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
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
    document.cookie = `${COOKIE_ROLE}=${role};path=/;max-age=${COOKIE_MAX_AGE_1Y}`;
  }, [role]);

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
  };
}

// ─── Login ───────────────────────────────────────────────
export function useLogin({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (result) => {
      document.cookie = `${COOKIE_AUTH}=1;path=/;max-age=${COOKIE_MAX_AGE_1Y}`;
      const role = result?.user?.role;
      if (role) {
        document.cookie = `${COOKIE_ROLE}=${role};path=/;max-age=${COOKIE_MAX_AGE_1Y}`;
      }
      if (result?.user) {
        queryClient.setQueryData(["auth", "me"], result.user);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.DASHBOARD);
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
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: (result) => {
      showMessage(result.message);
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
      document.cookie = `${COOKIE_AUTH}=;path=/;max-age=0`;
      document.cookie = `${COOKIE_ROLE}=;path=/;max-age=0`;
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
        document.cookie = `${COOKIE_AUTH}=;path=/;max-age=0`;
        document.cookie = `${COOKIE_ROLE}=;path=/;max-age=0`;
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
      document.cookie = `${COOKIE_AUTH}=;path=/;max-age=0`;
      document.cookie = `${COOKIE_ROLE}=;path=/;max-age=0`;
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
    onError: handleApiError,
  });
}
