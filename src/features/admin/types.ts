import type { AppSettings } from "@/lib/types";

export type AppInfoValue = AppSettings;

export type MailProvider = "resend" | "smtp";

export type AppEmailValue = {
  provider?: MailProvider;
  fromEmail?: string;
  fromName?: string;
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    /** Sentinel `__keep__` means "preserve existing on save". */
    password?: string;
  };
  /** Legacy single field — kept for backward compat with old saved values. */
  email?: string;
};

export const SMTP_PASSWORD_PLACEHOLDER = "__keep__";

export type MailConfigStatus = {
  configured: boolean;
  provider: MailProvider;
  fromEmail: string | null;
  missing: string[];
};

export const SETTING_KEYS = {
  APP_INFO: "app.info",
  APP_EMAIL: "app.email",
  APP_FEATURES: "app.features",
  APP_ANNOUNCEMENT: "app.announcement",
  APP_MAINTENANCE: "app.maintenance",
  APP_AUTH_PROVIDERS: "app.auth_providers",
  APP_QUOTAS: "app.quotas",
  APP_EMAIL_TEMPLATES: "app.email_templates",
} as const;

export type QuotasValue = {
  maxProjectsPerWorkspace: number;
  maxMembersPerWorkspace: number;
  maxStorageGB: number;
};

export const DEFAULT_QUOTAS: QuotasValue = {
  maxProjectsPerWorkspace: 0,
  maxMembersPerWorkspace: 0,
  maxStorageGB: 0,
};

export type AuthProvidersValue = {
  password: boolean;
  google: boolean;
  github: boolean;
};

export const DEFAULT_AUTH_PROVIDERS: AuthProvidersValue = {
  password: true,
  google: true,
  github: true,
};

export type EmailTemplate = {
  subject: string;
  html: string;
};

export type EmailTemplatesValue = {
  verification: EmailTemplate;
  resetPassword: EmailTemplate;
  welcome: EmailTemplate;
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplatesValue = {
  verification: { subject: "", html: "" },
  resetPassword: { subject: "", html: "" },
  welcome: { subject: "", html: "" },
};

export type EmailTemplateKey = keyof EmailTemplatesValue;

export type FeatureFlags = Record<string, boolean>;

export type AnnouncementSeverity = "info" | "warn" | "critical";

export type AnnouncementValue = {
  enabled: boolean;
  message: string;
  severity: AnnouncementSeverity;
};

export const DEFAULT_ANNOUNCEMENT: AnnouncementValue = {
  enabled: false,
  message: "",
  severity: "info",
};

export type MaintenanceValue = {
  enabled: boolean;
  message: string;
  allowedEmails: string[];
};

export const DEFAULT_MAINTENANCE: MaintenanceValue = {
  enabled: false,
  message: "",
  allowedEmails: [],
};

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/** Shape of GET /settings/:key — the full Setting row. */
export type SettingRow<T = unknown> = {
  key: string;
  value: T;
  updatedAt: string;
};
