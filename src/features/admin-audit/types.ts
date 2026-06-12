// Mirror of BE `AuditAction` union in
// `jira-be/src/modules/admin-audit/admin-audit.service.ts`. When the BE
// adds a new action, ADD it here AND update `AUDIT_ACTION_CONFIG` +
// `describeAudit` so the panel doesn't crash on the unknown row.
export type AuditAction =
  | "ROLE_CHANGE"
  | "USER_DELETE"
  | "USER_DEACTIVATE"
  | "USER_ACTIVATE"
  | "USERS_BULK_INVITE"
  | "SESSION_REVOKE"
  | "SESSIONS_REVOKE_ALL"
  | "WORKSPACE_DELETE"
  | "WORKSPACE_OWNER_TRANSFER"
  | "WORKSPACE_MEMBER_ADD"
  | "WORKSPACE_MEMBER_REMOVE"
  | "WORKSPACE_MEMBER_ROLE_UPDATE"
  | "PROJECT_DELETE"
  | "PROJECT_MEMBER_ADD"
  | "PROJECT_MEMBER_REMOVE"
  | "PROJECT_MEMBER_ROLE_UPDATE"
  | "ATTACHMENT_DELETE"
  | "AVATAR_UPDATE"
  | "SETTING_UPDATE"
  | "FLAG_CREATE"
  | "FLAG_UPDATE"
  | "FLAG_DELETE"
  | "THROTTLE_OVERRIDE_CREATE"
  | "THROTTLE_OVERRIDE_UPDATE"
  | "THROTTLE_OVERRIDE_DELETE"
  | "WEBHOOK_CREATE"
  | "WEBHOOK_UPDATE"
  | "WEBHOOK_DELETE"
  | "WEBHOOK_TEST"
  | "WEBHOOK_ROTATE_SECRET";

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
  page?: number;
  take?: number;
};

export type AuditLogResponse = {
  data: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  // Deprecated — kept so old callers don't throw. Use `page` + `totalPages`.
  nextCursor: string | null;
};
