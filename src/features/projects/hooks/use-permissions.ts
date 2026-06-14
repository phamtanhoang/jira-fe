"use client";

import {
  canDoProject,
  canDoWorkspace,
  type ProjectAction,
  type ProjectRole,
  type WorkspaceAction,
  type WorkspaceRole,
} from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import { useProject } from "./use-projects";

/**
 * Resolve the current user's role inside a project and return a predicate
 * for action gating. Workspace OWNER / ADMIN inherit ADMIN-equivalent
 * project privileges so a workspace admin who never joined a specific
 * project still sees its admin actions.
 *
 * Returns `null` while the project (or current user) hasn't loaded so
 * callers can render a non-flickering skeleton:
 *
 *   const can = useProjectPermissions(projectId);
 *   if (can === null) return <Skeleton />;
 *   {can("CREATE_ISSUE") && <Button>+ Create</Button>}
 *
 * We deliberately compute the predicate inline rather than memoizing —
 * the predicate closes over `role` which changes whenever upstream
 * queries refetch, and React 19's compiler refuses to preserve a memo
 * whose return value flips identity. The closure is cheap; consumers
 * that care about referential equality should destructure to a role
 * string instead.
 */
export function useProjectPermissions(projectId: string | undefined) {
  const { user } = useCurrentUser();
  const { data: project } = useProject(projectId ?? "");
  const { data: workspace } = useWorkspace(project?.workspaceId ?? "");

  if (!user || !project) return null;

  // Workspace OWNER / ADMIN bypass to project ADMIN. Below ADMIN
  // (MEMBER / VIEWER) defers to the explicit ProjectMember row.
  const wsMember = (workspace?.members ?? []).find(
    (m) => m.userId === user.id,
  );
  const wsRole = wsMember?.role as WorkspaceRole | undefined;
  if (wsRole === "OWNER" || wsRole === "ADMIN") {
    // Treat as project ADMIN for action gating. Matches BE behaviour in
    // `assertProjectAccess` which lets workspace OWNER/ADMIN through
    // without an explicit ProjectMember row.
    return (action: ProjectAction) => canDoProject("ADMIN", action);
  }

  const pjMember = (project.members ?? []).find((m) => m.userId === user.id);
  const role = pjMember?.role as ProjectRole | undefined;
  return (action: ProjectAction) => canDoProject(role, action);
}

/**
 * Same idea, but for workspace-scoped actions (invite member, manage
 * webhooks, transfer ownership, …).
 */
export function useWorkspacePermissions(workspaceId: string | undefined) {
  const { user } = useCurrentUser();
  const { data: workspace } = useWorkspace(workspaceId ?? "");

  if (!user || !workspace) return null;
  const member = (workspace.members ?? []).find((m) => m.userId === user.id);
  const role = member?.role as WorkspaceRole | undefined;
  return (action: WorkspaceAction) => canDoWorkspace(role, action);
}
