"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { ROUTES, COOKIE_MAX_AGE_1Y } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { authApi } from "./api";
import type { LoginPayload, RegisterPayload, VerifyEmailPayload } from "./types";

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
export function useLogin({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useAppStore();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (result) => {
      document.cookie = `is_authenticated=1;path=/;max-age=${COOKIE_MAX_AGE_1Y}`;
      queryClient.setQueryData(["auth", "me"], result.user);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (error: AxiosError<{ error: string }>) => {
      const key = error.response?.data?.error ?? "UNKNOWN_ERROR";
      onError?.(t(`errors.${key}` as "errors.UNKNOWN_ERROR"));
    },
  });
}

// ─── Register ────────────────────────────────────────────
export function useRegister({
  onSuccess,
  onError,
}: {
  onSuccess?: (email: string) => void;
  onError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const { t } = useAppStore();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: (_, variables) => {
      if (onSuccess) {
        onSuccess(variables.email);
      } else {
        router.push(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(variables.email)}`);
      }
    },
    onError: (error: AxiosError<{ error: string }>) => {
      const key = error.response?.data?.error ?? "UNKNOWN_ERROR";
      onError?.(t(`errors.${key}` as "errors.UNKNOWN_ERROR"));
    },
  });
}

// ─── Verify Email ────────────────────────────────────────
export function useVerifyEmail({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const { t } = useAppStore();

  return useMutation({
    mutationFn: (data: VerifyEmailPayload) => authApi.verifyEmail(data),
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROUTES.SIGN_IN);
      }
    },
    onError: (error: AxiosError<{ error: string }>) => {
      const key = error.response?.data?.error ?? "UNKNOWN_ERROR";
      onError?.(t(`errors.${key}` as "errors.UNKNOWN_ERROR"));
    },
  });
}

// ─── Logout ──────────────────────────────────────────────
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      document.cookie = "is_authenticated=;path=/;max-age=0";
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
  });
}
