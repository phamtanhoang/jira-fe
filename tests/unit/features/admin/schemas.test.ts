/**
 * Tests for admin settings zod schemas.
 */
import { appInfoSchema, appEmailSchema } from "@/features/admin/schemas";

describe("appInfoSchema", () => {
  it("accepts a minimal payload (name only)", () => {
    const r = appInfoSchema.safeParse({ name: "MyApp" });
    expect(r.success).toBe(true);
  });

  it("accepts a full payload", () => {
    const r = appInfoSchema.safeParse({
      name: "MyApp",
      logoUrl: "https://example.com/logo.png",
      description: "A nice app",
      authorName: "Team",
      authorUrl: "https://example.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty name with NAME_REQUIRED", () => {
    const r = appInfoSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "NAME_REQUIRED")).toBe(
        true,
      );
    }
  });

  it("rejects invalid logoUrl with URL_INVALID", () => {
    const r = appInfoSchema.safeParse({ name: "X", logoUrl: "not-a-url" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "URL_INVALID")).toBe(
        true,
      );
    }
  });

  it("accepts empty logoUrl (optional)", () => {
    expect(
      appInfoSchema.safeParse({ name: "X", logoUrl: "" }).success,
    ).toBe(true);
  });

  it("rejects invalid authorUrl", () => {
    const r = appInfoSchema.safeParse({ name: "X", authorUrl: "bad" });
    expect(r.success).toBe(false);
  });

  it("rejects name longer than 80 chars", () => {
    const r = appInfoSchema.safeParse({ name: "x".repeat(81) });
    expect(r.success).toBe(false);
  });
});

describe("appEmailSchema", () => {
  it("accepts a valid email", () => {
    expect(
      appEmailSchema.safeParse({ email: "noreply@example.com" }).success,
    ).toBe(true);
  });

  it("rejects empty email with EMAIL_REQUIRED", () => {
    const r = appEmailSchema.safeParse({ email: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("EMAIL_REQUIRED");
    }
  });

  it("rejects invalid email format with EMAIL_INVALID", () => {
    const r = appEmailSchema.safeParse({ email: "not-an-email" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.message === "EMAIL_INVALID"),
      ).toBe(true);
    }
  });

  it("trims whitespace on email", () => {
    const r = appEmailSchema.safeParse({ email: "  ok@x.co  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ok@x.co");
  });
});
