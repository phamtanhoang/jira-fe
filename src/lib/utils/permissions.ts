/**
 * FE mirror of `jira-be/src/core/utils/permissions.util.ts`.
 *
 * Keep the two files in sync. Whenever you add a new
 * `WorkspaceAction` / `ProjectAction` on the BE, add it here too — the
 * BE will reject the request anyway, but a UI that LOOKS clickable and
 * then 403s is worse UX than one that hides the action entirely.
 *
 * Used by the `useProjectRole` / `useWorkspaceRole` hooks (next to
 * this file) so components can:
 *
 *   const can = useProjectPermissions(projectId);
 *   {can("CREATE_ISSUE") && <Button>+ Create issue</Button>}
 *
 * without having to plumb role state through every prop.
 */

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type ProjectRole = "LEAD" | "ADMIN" | "DEVELOPER" | "VIEWER";

export type WorkspaceAction =
  | "UPDATE_WORKSPACE"
  | "DELETE_WORKSPACE"
  | "TRANSFER_OWNERSHIP"
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_MEMBER_ROLE"
  | "CREATE_PROJECT"
  | "MANAGE_WEBHOOKS"
  | "MANAGE_INVITE_LINKS";

export type ProjectAction =
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_MEMBER_ROLE"
  | "MANAGE_BOARD"
  | "MANAGE_SPRINT"
  | "MANAGE_LABELS"
  | "MANAGE_TEMPLATES"
  | "MANAGE_CUSTOM_FIELDS"
  | "CREATE_ISSUE"
  | "UPDATE_ISSUE"
  | "DELETE_ISSUE";

const WORKSPACE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 40,
  ADMIN: 30,
  MEMBER: 20,
  VIEWER: 10,
};

const PROJECT_RANK: Record<ProjectRole, number> = {
  LEAD: 40,
  ADMIN: 30,
  DEVELOPER: 20,
  VIEWER: 10,
};

const WORKSPACE_REQUIRED: Record<WorkspaceAction, number> = {
  TRANSFER_OWNERSHIP: 40,
  DELETE_WORKSPACE: 40,
  UPDATE_WORKSPACE: 30,
  INVITE_MEMBER: 30,
  REMOVE_MEMBER: 30,
  UPDATE_MEMBER_ROLE: 30,
  MANAGE_WEBHOOKS: 30,
  MANAGE_INVITE_LINKS: 30,
  CREATE_PROJECT: 20,
};

const PROJECT_REQUIRED: Record<ProjectAction, number> = {
  DELETE_PROJECT: 40,
  UPDATE_PROJECT: 30,
  INVITE_MEMBER: 30,
  REMOVE_MEMBER: 30,
  UPDATE_MEMBER_ROLE: 30,
  MANAGE_BOARD: 30,
  MANAGE_SPRINT: 30,
  MANAGE_LABELS: 30,
  MANAGE_TEMPLATES: 30,
  MANAGE_CUSTOM_FIELDS: 30,
  UPDATE_ISSUE: 20,
  CREATE_ISSUE: 20,
  DELETE_ISSUE: 30,
};

export function canDoWorkspace(
  role: WorkspaceRole | undefined | null,
  action: WorkspaceAction,
): boolean {
  if (!role) return false;
  return WORKSPACE_RANK[role] >= WORKSPACE_REQUIRED[action];
}

export function canDoProject(
  role: ProjectRole | undefined | null,
  action: ProjectAction,
): boolean {
  if (!role) return false;
  return PROJECT_RANK[role] >= PROJECT_REQUIRED[action];
}
