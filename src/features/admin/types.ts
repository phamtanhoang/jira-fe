import type { AppSettings } from "@/lib/types";

export type AppInfoValue = AppSettings;

export type AppEmailValue = {
  email: string;
};

export const SETTING_KEYS = {
  APP_INFO: "app.info",
  APP_EMAIL: "app.email",
  APP_FEATURES: "app.features",
  APP_ANNOUNCEMENT: "app.announcement",
  APP_MAINTENANCE: "app.maintenance",
} as const;

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
