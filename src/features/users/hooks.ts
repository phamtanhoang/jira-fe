import { useQuery } from "@tanstack/react-query";
import { STALE_AUTH_USER } from "@/lib/constants/query-stale";
import { usersApi } from "./api";

/**
 * User profile — same person rarely changes name/avatar so a long stale
 * window is fine; navigating between mentions then back doesn't refetch.
 */
export function useUserProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["user", id, "profile"],
    queryFn: () => usersApi.getProfile(id!),
    enabled: !!id,
    staleTime: STALE_AUTH_USER,
    refetchOnWindowFocus: false,
  });
}
