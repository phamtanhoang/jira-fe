export type MailType = "VERIFICATION" | "PASSWORD_RESET" | "OTHER";
export type MailStatus = "SENT" | "FAILED";

export interface MailLogRow {
  id: string;
  type: MailType;
  status: MailStatus;
  recipient: string;
  subject: string;
  fromEmail: string | null;
  providerId: string | null;
  errorMessage: string | null;
  sentryId: string | null;
  createdAt: string;
}

export interface MailLogFilters {
  status?: MailStatus;
  type?: MailType;
  recipient?: string;
  page: number;
  pageSize: number;
}

export interface MailLogPage {
  data: MailLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor: null;
}

export interface MailStats {
  sent: number;
  failed: number;
  since: string;
}

/** Mirrors `EMAIL_TEMPLATE_SCHEMA` on the BE. We fetch the list of keys +
 *  placeholders + sample preview values so the editor never duplicates
 *  what BE knows. `previewSample` is keyed by placeholder name and
 *  contains BE-resolved values (real `appName`/`logoUrl`/`expiryMinutes`
 *  + sample `otp`/`recipientEmail`). */
export interface EmailTemplateSchema {
  templates: string[];
  placeholders: string[];
  previewSample: Record<string, string>;
}
