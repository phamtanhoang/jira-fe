import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { MailConfigStatus } from "@/features/admin";
import type {
  MailLogFilters,
  MailLogPage,
  MailLogRow,
  MailStats,
} from "./types";

export const mailLogsApi = {
  list: (filters: MailLogFilters) =>
    api
      .get<MailLogPage>(ENDPOINTS.admin.mailLogs, { params: filters })
      .then((r) => r.data),

  byId: (id: string) =>
    api.get<MailLogRow>(ENDPOINTS.admin.mailLogById(id)).then((r) => r.data),

  stats: () =>
    api.get<MailStats>(ENDPOINTS.admin.mailLogStats).then((r) => r.data),

  configStatus: () =>
    api
      .get<MailConfigStatus>(ENDPOINTS.admin.mailLogConfig)
      .then((r) => r.data),

  sendTest: (to: string) =>
    api
      .post<{ message: string }>(ENDPOINTS.admin.mailTest, { to })
      .then((r) => r.data),

  sendTemplateTest: (to: string, template: "verification" | "resetPassword") =>
    api
      .post<{ message: string }>(ENDPOINTS.admin.mailTemplateTest, {
        to,
        template,
      })
      .then((r) => r.data),
};
