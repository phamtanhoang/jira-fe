import type { LucideIcon } from "lucide-react";
import {
  Shield,
  UserX,
  UserMinus,
  UserCheck,
  KeyRound,
  LogOut,
  Trash2,
  FolderX,
  Paperclip,
  ImageUp,
  Settings,
  Flag,
  FlagOff,
} from "lucide-react";
import type { AuditAction } from "./types";

export type AuditTone = "default" | "info" | "success" | "warn" | "danger";

type Config = {
  label: string;
  icon: LucideIcon;
  tone: AuditTone;
};

export const AUDIT_ACTION_CONFIG: Record<AuditAction, Config> = {
  ROLE_CHANGE: { label: "Role changed", icon: Shield, tone: "warn" },
  USER_DELETE: { label: "User deleted", icon: UserX, tone: "danger" },
  USER_DEACTIVATE: { label: "User deactivated", icon: UserMinus, tone: "danger" },
  USER_ACTIVATE: { label: "User activated", icon: UserCheck, tone: "success" },
  SESSION_REVOKE: { label: "Session revoked", icon: KeyRound, tone: "warn" },
  SESSIONS_REVOKE_ALL: {
    label: "All sessions revoked",
    icon: LogOut,
    tone: "danger",
  },
  WORKSPACE_DELETE: { label: "Workspace deleted", icon: Trash2, tone: "danger" },
  PROJECT_DELETE: { label: "Project deleted", icon: FolderX, tone: "danger" },
  ATTACHMENT_DELETE: {
    label: "Attachment deleted",
    icon: Paperclip,
    tone: "warn",
  },
  AVATAR_UPDATE: { label: "Avatar updated", icon: ImageUp, tone: "info" },
  SETTING_UPDATE: { label: "Setting updated", icon: Settings, tone: "info" },
  FLAG_CREATE: { label: "Flag created", icon: Flag, tone: "success" },
  FLAG_UPDATE: { label: "Flag updated", icon: Flag, tone: "info" },
  FLAG_DELETE: { label: "Flag deleted", icon: FlagOff, tone: "danger" },
};

export const AUDIT_TONE_CLASS: Record<AuditTone, string> = {
  default:
    "border-border bg-muted/40 text-muted-foreground",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
};

/**
 * Pick a human-readable short description of what happened. Falls back to the
 * action name when we don't have enough payload context to say more.
 */
export function describeAudit(
  action: AuditAction,
  payload: unknown,
): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  const name =
    (typeof p.targetName === "string" && p.targetName) ||
    (typeof p.targetEmail === "string" && p.targetEmail) ||
    null;

  switch (action) {
    case "ROLE_CHANGE":
      if (p.from && p.to) {
        return `${name ?? "user"}: ${String(p.from)} → ${String(p.to)}`;
      }
      return name ?? "Role changed";
    case "USER_DELETE":
      return name ? `Deleted ${name}` : "Deleted user";
    case "USER_DEACTIVATE":
      return name ? `Deactivated ${name}` : "Deactivated user";
    case "USER_ACTIVATE":
      return name ? `Activated ${name}` : "Activated user";
    case "SESSION_REVOKE":
      return "Revoked a single session";
    case "SESSIONS_REVOKE_ALL":
      return "Revoked all sessions for the user";
    case "PROJECT_DELETE":
      return typeof p.targetKey === "string"
        ? `Deleted project ${String(p.targetKey)}`
        : "Deleted project";
    case "ATTACHMENT_DELETE":
      return typeof p.fileName === "string"
        ? `Deleted attachment ${String(p.fileName)}`
        : "Deleted attachment";
    case "AVATAR_UPDATE":
      return "Uploaded a new avatar";
    case "SETTING_UPDATE":
      return typeof p.key === "string"
        ? `Updated setting ${String(p.key)}`
        : "Updated a setting";
    case "FLAG_CREATE":
      return typeof p.key === "string"
        ? `Created flag ${String(p.key)}`
        : "Created a flag";
    case "FLAG_UPDATE":
      return typeof p.key === "string"
        ? `Updated flag ${String(p.key)}`
        : "Updated a flag";
    case "FLAG_DELETE":
      return typeof p.key === "string"
        ? `Deleted flag ${String(p.key)}`
        : "Deleted a flag";
    case "WORKSPACE_DELETE":
      return name ? `Deleted workspace ${name}` : "Deleted workspace";
  }
}
