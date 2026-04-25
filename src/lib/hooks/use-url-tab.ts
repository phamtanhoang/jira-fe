"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Sync a tab value with the URL `?tab=` query param. Refresh / share / back
 * button all preserve the current tab; switching tabs updates the URL without
 * triggering a full navigation.
 *
 * Usage:
 *   const [tab, setTab] = useUrlTab(["requests", "audit", "mail"], "requests");
 *   <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
 *
 * The hook is generic over the union of allowed values so the consumer keeps
 * its strict tab type.
 */
export function useUrlTab<T extends string>(
  values: readonly T[],
  fallback: T,
  paramName = "tab",
): [T, (next: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const valid = useMemo(() => new Set<string>(values), [values]);

  const initial = useMemo<T>(() => {
    const raw = searchParams.get(paramName);
    return raw && valid.has(raw) ? (raw as T) : fallback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTabState] = useState<T>(initial);

  // Keep state in sync if the URL changes externally (back/forward, deep link).
  useEffect(() => {
    const raw = searchParams.get(paramName);
    const next = raw && valid.has(raw) ? (raw as T) : fallback;
    if (next !== tab) setTabState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, paramName, fallback]);

  const setTab = useCallback(
    (next: T) => {
      setTabState(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === fallback) params.delete(paramName);
      else params.set(paramName, next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams, paramName, fallback],
  );

  return [tab, setTab];
}
