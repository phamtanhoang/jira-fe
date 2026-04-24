"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog } from "./api";
import type { AuditLogFilters } from "./types";

export function useAuditLog(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ["admin-audit", filters],
    queryFn: () => fetchAuditLog(filters),
  });
}
