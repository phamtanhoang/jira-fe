"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { getSetting, setSetting } from "./api";
import type { SettingRow } from "./types";

export function useSetting<T>(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => getSetting<T>(key),
  });
}

export function useUpdateSetting<T>(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: T) => setSetting<T>(key, value),
    onSuccess: (row) => {
      queryClient.setQueryData<SettingRow<T> | null>(["settings", key], row);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      showMessage("SETTINGS_UPDATED");
    },
    onError: handleApiError,
  });
}
