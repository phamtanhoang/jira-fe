"use client";

import { useEffect, useState } from "react";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  broadcastInvalidate,
  subscribeBroadcast,
} from "@/lib/react-query/broadcast";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    // MutationCache.onSettled fires for every mutation (success + error).
    // Our mutations already invalidate the local cache via
    // `extraInvalidateKeys` or hand-rolled onSettled. Here we relay the
    // same keys to OTHER tabs over BroadcastChannel so they re-fetch in
    // sync — cross-tab work no longer feels stale until manual reload.
    //
    // Opt-in: a mutation must set `meta: { broadcastKeys: [...] }` (see
    // useInvalidatingMutation). Mutations that don't set it stay silent.
    const mutationCache = new MutationCache({
      onSettled: (_data, _error, _vars, _ctx, mutation) => {
        const meta = mutation.options.meta as
          | { broadcastKeys?: unknown }
          | undefined;
        const keys = meta?.broadcastKeys;
        if (Array.isArray(keys) && keys.length > 0) {
          broadcastInvalidate(
            keys as Parameters<typeof broadcastInvalidate>[0],
          );
        }
      },
    });

    return new QueryClient({
      mutationCache,
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
          // Refetch when the tab regains focus — pairs with the
          // BroadcastChannel listener below. Long-staleTime queries like
          // /auth/me opt out via their own `refetchOnWindowFocus: false`
          // overrides; everything else inherits true.
          refetchOnWindowFocus: true,
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  // One BroadcastChannel listener per QueryProvider mount; translates
  // remote invalidation messages into local cache invalidations.
  useEffect(() => {
    return subscribeBroadcast(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
