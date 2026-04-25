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
  it("accepts a valid Resend config", () => {
    expect(
      appEmailSchema.safeParse({
        provider: "resend",
        fromEmail: "noreply@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects empty fromEmail with EMAIL_REQUIRED", () => {
    const r = appEmailSchema.safeParse({ provider: "resend", fromEmail: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "EMAIL_REQUIRED")).toBe(
        true,
      );
    }
  });

  it("rejects invalid fromEmail with EMAIL_INVALID", () => {
    const r = appEmailSchema.safeParse({
      provider: "resend",
      fromEmail: "not-an-email",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "EMAIL_INVALID")).toBe(
        true,
      );
    }
  });

  it("trims whitespace on fromEmail", () => {
    const r = appEmailSchema.safeParse({
      provider: "resend",
      fromEmail: "  ok@x.co  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.fromEmail).toBe("ok@x.co");
  });

  it("requires every SMTP field when provider=smtp", () => {
    const r = appEmailSchema.safeParse({
      provider: "smtp",
      fromEmail: "ok@x.co",
      smtp: { secure: false },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const missing = r.error.issues
        .filter((i) => i.message === "SMTP_FIELD_REQUIRED")
        .map((i) => i.path.join("."))
        .sort();
      expect(missing).toEqual([
        "smtp.host",
        "smtp.password",
        "smtp.port",
        "smtp.user",
      ]);
    }
  });

  it("accepts a complete SMTP config", () => {
    const r = appEmailSchema.safeParse({
      provider: "smtp",
      fromEmail: "you@x.co",
      smtp: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "you@gmail.com",
        password: "app-pw",
      },
    });
    expect(r.success).toBe(true);
  });
});
