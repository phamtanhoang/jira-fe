export type NotificationType =
  | "ISSUE_ASSIGNED"
  | "ISSUE_UPDATED"
  | "ISSUE_TRANSITIONED"
  | "COMMENT_CREATED"
  | "MENTION_ISSUE"
  | "MENTION_COMMENT"
  | "WATCH_ACTIVITY";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor: null;
};
