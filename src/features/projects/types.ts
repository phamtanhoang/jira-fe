export type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  coverUrl: string | null;
  workspaceId: string;
  leadId: string;
  type: "SCRUM" | "KANBAN";
  visibility: "PUBLIC" | "PRIVATE";
  issueCounter: number;
  createdAt: string;
  updatedAt: string;
  lead?: UserPreview;
  members?: ProjectMember[];
  _count?: { members: number };
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: "LEAD" | "ADMIN" | "DEVELOPER" | "VIEWER";
  joinedAt: string;
  user: UserPreview;
};

export type UserPreview = {
  id: string;
  name: string | null;
  email?: string;
  image: string | null;
};

export type CreateProjectPayload = {
  name: string;
  key: string;
  workspaceId: string;
  description?: string;
  type?: "SCRUM" | "KANBAN";
};

export type Board = {
  id: string;
  name: string;
  projectId: string;
  type: "SCRUM" | "KANBAN";
  columns: BoardColumn[];
  sprints: Sprint[];
};

export type BoardColumn = {
  id: string;
  boardId: string;
  name: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  position: number;
  wipLimit: number | null;
  issues: Issue[];
};

export type Sprint = {
  id: string;
  boardId: string;
  name: string;
  goal: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "CLOSED";
  startDate: string | null;
  endDate: string | null;
};

export type Issue = {
  id: string;
  key: string;
  projectId: string;
  type: "EPIC" | "STORY" | "BUG" | "TASK" | "SUBTASK";
  summary: string;
  description: string | null;
  priority: "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  reporterId: string;
  assigneeId: string | null;
  parentId: string | null;
  epicId: string | null;
  sprintId: string | null;
  boardColumnId: string | null;
  position: number;
  storyPoints: number | null;
  /** Original estimate, in seconds. Null if never set. */
  originalEstimate: number | null;
  /** Remaining estimate, in seconds. Defaults to originalEstimate when first set. */
  remainingEstimate: number | null;
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: UserPreview;
  assignee?: UserPreview | null;
  boardColumn?: { id: string; name: string; category: string } | null;
  sprint?: { id: string; name: string; status: string } | null;
  parent?: { id: string; key: string; summary: string } | null;
  epic?: { id: string; key: string; summary: string } | null;
  labels?: { label: Label }[];
  children?: { id: string; key: string; summary: string; boardColumn?: { id: string; name: string; category: string } | null; assignee?: { id: string; name: string | null } | null }[];
  _count?: { children: number; comments: number; attachments: number };
  /** Set on responses for the currently-authenticated user. Single-issue + dashboard endpoints populate it; board/list endpoints also populate it via `withUserMeta`. */
  starredByMe?: boolean;
  /** Same shape as `starredByMe` — true when the current user is in IssueWatcher. */
  watchedByMe?: boolean;
  outboundLinks?: IssueLink[];
  inboundLinks?: IssueLink[];
};

export type IssueLinkType =
  | "BLOCKS"
  | "RELATES"
  | "DUPLICATES"
  | "CLONED_FROM";

export type IssueLinkPeer = {
  id: string;
  key: string;
  summary: string;
  type: Issue["type"];
  boardColumn?: { id: string; name: string; category: string } | null;
};

export type IssueLink = {
  id: string;
  sourceIssueId: string;
  targetIssueId: string;
  type: IssueLinkType;
  createdAt: string;
  /** Present on `outboundLinks` rows */
  target?: IssueLinkPeer;
  /** Present on `inboundLinks` rows */
  source?: IssueLinkPeer;
};

export type SavedFilter = {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  payload: Record<string, unknown>;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
  owner: UserPreview;
};

export type IssueTemplate = {
  id: string;
  projectId: string;
  name: string;
  type: Issue["type"];
  descriptionHtml: string | null;
  defaultPriority: Issue["priority"] | null;
  defaultLabels: string[];
  createdAt: string;
  updatedAt: string;
};

export type Label = {
  id: string;
  projectId: string;
  name: string;
  color: string;
};

export type CreateIssuePayload = {
  projectId: string;
  summary: string;
  description?: string;
  type?: Issue["type"];
  priority?: Issue["priority"];
  assigneeId?: string;
  parentId?: string;
  sprintId?: string;
  epicId?: string;
  storyPoints?: number;
};

export type MoveIssuePayload = {
  columnId: string;
  position?: number;
};

export type Comment = {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: UserPreview;
  replies?: Comment[];
};

export type Activity = {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  /** Resolved display string (e.g. user name) — falls back to raw value when absent. */
  oldValueDisplay?: string | null;
  newValueDisplay?: string | null;
  createdAt: string;
  user: UserPreview;
};

export type Worklog = {
  id: string;
  issueId: string;
  userId: string;
  timeSpent: number;
  description: string | null;
  startedAt: string;
  createdAt: string;
  user: UserPreview;
};

export type Attachment = {
  id: string;
  issueId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  signedUrl?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: UserPreview;
};

export type MyDashboard = {
  assigned: (Issue & { project?: { id: string; key: string; name: string } })[];
  overdue: Issue[];
  dueSoon: Issue[];
  recent: Issue[];
  starred: (Issue & { project?: { id: string; key: string; name: string } })[];
  stats: { total: number; overdue: number; dueSoon: number; starred: number };
};

export type CreateColumnPayload = {
  name: string;
  category?: "TODO" | "IN_PROGRESS" | "DONE";
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  leadId?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  defaultAssigneeId?: string | null;
};

export type AddProjectMemberPayload = {
  email: string;
  role?: "ADMIN" | "DEVELOPER" | "VIEWER";
};

export type UpdateProjectMemberPayload = {
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
};

export type UpdateSprintPayload = {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type UpdateColumnPayload = {
  name?: string;
  wipLimit?: number | null;
  category?: "TODO" | "IN_PROGRESS" | "DONE";
};
