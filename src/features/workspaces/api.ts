import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  AddWorkspaceMemberPayload,
  UpdateWorkspaceMemberPayload,
} from "./types";

export const workspacesApi = {
  list: () =>
    api.get<Workspace[]>(ENDPOINTS.workspaces.base).then((r) => r.data),

  getById: (id: string) =>
    api.get<Workspace>(ENDPOINTS.workspaces.byId(id)).then((r) => r.data),

  create: (data: CreateWorkspacePayload) =>
    api
      .post<{ message: string; workspace: Workspace }>(
        ENDPOINTS.workspaces.base,
        data,
      )
      .then((r) => r.data),

  update: (id: string, data: UpdateWorkspacePayload) =>
    api
      .patch<{ message: string; workspace: Workspace }>(
        ENDPOINTS.workspaces.byId(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.workspaces.byId(id)).then((r) => r.data),

  addMember: (id: string, data: AddWorkspaceMemberPayload) =>
    api
      .post<{ message: string; member: WorkspaceMember }>(
        ENDPOINTS.workspaces.members(id),
        data,
      )
      .then((r) => r.data),

  updateMember: (id: string, memberId: string, data: UpdateWorkspaceMemberPayload) =>
    api
      .patch<{ message: string; member: WorkspaceMember }>(
        ENDPOINTS.workspaces.member(id, memberId),
        data,
      )
      .then((r) => r.data),

  removeMember: (id: string, memberId: string) =>
    api
      .delete(ENDPOINTS.workspaces.member(id, memberId))
      .then((r) => r.data),
};
