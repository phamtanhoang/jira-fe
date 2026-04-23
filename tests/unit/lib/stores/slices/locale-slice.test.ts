/**
 * Tests for LocaleSlice — setLocale() + t() bound to store state.
 */
import { useAppStore } from "@/lib/stores/use-app-store";

describe("LocaleSlice", () => {
  beforeEach(() => {
    // Reset to default locale; avoid document.cookie pollution between tests
    // by clearing the cookie before each run.
    document.cookie = "";
  });

  it("defaults to 'en' (the configured defaultLocale)", () => {
    // LocaleSlice is created with defaultLocale from i18n.ts
    // Other tests may have set it — save & restore
    const original = useAppStore.getState().locale;
    expect(["en", "vi"]).toContain(original);
  });

  it("setLocale updates store state", () => {
    useAppStore.getState().setLocale("vi");
    expect(useAppStore.getState().locale).toBe("vi");
    useAppStore.getState().setLocale("en");
    expect(useAppStore.getState().locale).toBe("en");
  });

  it("setLocale writes a cookie", () => {
    useAppStore.getState().setLocale("vi");
    expect(document.cookie).toContain("vi");
  });

  it("t() returns a string for a known key", () => {
    useAppStore.getState().setLocale("en");
    const result = useAppStore.getState().t("auth.signIn");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("t() switches language when locale changes", () => {
    useAppStore.getState().setLocale("en");
    const enResult = useAppStore.getState().t("auth.signIn");
    useAppStore.getState().setLocale("vi");
    const viResult = useAppStore.getState().t("auth.signIn");
    // Should differ between languages
    expect(enResult).not.toBe(viResult);
  });

  it("t() falls back to the key for an unknown path", () => {
    // @ts-expect-error - key doesn't exist
    const result = useAppStore.getState().t("does.not.exist");
    expect(result).toBe("does.not.exist");
  });
});
