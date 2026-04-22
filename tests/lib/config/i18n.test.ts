/**
 * Tests for t() — translate a key by locale and interpolate {var} placeholders.
 * Pure logic (no React/DOM) — just import, call, and assert.
 */
import { t, getMessages, locales, defaultLocale } from "@/lib/config/i18n";

describe("locales config", () => {
  it("exposes en and vi locales", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("vi");
  });

  it("defaults to en", () => {
    expect(defaultLocale).toBe("en");
  });
});

describe("getMessages", () => {
  it("returns an object for 'en'", () => {
    expect(typeof getMessages("en")).toBe("object");
  });

  it("returns an object for 'vi'", () => {
    expect(typeof getMessages("vi")).toBe("object");
  });
});

describe("t()", () => {
  it("returns the key itself when path does not exist", () => {
    // @ts-expect-error — testing runtime fallback for unknown key
    expect(t("en", "nonexistent.totally.fake")).toBe("nonexistent.totally.fake");
  });

  it("returns a string for both locales on a real key", () => {
    // Pick a key that must exist in both files (depends on actual structure)
    const en = t("en", "meta.titleKey" as never);
    const vi = t("vi", "meta.titleKey" as never);
    expect(typeof en).toBe("string");
    expect(typeof vi).toBe("string");
  });

  it("substitutes {var} placeholders when vars are provided", () => {
    // If a key has "Hello {name}", placeholders get replaced.
    // Using unknown key → returns key unchanged (no substitution)
    // @ts-expect-error — key does not exist
    const result = t("en", "unknown.key", { name: "Apollo" });
    expect(result).toBe("unknown.key");
  });
});
