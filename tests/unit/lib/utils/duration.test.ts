/**
 * Unit tests for duration.ts — the time-estimate parser used by the
 * issue Estimate sidebar field.
 */
import { formatDuration, parseDuration } from "@/lib/utils/duration";

describe("parseDuration()", () => {
  // ─── Hour + minute combos ─────────────────────────────
  it.each([
    ["2h 30m", 2 * 3600 + 30 * 60],
    ["1h", 3600],
    ["45m", 45 * 60],
    ["3h 15m", 3 * 3600 + 15 * 60],
  ])("parses %p as %p seconds", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it("handles spaces flexibly between number and unit", () => {
    expect(parseDuration("2  h  30  m")).toBe(2 * 3600 + 30 * 60);
    expect(parseDuration("1h30m")).toBe(3600 + 30 * 60);
  });

  it("is case-insensitive", () => {
    expect(parseDuration("2H 30M")).toBe(2 * 3600 + 30 * 60);
    expect(parseDuration("1H")).toBe(3600);
  });

  it("trims surrounding whitespace", () => {
    expect(parseDuration("   1h   ")).toBe(3600);
  });

  // ─── Bare integers = seconds (advanced users) ─────────
  it("treats a bare integer string as raw seconds", () => {
    expect(parseDuration("5400")).toBe(5400);
    expect(parseDuration("60")).toBe(60);
  });

  // ─── Empty / invalid — returns null so BE clears field
  it.each([
    ["", null],
    ["   ", null],
    ["abc", null],
    ["0h 0m", null],
    ["0", null],
    ["1d", null], // days not supported
  ])("returns null for invalid input %p", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  // ─── Partial parse — should NOT silently accept leftover garbage
  // The current implementation accepts "2h foo" because regex picks "2h" — document it.
  it("accepts surrounding text as long as one valid token exists (current behaviour)", () => {
    expect(parseDuration("about 2h please")).toBe(2 * 3600);
  });
});

describe("formatDuration()", () => {
  it.each([
    [null, ""],
    [undefined, ""],
    [0, ""],
  ])("returns empty string for %p", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  it.each([
    [3600, "1h"],
    [2 * 3600, "2h"],
    [60, "1m"],
    [45 * 60, "45m"],
    [3600 + 30 * 60, "1h 30m"],
    [3 * 3600 + 15 * 60, "3h 15m"],
  ])("formats %p seconds as %p", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  it("rounds remaining seconds to the nearest minute", () => {
    // 1h + 90 seconds = 1h 1m 30s → rounds to 1h 2m
    expect(formatDuration(3600 + 90)).toBe("1h 2m");
    // 1h + 29 seconds → 1h 0m → just "1h"
    expect(formatDuration(3600 + 29)).toBe("1h");
  });
});

describe("parseDuration ↔ formatDuration round-trip", () => {
  it.each([
    "1h",
    "2h 30m",
    "45m",
    "3h",
    "1h 5m",
  ])("preserves canonical form for %p", (input) => {
    const sec = parseDuration(input);
    expect(sec).not.toBeNull();
    expect(formatDuration(sec)).toBe(input);
  });
});
