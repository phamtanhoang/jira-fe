/**
 * Tests for issue-config constants — ensure every enum value has a config entry.
 */
import {
  TYPE_CONFIG,
  PRIORITY_CONFIG,
  STATUS_DOT_COLORS,
  STATUS_BADGE_COLORS,
  ISSUE_TYPES,
  PRIORITIES,
  UNASSIGNED_VALUE,
  AVATAR_GRADIENT,
} from "@/lib/constants/issue-config";

describe("ISSUE_TYPES", () => {
  it("includes every expected type", () => {
    expect(ISSUE_TYPES).toEqual(["EPIC", "STORY", "BUG", "TASK", "SUBTASK"]);
  });

  it("every type has a matching TYPE_CONFIG entry", () => {
    for (const type of ISSUE_TYPES) {
      expect(TYPE_CONFIG[type]).toBeDefined();
      expect(TYPE_CONFIG[type].icon).toBeDefined();
      expect(typeof TYPE_CONFIG[type].bg).toBe("string");
      expect(TYPE_CONFIG[type].bg.length).toBeGreaterThan(0);
    }
  });
});

describe("PRIORITIES", () => {
  it("includes every expected priority (5 levels)", () => {
    expect(PRIORITIES).toEqual([
      "HIGHEST",
      "HIGH",
      "MEDIUM",
      "LOW",
      "LOWEST",
    ]);
  });

  it("every priority has a matching PRIORITY_CONFIG entry", () => {
    for (const p of PRIORITIES) {
      expect(PRIORITY_CONFIG[p]).toBeDefined();
      expect(PRIORITY_CONFIG[p].icon).toBeDefined();
      expect(typeof PRIORITY_CONFIG[p].color).toBe("string");
      expect(PRIORITY_CONFIG[p].color).toMatch(/^text-/);
    }
  });
});

describe("STATUS_DOT_COLORS / STATUS_BADGE_COLORS", () => {
  const categories = ["TODO", "IN_PROGRESS", "DONE"] as const;

  it("covers all 3 status categories in both maps", () => {
    for (const c of categories) {
      expect(STATUS_DOT_COLORS[c]).toBeDefined();
      expect(STATUS_BADGE_COLORS[c]).toBeDefined();
    }
  });

  it("badge colors include both bg + text classes", () => {
    for (const c of categories) {
      expect(STATUS_BADGE_COLORS[c]).toMatch(/bg-/);
      expect(STATUS_BADGE_COLORS[c]).toMatch(/text-/);
    }
  });
});

describe("magic constants", () => {
  it("UNASSIGNED_VALUE is the sentinel used across Select components", () => {
    expect(UNASSIGNED_VALUE).toBe("__none__");
  });

  it("AVATAR_GRADIENT is a non-empty tailwind class string", () => {
    expect(typeof AVATAR_GRADIENT).toBe("string");
    expect(AVATAR_GRADIENT).toMatch(/bg-linear/);
  });
});
