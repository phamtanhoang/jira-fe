"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { pushBreadcrumb } from "@/lib/logging";

/**
 * Captures user navigation and click events as breadcrumbs.
 * Mount once near the root (inside AppProvider) to observe the whole app.
 *
 * Click handler:
 *  - Registered in capture phase so it fires even for stopPropagation'd clicks
 *  - Records tag name, nearest data-testid, truncated visible text
 *  - Does NOT read input values (avoid leaking passwords into breadcrumbs)
 */
export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  // Navigation breadcrumb on path change
  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    pushBreadcrumb({
      type: "nav",
      message: pathname,
      data: { from: lastPathRef.current ?? null },
    });
    lastPathRef.current = pathname;
  }, [pathname]);

  // Global click listener
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      try {
        const target = e.target as Element | null;
        if (!target || !target.closest) return;

        const testIdEl = target.closest("[data-testid]") as HTMLElement | null;
        const btn = target.closest(
          "button, a, [role=button]",
        ) as HTMLElement | null;
        const el = testIdEl ?? btn ?? (target as HTMLElement);

        const text = (el.textContent ?? "").trim().slice(0, 60);
        pushBreadcrumb({
          type: "click",
          message: text || el.tagName.toLowerCase(),
          data: {
            tag: el.tagName.toLowerCase(),
            testid: testIdEl?.dataset.testid,
          },
        });
      } catch {
        // Never break user interaction due to logging
      }
    };
    document.addEventListener("click", handler, { capture: true });
    return () => {
      document.removeEventListener("click", handler, { capture: true });
    };
  }, []);

  return children;
}
