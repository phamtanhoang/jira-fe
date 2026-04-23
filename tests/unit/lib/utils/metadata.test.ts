/**
 * Tests for generatePageMetadata — builds Next.js Metadata from locale + i18n keys.
 */
import { generatePageMetadata } from "@/lib/utils/metadata";

describe("generatePageMetadata", () => {
  it("returns title/description strings", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
      descKey: "auth.signInDesc",
    });
    expect(typeof meta.title).toBe("string");
    expect(typeof meta.description).toBe("string");
  });

  it("falls back to appSettings.description when descKey is missing", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
      appSettings: { description: "My app tagline" },
    });
    expect(meta.description).toBe("My app tagline");
  });

  it("falls back to title when neither descKey nor appSettings.description provided", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
    });
    expect(meta.description).toBe(meta.title);
  });

  it("attaches openGraph.images when logoUrl is present", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
      appSettings: { logoUrl: "https://example.com/logo.png" },
    });
    const og = meta.openGraph as { images?: Array<{ url: string }> };
    expect(og.images).toBeDefined();
    expect(og.images?.[0].url).toBe("https://example.com/logo.png");
  });

  it("omits openGraph.images when logoUrl absent", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
    });
    const og = meta.openGraph as { images?: unknown };
    expect(og.images).toBeUndefined();
  });

  it("openGraph title/description mirror top-level", () => {
    const meta = generatePageMetadata({
      locale: "en",
      titleKey: "auth.signIn",
      descKey: "auth.signInDesc",
    });
    const og = meta.openGraph as { title: string; description: string };
    expect(og.title).toBe(meta.title);
    expect(og.description).toBe(meta.description);
  });
});
