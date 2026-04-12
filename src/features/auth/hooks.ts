"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES, COOKIE_AUTH, COOKIE_MAX_AGE_1Y } from "@/lib/constants";
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
  });

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
      queryClient.setQueryData(["auth", "me"], result.user);
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
    mutationFn: (data: { name?: string }) => authApi.updateProfile(data),
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
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
  });
}
