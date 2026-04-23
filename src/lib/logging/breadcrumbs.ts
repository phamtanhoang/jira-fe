import type { Breadcrumb } from "./types";

/**
 * Module-level ring buffer — NOT zustand.
 *
 * Breadcrumbs are append-only diagnostic data. They shouldn't trigger React
 * re-renders (not reactive state), shouldn't be persisted, and shouldn't be
 * shared across tabs. A plain array with a cap is the simplest thing that
 * works and costs nothing when idle.
 */
const CAP = 50;
const buffer: Breadcrumb[] = [];

export function pushBreadcrumb(bc: Omit<Breadcrumb, "timestamp">): void {
  if (buffer.length >= CAP) buffer.shift();
  buffer.push({ ...bc, timestamp: new Date().toISOString() });
}

/** Returns a defensive copy — callers can safely mutate. */
export function snapshotBreadcrumbs(): Breadcrumb[] {
  return buffer.slice();
}

/** Clear all breadcrumbs (useful after reporting an error, or on logout). */
export function clearBreadcrumbs(): void {
  buffer.length = 0;
}
