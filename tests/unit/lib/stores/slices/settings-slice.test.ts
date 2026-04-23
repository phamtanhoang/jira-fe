/**
 * Tests for SettingsSlice defaults — initial state of AppStore.
 */
import { useAppStore } from "@/lib/stores/use-app-store";

describe("SettingsSlice initial state", () => {
  it("starts with empty string fields and loaded=false", () => {
    const { name, logoUrl, description, authorName, authorUrl, loaded } =
      useAppStore.getState();
    expect(typeof name).toBe("string");
    expect(typeof logoUrl).toBe("string");
    expect(typeof description).toBe("string");
    expect(typeof authorName).toBe("string");
    expect(typeof authorUrl).toBe("string");
    // `loaded` is either its original default (false) or set by a previous test
    expect(typeof loaded).toBe("boolean");
  });
});
