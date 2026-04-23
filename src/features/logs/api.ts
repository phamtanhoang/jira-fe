import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type { LogsFilters, LogsListResponse, RequestLog } from "./types";

export async function fetchLogs(filters: LogsFilters): Promise<LogsListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  );
  return api
    .get<LogsListResponse>(ENDPOINTS.logs.base, { params })
    .then((r) => r.data);
}

export async function fetchLog(id: string): Promise<RequestLog> {
  return api.get<RequestLog>(ENDPOINTS.logs.byId(id)).then((r) => r.data);
}
