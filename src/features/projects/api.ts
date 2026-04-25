import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type {
  Project,
  ProjectMember,
  Board,
  Issue,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddProjectMemberPayload,
  UpdateProjectMemberPayload,
  CreateIssuePayload,
  MoveIssuePayload,
  MyDashboard,
  CreateColumnPayload,
  UpdateColumnPayload,
  UpdateSprintPayload,
  Comment,
  Label,
  Activity,
  Worklog,
  Attachment,
  UserPreview,
} from "./types";

export const projectsApi = {
  list: (workspaceId: string) =>
    api
      .get<Project[]>(ENDPOINTS.projects.base, { params: { workspaceId } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Project>(ENDPOINTS.projects.byId(id)).then((r) => r.data),

  create: (data: CreateProjectPayload) =>
    api
      .post<{ message: string; project: Project }>(
        ENDPOINTS.projects.base,
        data,
      )
      .then((r) => r.data),

  update: (id: string, data: UpdateProjectPayload) =>
    api
      .patch<{ message: string; project: Project }>(
        ENDPOINTS.projects.byId(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.projects.byId(id)).then((r) => r.data),

  getMembers: (id: string) =>
    api
      .get<ProjectMember[]>(ENDPOINTS.projects.members(id))
      .then((r) => r.data),

  addMember: (id: string, data: AddProjectMemberPayload) =>
    api
      .post<{ message: string; member: ProjectMember }>(
        ENDPOINTS.projects.members(id),
        data,
      )
      .then((r) => r.data),

  bulkAddMembers: (
    id: string,
    data: { userIds: string[]; role?: "ADMIN" | "DEVELOPER" | "VIEWER" },
  ) =>
    api
      .post<{
        message: string;
        added: number;
        skipped: number;
        members: ProjectMember[];
      }>(`${ENDPOINTS.projects.members(id)}/bulk`, data)
      .then((r) => r.data),

  updateMember: (id: string, memberId: string, data: UpdateProjectMemberPayload) =>
    api
      .patch<{ message: string; member: ProjectMember }>(
        ENDPOINTS.projects.member(id, memberId),
        data,
      )
      .then((r) => r.data),

  removeMember: (id: string, memberId: string) =>
    api
      .delete(ENDPOINTS.projects.member(id, memberId))
      .then((r) => r.data),
};

export const boardsApi = {
  getByProject: (projectId: string) =>
    api
      .get<Board>(ENDPOINTS.boards.byProject(projectId))
      .then((r) => r.data),

  reorderColumns: (boardId: string, columnIds: string[]) =>
    api
      .patch(ENDPOINTS.boards.reorderColumns(boardId), { columnIds })
      .then((r) => r.data),

  addColumn: (boardId: string, data: CreateColumnPayload) =>
    api
      .post(ENDPOINTS.boards.columns(boardId), data)
      .then((r) => r.data),

  updateColumn: (boardId: string, columnId: string, data: UpdateColumnPayload) =>
    api
      .patch(ENDPOINTS.boards.column(boardId, columnId), data)
      .then((r) => r.data),

  deleteColumn: (boardId: string, columnId: string) =>
    api
      .delete(ENDPOINTS.boards.column(boardId, columnId))
      .then((r) => r.data),
};

type PaginatedResponse = {
  data: Issue[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const issuesApi = {
  list: (projectId: string, filters?: Record<string, string>) =>
    api
      .get<Issue[]>(ENDPOINTS.issues.base, {
        params: { projectId, ...filters },
      })
      .then((r) => r.data),

  myDashboard: () =>
    api
      .get<MyDashboard>(ENDPOINTS.issues.myDashboard)
      .then((r) => r.data),

  listPaginated: (projectId: string, params: { take: number; cursor?: string; sprintId?: string }) =>
    api
      .get<PaginatedResponse>(ENDPOINTS.issues.base, {
        params: { projectId, ...params },
      })
      .then((r) => r.data),

  getByKey: (key: string) =>
    api.get<Issue>(ENDPOINTS.issues.byKey(key)).then((r) => r.data),

  create: (data: CreateIssuePayload) =>
    api
      .post<{ message: string; issue: Issue }>(ENDPOINTS.issues.base, data)
      .then((r) => r.data),

  update: (id: string, data: Partial<Issue>) =>
    api
      .patch<{ message: string; issue: Issue }>(
        ENDPOINTS.issues.byId(id),
        data,
      )
      .then((r) => r.data),

  move: (id: string, data: MoveIssuePayload) =>
    api
      .patch<{ message: string; issue: Issue }>(
        ENDPOINTS.issues.move(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.issues.byId(id)).then((r) => r.data),

  bulkUpdate: (data: { issueIds: string[]; sprintId?: string | null; assigneeId?: string | null; priority?: string }) =>
    api.patch<{ message: string; count: number }>(ENDPOINTS.issues.bulk, data).then((r) => r.data),

  bulkDelete: (issueIds: string[]) =>
    api.delete<{ message: string; count: number }>(ENDPOINTS.issues.bulk, { data: { issueIds } }).then((r) => r.data),

  getComments: (issueId: string) =>
    api
      .get<Comment[]>(ENDPOINTS.issues.comments(issueId))
      .then((r) => r.data),

  addComment: (issueId: string, content: string, parentId?: string) =>
    api
      .post<{ message: string; comment: Comment }>(
        ENDPOINTS.issues.comments(issueId),
        { content, parentId },
      )
      .then((r) => r.data),

  updateComment: (commentId: string, content: string) =>
    api
      .patch<{ message: string; comment: Comment }>(
        ENDPOINTS.comments.byId(commentId),
        { content },
      )
      .then((r) => r.data),

  deleteComment: (commentId: string) =>
    api.delete(ENDPOINTS.comments.byId(commentId)).then((r) => r.data),

  getActivity: (issueId: string) =>
    api
      .get<Activity[]>(ENDPOINTS.issues.activity(issueId))
      .then((r) => r.data),

  getWorklogs: (issueId: string) =>
    api
      .get<Worklog[]>(ENDPOINTS.issues.worklogs(issueId))
      .then((r) => r.data),

  addWorklog: (issueId: string, data: { timeSpent: number; startedAt: string; description?: string }) =>
    api
      .post<{ message: string; worklog: Worklog }>(
        ENDPOINTS.issues.worklogs(issueId),
        data,
      )
      .then((r) => r.data),

  updateWorklog: (worklogId: string, data: { timeSpent?: number; startedAt?: string; description?: string }) =>
    api
      .patch<{ message: string; worklog: Worklog }>(
        ENDPOINTS.worklogs.byId(worklogId),
        data,
      )
      .then((r) => r.data),

  deleteWorklog: (worklogId: string) =>
    api.delete(ENDPOINTS.worklogs.byId(worklogId)).then((r) => r.data),

  addLabel: (issueId: string, labelId: string) =>
    api
      .post(ENDPOINTS.issues.labels(issueId, labelId))
      .then((r) => r.data),

  getAttachments: (issueId: string) =>
    api
      .get<Attachment[]>(ENDPOINTS.issues.attachments(issueId))
      .then((r) => r.data),

  uploadAttachments: (issueId: string, files: File[]) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return api
      .post<{ message: string; attachments: Attachment[] }>(
        ENDPOINTS.issues.attachments(issueId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },

  deleteAttachment: (attachmentId: string) =>
    api.delete(ENDPOINTS.attachments.byId(attachmentId)).then((r) => r.data),

  removeLabel: (issueId: string, labelId: string) =>
    api
      .delete(ENDPOINTS.issues.labels(issueId, labelId))
      .then((r) => r.data),

  myStarred: (projectId?: string) =>
    api
      .get<{ issueIds: string[] }>(ENDPOINTS.issues.myStarred, {
        params: projectId ? { projectId } : undefined,
      })
      .then((r) => r.data.issueIds),

  star: (issueId: string) =>
    api
      .post<{ message: string; starred: true }>(ENDPOINTS.issues.star(issueId))
      .then((r) => r.data),

  unstar: (issueId: string) =>
    api
      .delete<{ message: string; starred: false }>(
        ENDPOINTS.issues.star(issueId),
      )
      .then((r) => r.data),

  watch: (issueId: string) =>
    api
      .post<{ message: string; watching: true }>(
        ENDPOINTS.issues.watch(issueId),
      )
      .then((r) => r.data),

  unwatch: (issueId: string) =>
    api
      .delete<{ message: string; watching: false }>(
        ENDPOINTS.issues.watch(issueId),
      )
      .then((r) => r.data),

  getWatchers: (issueId: string) =>
    api
      .get<{ watchers: UserPreview[] }>(ENDPOINTS.issues.watchers(issueId))
      .then((r) => r.data.watchers),

  addLink: (
    issueId: string,
    data: { targetIssueId: string; type: import("./types").IssueLinkType },
  ) =>
    api
      .post<{ message: string; link: import("./types").IssueLink }>(
        ENDPOINTS.issues.links(issueId),
        data,
      )
      .then((r) => r.data),

  removeLink: (issueId: string, linkId: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.issues.link(issueId, linkId))
      .then((r) => r.data),
};

export const labelsApi = {
  list: (projectId: string) =>
    api
      .get<Label[]>(ENDPOINTS.labels.base, { params: { projectId } })
      .then((r) => r.data),

  create: (projectId: string, name: string, color?: string) =>
    api
      .post<{ message: string; label: Label }>(ENDPOINTS.labels.base, {
        projectId,
        name,
        color,
      })
      .then((r) => r.data),
};

export const sprintsApi = {
  create: (boardId: string, name: string) =>
    api
      .post(ENDPOINTS.sprints.base, { boardId, name })
      .then((r) => r.data),

  update: (id: string, data: UpdateSprintPayload) =>
    api
      .patch(ENDPOINTS.sprints.byId(id), data)
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.sprints.byId(id)).then((r) => r.data),

  start: (id: string) =>
    api.post(ENDPOINTS.sprints.start(id)).then((r) => r.data),

  complete: (id: string) =>
    api.post(ENDPOINTS.sprints.complete(id)).then((r) => r.data),

  burndown: (id: string) =>
    api
      .get<{ totalPoints: number; days: { date: string; ideal: number; actual: number }[] }>(
        ENDPOINTS.sprints.burndown(id),
      )
      .then((r) => r.data),
};
