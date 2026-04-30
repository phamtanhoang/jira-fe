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
  // Legacy key from BE before the rename — kept so the toast stays "success"
  // green during the rolling deploy window. Safe to drop once every BE is on
  // the new build.
  "MAIL_RETRIED",
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
 * Maps stable BE `errorCode` (set by `BaseAppException` subclasses) to a
 * frontend i18n key under `messages.errorCode.*`. Lets us show a more
 * specific toast — e.g. PROJECT_ACCESS_DENIED → "You're not a member of
 * this project. Ask the project lead to invite you." — instead of the raw
 * BE message constant.
 *
 * Falls back to the BE `message` field when the code isn't mapped, so
 * existing toasts keep working unchanged. Mapping is additive — add an
 * entry only when the per-code UX should differ from the generic message.
 */
const ERROR_CODE_OVERRIDES: Record<string, string> = {
  WORKSPACE_ACCESS_DENIED: "messages.errorCode.WORKSPACE_ACCESS_DENIED",
  PROJECT_ACCESS_DENIED: "messages.errorCode.PROJECT_ACCESS_DENIED",
  INSUFFICIENT_PERMISSIONS: "messages.errorCode.INSUFFICIENT_PERMISSIONS",
  QUOTA_EXCEEDED: "messages.errorCode.QUOTA_EXCEEDED",
  ISSUE_LINK_SELF: "messages.errorCode.ISSUE_LINK_SELF",
  ISSUE_LINK_EXISTS: "messages.errorCode.ISSUE_LINK_EXISTS",
  SHARE_TOKEN_EXPIRED: "messages.errorCode.SHARE_TOKEN_EXPIRED",
};

/**
 * Extract message key from an Axios error and show toast.
 *
 * Resolution order:
 * 1. `errorCode` (machine-stable, from `BaseAppException`) → look up override
 * 2. `message` field (i18n key from MSG.ERROR.*) → translate
 * 3. UNKNOWN_ERROR fallback
 *
 * Returns the translated message string for inline display if needed.
 */
export function handleApiError(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    const fallback = translate("UNKNOWN_ERROR");
    toast.error(fallback);
    return fallback;
  }

  const data = (error.response?.data ?? {}) as {
    errorCode?: string;
    message?: string;
    error?: string;
  };
  const errorCode = typeof data.errorCode === "string" ? data.errorCode : null;
  const messageKey =
    typeof data.message === "string"
      ? data.message
      : typeof data.error === "string"
        ? data.error
        : "UNKNOWN_ERROR";

  // Prefer the per-code override when one is registered. Fall back to the
  // BE message key (already i18n) so untouched toasts keep working.
  if (errorCode && ERROR_CODE_OVERRIDES[errorCode]) {
    const overrideKey = ERROR_CODE_OVERRIDES[errorCode] as MessageKey;
    const { t } = useAppStore.getState();
    const translated = t(overrideKey);
    // Sentinel: translation returns the key itself when missing — fall
    // through to legacy translate(messageKey) which has its own fallback.
    if (translated !== overrideKey) {
      toast.error(translated);
      return translated;
    }
  }

  const message = translate(messageKey);
  toast.error(message);
  return message;
}
