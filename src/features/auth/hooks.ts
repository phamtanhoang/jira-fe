"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES, COOKIE_MAX_AGE_1Y } from "@/lib/constants";
import { handleApiError, showMessage } from "@/lib/utils";
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
export function useLogin({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

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
    onError: handleApiError,
  });
}

// ─── Register ────────────────────────────────────────────
export function useRegister({ onSuccess }: { onSuccess?: (email: string) => void } = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: (_, variables) => {
      showMessage("REGISTER_SUCCESS");
      if (onSuccess) {
        onSuccess(variables.email);
      } else {
        router.push(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(variables.email)}`);
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
      document.cookie = "is_authenticated=;path=/;max-age=0";
      queryClient.clear();
      router.push(ROUTES.SIGN_IN);
    },
  });
}
