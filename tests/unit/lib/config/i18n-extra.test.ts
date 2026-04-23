/**
 * Additional tests for t() — variable interpolation on real messages.
 */
import { t } from "@/lib/config/i18n";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

describe("t() with real messages", () => {
  it("returns the EN string for auth.signIn", () => {
    expect(t("en", "auth.signIn")).toBe(en.auth.signIn);
  });

  it("returns the VI string for auth.signIn", () => {
    expect(t("vi", "auth.signIn")).toBe(vi.auth.signIn);
  });

  it("substitutes {name} in auth.signInDesc", () => {
    const result = t("en", "auth.signInDesc", { name: "MyApp" });
    expect(result).toContain("MyApp");
    expect(result).not.toContain("{name}");
  });

  it("leaves placeholder when variable not provided", () => {
    const result = t("en", "auth.signInDesc");
    expect(result).toContain("{name}");
  });

  it("leaves unknown placeholders in the raw template alone", () => {
    // If an EN template had {foo} that isn't in vars, should stay {foo}
    const result = t("en", "auth.signInDesc", { other: "x" });
    expect(result).toContain("{name}");
  });
});

describe("t() traversal edge cases", () => {
  it("returns key when an intermediate path hits a string (not object)", () => {
    // @ts-expect-error — deliberately descending into a leaf
    const result = t("en", "auth.signIn.extra.more");
    expect(result).toBe("auth.signIn.extra.more");
  });

  it("returns key when final resolved value is not a string (e.g. an object)", () => {
    // @ts-expect-error — 'auth' resolves to an object, not a string
    expect(t("en", "auth")).toBe("auth");
  });
});
