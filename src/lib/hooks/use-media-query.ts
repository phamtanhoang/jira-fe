"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query. Returns the current match state, updating
 * on resize. Defaults to `false` during SSR / first paint so the layout
 * collapses to the desktop branch until hydration runs — matches our
 * dominant-desktop UX.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const MOBILE_BREAKPOINT = "(max-width: 640px)";
