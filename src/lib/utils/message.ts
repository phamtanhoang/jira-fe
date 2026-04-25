import { toast } from "sonner";
import { AxiosError } from "axios";
import { useAppStore } from "@/lib/stores/use-app-store";
import type { MsgKey } from "@/lib/constants/messages";
import type { MessageKey } from "@/lib/config/i18n";

const SUCCESS_KEYS: Set<string> = new Set([
  "REGISTER_SUCCESS",
  "EMAIL_VERIFIED",
  "LOGOUT_SUCCESS",
  "FORGOT_PASSWORD_SUCCESS",
  "RESET_PASSWORD_SUCCESS",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
  "AVATAR_UPLOADED",
  "SETTINGS_UPDATED",
  "USER_ROLE_UPDATED",
  "USER_DELETED",
  "USER_DEACTIVATED",
  "USER_ACTIVATED",
  "SESSION_REVOKED",
  "SESSIONS_REVOKED",
  "WORKSPACE_DELETED",
  "FLAG_CREATED",
  "FLAG_UPDATED",
  "FLAG_DELETED",
  "MAIL_TEST_SENT",
]);

function translate(key: string): string {
  const { t } = useAppStore.getState();
  const messageKey = `messages.${key}` as MessageKey;
  const translated = t(messageKey);
  // If translation returns the key itself, it means no translation found
  return translated === messageKey ? t("messages.UNKNOWN_ERROR" as MessageKey) : translated;
}

/**
 * Show a toast message for a BE message key.
 * Automatically determines success/error based on the key.
 */
export function showMessage(key: MsgKey | string) {
  const message = translate(key);
  if (SUCCESS_KEYS.has(key)) {
    toast.success(message);
  } else {
    toast.error(message);
  }
}

/**
 * Extract message key from an Axios error and show toast.
 * Returns the translated message string for inline display if needed.
 */
export function handleApiError(error: unknown): string {
  const key =
    error instanceof AxiosError
      ? (error.response?.data?.message ?? error.response?.data?.error ?? "UNKNOWN_ERROR")
      : "UNKNOWN_ERROR";
  const message = translate(key);
  toast.error(message);
  return message;
}
