import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { SavedFilter } from "@/features/projects/types";

export const savedFiltersApi = {
  list: (projectId: string) =>
    api
      .get<SavedFilter[]>(ENDPOINTS.savedFilters.base, { params: { projectId } })
      .then((r) => r.data),

  create: (data: {
    projectId: string;
    name: string;
    payload: Record<string, unknown>;
    shared?: boolean;
  }) =>
    api
      .post<{ message: string; filter: SavedFilter }>(
        ENDPOINTS.savedFilters.base,
        data,
      )
      .then((r) => r.data),

  update: (
    id: string,
    data: { name?: string; payload?: Record<string, unknown>; shared?: boolean },
  ) =>
    api
      .patch<{ message: string; filter: SavedFilter }>(
        ENDPOINTS.savedFilters.byId(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.savedFilters.byId(id))
      .then((r) => r.data),
};
