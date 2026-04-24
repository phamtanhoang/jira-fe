import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type { AuditLogFilters, AuditLogResponse } from "./types";

export async function fetchAuditLog(
  filters: AuditLogFilters,
): Promise<AuditLogResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  );
  const res = await api.get<AuditLogResponse>(ENDPOINTS.admin.audit, {
    params,
  });
  return res.data;
}
