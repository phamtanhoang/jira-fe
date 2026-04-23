import { useQuery } from "@tanstack/react-query";
import { fetchLog, fetchLogs } from "./api";
import type { LogsFilters } from "./types";

export function useLogs(filters: LogsFilters) {
  return useQuery({
    queryKey: ["logs", filters],
    queryFn: () => fetchLogs(filters),
  });
}

export function useLog(id: string | null) {
  return useQuery({
    queryKey: ["logs", "detail", id],
    queryFn: () => fetchLog(id as string),
    enabled: !!id,
  });
}
