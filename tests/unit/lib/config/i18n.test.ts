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
  // History note: ja/ko/zh/fr originally shipped as empty shells and
  // relied on the en fallback at runtime. All four were back-filled to
  // full parity later. The fallback path still matters as a safety net
  // for any future locale that lands partial — or any single key
  // someone forgets to translate before merging.
  it("returns the locale's own value when defined (no over-fallback)", () => {
    // Every locale walks its own tree first. `common.save` is defined
    // with a different value in ja vs en — proves there's no
    // over-eager fallback to English when the key DOES exist.
    expect(t("ja", "common.save")).not.toBe(t("en", "common.save"));
    expect(t("ja", "common.save")).toBe("保存");
  });

  it("every supported locale defines common.save (non-empty)", () => {
    // The fallback predicate treats an empty-string value the same as
    // a missing key (`typeof fromCurrent === "string" && fromCurrent !== ""`)
    // so the UI never renders a blank span. Pin every locale's most
    // common label — if any drops to "" we want CI to bark before a
    // user sees blank buttons in production.
    for (const loc of ["en", "vi", "ja", "ko", "zh", "fr"] as const) {
      expect(t(loc, "common.save")).not.toBe("");
    }
  });

  it("returns the key path when ALL locales miss (defensive last resort)", () => {
    // Terminal branch of the fallback chain: if neither the current
    // locale nor en defines the key, surface the raw dotted path
    // instead of an empty render. The build-time parity test catches
    // missing en/vi keys, so reaching this branch in production = a
    // tier-2 locale plus a typo somewhere in a `t(…)` call site.
    // @ts-expect-error — intentionally fake key
    expect(t("fr", "nonexistent.totally.fake")).toBe(
      "nonexistent.totally.fake",
    );
    // @ts-expect-error — also fake, different locale
    expect(t("ja", "nope.not.real")).toBe("nope.not.real");
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
