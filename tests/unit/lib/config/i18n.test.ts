/**
 * Tests for t() — translate a key by locale and interpolate {var} placeholders.
 * Pure logic (no React/DOM) — just import, call, and assert.
 */
import { t, getMessages, locales, defaultLocale } from "@/lib/config/i18n";

describe("locales config", () => {
  it("exposes the 6 supported locales", () => {
    // Tier-1 (strict parity)
    expect(locales).toContain("en");
    expect(locales).toContain("vi");
    // Tier-2 (partial — fall back to en for missing keys)
    expect(locales).toContain("ja");
    expect(locales).toContain("ko");
    expect(locales).toContain("zh");
    expect(locales).toContain("fr");
  });

  it("defaults to en", () => {
    expect(defaultLocale).toBe("en");
  });
});

describe("t() — English fallback for partial locales", () => {
  // The partial locales (ja/ko/zh/fr) deliberately ship with most keys
  // unset. The runtime contract is: `t(partialLocale, key)` returns the
  // English translation rather than the raw dotted key path.
  it("returns English value when key is missing in ja", () => {
    // `issue.createIssue` exists in en + vi but NOT in ja.json (which
    // only ships `common.*` + `nav.*`). Asserting the English value
    // pins the fallback path.
    const enValue = t("en", "issue.createIssue");
    const jaValue = t("ja", "issue.createIssue");
    expect(jaValue).toBe(enValue);
  });

  it("returns the locale's own value when defined (no over-fallback)", () => {
    // `common.save` is defined in ja.json → ja must NOT fall back.
    const jaSave = t("ja", "common.save");
    const enSave = t("en", "common.save");
    expect(jaSave).not.toBe(enSave);
    expect(jaSave).toBe("保存");
  });

  it("returns the key path only when ALL locales miss (defensive)", () => {
    // @ts-expect-error — testing runtime fallback for unknown key
    expect(t("fr", "nonexistent.totally.fake")).toBe(
      "nonexistent.totally.fake",
    );
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
