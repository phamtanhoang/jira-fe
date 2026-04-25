import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { Issue, IssueTemplate } from "@/features/projects/types";

export type CreateTemplatePayload = {
  projectId: string;
  name: string;
  type?: Issue["type"];
  descriptionHtml?: string;
  defaultPriority?: Issue["priority"];
  defaultLabels?: string[];
};

export type UpdateTemplatePayload = Partial<
  Omit<CreateTemplatePayload, "projectId">
>;

export const issueTemplatesApi = {
  list: (projectId: string) =>
    api
      .get<IssueTemplate[]>(ENDPOINTS.issueTemplates.base, {
        params: { projectId },
      })
      .then((r) => r.data),

  create: (data: CreateTemplatePayload) =>
    api
      .post<{ message: string; template: IssueTemplate }>(
        ENDPOINTS.issueTemplates.base,
        data,
      )
      .then((r) => r.data),

  update: (id: string, data: UpdateTemplatePayload) =>
    api
      .patch<{ message: string; template: IssueTemplate }>(
        ENDPOINTS.issueTemplates.byId(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.issueTemplates.byId(id))
      .then((r) => r.data),
};
