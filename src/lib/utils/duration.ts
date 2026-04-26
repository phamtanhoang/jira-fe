/**
 * Duration parsing/formatting for the issue Estimate field.
 *
 * Storage format: integer seconds. UI format: "2h 30m" / "1h" / "45m".
 * The user can also paste raw seconds (a bare integer string).
 */

/**
 * "2h 30m" / "1h" / "45m" / "5400" (raw seconds) → seconds.
 * Returns null for empty/invalid input so the BE can clear the field.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  // Bare integer → assume seconds (advanced users)
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed);
    return n > 0 ? n : null;
  }
  let total = 0;
  const re = /(\d+)\s*([hm])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(trimmed)) !== null) {
    const n = parseInt(match[1]);
    if (match[2] === "h") total += n * 3600;
    else if (match[2] === "m") total += n * 60;
  }
  return total > 0 ? total : null;
}

/** Inverse of parseDuration. Returns "" for null/0 so callers can fall back. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
