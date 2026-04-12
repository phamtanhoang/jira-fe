export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string | null; email: string; image: string | null };
  members?: WorkspaceMember[];
  _count?: { members: number; projects: number };
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
};

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export type UpdateWorkspacePayload = {
  name?: string;
  description?: string;
  logoUrl?: string;
};

export type AddWorkspaceMemberPayload = {
  email: string;
  role?: "ADMIN" | "MEMBER" | "VIEWER";
};

export type UpdateWorkspaceMemberPayload = {
  role: "ADMIN" | "MEMBER" | "VIEWER";
};
