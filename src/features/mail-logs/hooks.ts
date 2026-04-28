"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_FEATURE_FLAGS } from "@/lib/constants/query-stale";
import { handleApiError, showMessage } from "@/lib/utils";
import { mailLogsApi } from "./api";
import type { MailLogFilters } from "./types";

export function useMailLogs(filters: MailLogFilters) {
  return useQuery({
    queryKey: ["mail-logs", filters],
    queryFn: () => mailLogsApi.list(filters),
  });
}

export function useMailLog(id: string | null) {
  return useQuery({
    queryKey: ["mail-log", id],
    queryFn: () => mailLogsApi.byId(id!),
    enabled: !!id,
  });
}

export function useMailStats() {
  return useQuery({
    queryKey: ["mail-stats"],
    queryFn: () => mailLogsApi.stats(),
  });
}

export function useMailConfigStatus() {
  return useQuery({
    queryKey: ["mail-config-status"],
    queryFn: () => mailLogsApi.configStatus(),
  });
}

/**
 * Schema for the admin email-template editor — list of template keys and
 * placeholder names. Almost-static, so cache for 10 min and skip
 * focus-refetch (matches how the editor uses it: hint chips + tabs).
 */
export function useEmailTemplateSchema() {
  return useQuery({
    queryKey: ["mail-template-schema"],
    queryFn: () => mailLogsApi.templateSchema(),
    staleTime: STALE_FEATURE_FLAGS,
    refetchOnWindowFocus: false,
  });
}

export function useSendTestMail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (to: string) => mailLogsApi.sendTest(to),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["mail-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mail-stats"] });
      queryClient.invalidateQueries({ queryKey: ["mail-config-status"] });
    },
    onError: handleApiError,
  });
}
