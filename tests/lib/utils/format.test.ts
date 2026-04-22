/**
 * Unit tests for format.ts
 *
 * Easiest example — testing pure functions:
 * - No side effects (no API calls, no store reads)
 * - Same input always produces same output
 *
 * Structure: describe("group", () => { it("behavior", () => { expect(...) }) })
 */
import {
  getInitials,
  toggleArrayItem,
  formatDate,
  formatDateShort,
  formatDateTime,
} from "@/lib/utils/format";

describe("getInitials", () => {
  it("returns first letter of name in uppercase", () => {
    expect(getInitials("apollo")).toBe("A");
    expect(getInitials("bob")).toBe("B");
  });

  it("preserves uppercase first letter", () => {
    expect(getInitials("Charlie")).toBe("C");
  });

  it("falls back to email when name is empty string", () => {
    expect(getInitials("", "david@kegmil.ai")).toBe("D");
  });

  it("falls back to email when name is null", () => {
    expect(getInitials(null, "eva@kegmil.ai")).toBe("E");
  });

  it("falls back to email when name is undefined", () => {
    expect(getInitials(undefined, "frank@kegmil.ai")).toBe("F");
  });

  it("returns '?' when both name and email are missing", () => {
    expect(getInitials()).toBe("?");
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials("", "")).toBe("?");
  });
});

describe("toggleArrayItem", () => {
  it("adds item when it does not exist in array", () => {
    expect(toggleArrayItem([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it("removes item when it already exists", () => {
    expect(toggleArrayItem([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("works with strings", () => {
    expect(toggleArrayItem(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleArrayItem(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("returns empty array when removing the only item", () => {
    expect(toggleArrayItem([5], 5)).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3];
    toggleArrayItem(original, 2);
    expect(original).toEqual([1, 2, 3]);
  });
});

describe("formatDate", () => {
  it("formats a date string into short month + day + year", () => {
    const result = formatDate("2026-04-22");
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/22/);
  });

  it("accepts a Date object", () => {
    const result = formatDate(new Date("2026-01-15"));
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
  });
});

describe("formatDateShort", () => {
  it("does NOT include the year", () => {
    const result = formatDateShort("2026-04-22");
    expect(result).toMatch(/Apr/);
    expect(result).not.toMatch(/2026/);
  });
});

describe("formatDateTime", () => {
  it("formats with month, day, and time", () => {
    const result = formatDateTime("2026-04-22T14:30:00");
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/22/);
  });
});
