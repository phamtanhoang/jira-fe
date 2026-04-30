export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  /** Workspaces both viewer and target are members of. 0 only ever for self-view. */
  sharedWorkspacesCount: number;
  isSelf: boolean;
};
