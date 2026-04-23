/**
 * Additional zod schema tests — covers forgotPasswordSchema, resetPasswordSchema,
 * and the extra edge cases not covered by schemas.test.ts.
 */
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordFormSchema,
  loginSchema,
  registerFormSchema,
  verifyEmailSchema,
} from "@/features/auth/schemas";

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "a@b.co" }).success,
    ).toBe(true);
  });

  it("rejects empty email with EMAIL_REQUIRED", () => {
    const r = forgotPasswordSchema.safeParse({ email: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("EMAIL_REQUIRED");
  });

  it("rejects invalid email format with EMAIL_INVALID", () => {
    const r = forgotPasswordSchema.safeParse({ email: "not-email" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("EMAIL_INVALID");
  });
});

describe("resetPasswordSchema (server-side)", () => {
  it("accepts all valid fields", () => {
    const r = resetPasswordSchema.safeParse({
      email: "a@b.co",
      token: "123456",
      newPassword: "Strong1@pass",
    });
    expect(r.success).toBe(true);
  });

  it("rejects when token length != 6 with TOKEN_LENGTH", () => {
    const r = resetPasswordSchema.safeParse({
      email: "a@b.co",
      token: "1234567",
      newPassword: "Strong1@pass",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "TOKEN_LENGTH")).toBe(
        true,
      );
    }
  });

  it("rejects a weak newPassword with PASSWORD_FORMAT", () => {
    const r = resetPasswordSchema.safeParse({
      email: "a@b.co",
      token: "123456",
      newPassword: "weak",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "PASSWORD_FORMAT")).toBe(
        true,
      );
    }
  });
});

describe("resetPasswordFormSchema — confirmPassword matching", () => {
  it("accepts when newPassword === confirmPassword", () => {
    const r = resetPasswordFormSchema.safeParse({
      email: "a@b.co",
      token: "123456",
      newPassword: "Strong1@pass",
      confirmPassword: "Strong1@pass",
    });
    expect(r.success).toBe(true);
  });

  it("puts PASSWORD_MISMATCH on confirmPassword path", () => {
    const r = resetPasswordFormSchema.safeParse({
      email: "a@b.co",
      token: "123456",
      newPassword: "Strong1@pass",
      confirmPassword: "Different1@",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const mismatch = r.error.issues.find(
        (i) => i.message === "PASSWORD_MISMATCH",
      );
      expect(mismatch?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("aggregated error messages — multiple errors in one payload", () => {
  it("loginSchema surfaces both email + password errors at once", () => {
    const r = loginSchema.safeParse({ email: "", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const messages = r.error.issues.map((i) => i.message);
      expect(messages).toContain("EMAIL_REQUIRED");
      expect(messages).toContain("PASSWORD_REQUIRED");
    }
  });

  it("registerFormSchema surfaces name + email + password + confirm errors", () => {
    const r = registerFormSchema.safeParse({
      name: "",
      email: "bad",
      password: "weak",
      confirmPassword: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const messages = r.error.issues.map((i) => i.message);
      expect(messages).toContain("NAME_REQUIRED");
      expect(messages).toContain("EMAIL_INVALID");
      expect(messages).toContain("PASSWORD_FORMAT");
    }
  });
});

describe("verifyEmailSchema — token length boundary", () => {
  it("rejects token with length 7 (too long)", () => {
    const r = verifyEmailSchema.safeParse({
      email: "a@b.co",
      token: "1234567",
    });
    expect(r.success).toBe(false);
  });

  it("rejects token with length 0 (empty)", () => {
    const r = verifyEmailSchema.safeParse({
      email: "a@b.co",
      token: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts exactly 6-length non-numeric tokens too (length-only check)", () => {
    const r = verifyEmailSchema.safeParse({
      email: "a@b.co",
      token: "abcDEF",
    });
    expect(r.success).toBe(true);
  });
});
