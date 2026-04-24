export type AuditAction =
  | "ROLE_CHANGE"
  | "USER_DELETE"
  | "USER_DEACTIVATE"
  | "USER_ACTIVATE"
  | "SESSION_REVOKE"
  | "SESSIONS_REVOKE_ALL"
  | "WORKSPACE_DELETE"
  | "PROJECT_DELETE"
  | "ATTACHMENT_DELETE"
  | "AVATAR_UPDATE"
  | "SETTING_UPDATE"
  | "FLAG_CREATE"
  | "FLAG_UPDATE"
  | "FLAG_DELETE";

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  actorId: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  target: string | null;
  targetType: string | null;
  payload: unknown;
  createdAt: string;
};

export type AuditLogFilters = {
  action?: AuditAction;
  actorId?: string;
  targetType?: string;
  cursor?: string;
  take?: number;
};

export type AuditLogResponse = {
  data: AuditLogRow[];
  nextCursor: string | null;
  hasMore: boolean;
};
