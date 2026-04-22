/**
 * Tests for zod schemas.
 *
 * Zod schemas are CRITICAL business logic — cover both paths:
 * - Happy path (valid data)
 * - Error path (invalid data → correct error message key)
 *
 * With zod: .safeParse(data) returns { success, data?, error? } without throwing.
 */
import {
  loginSchema,
  registerSchema,
  registerFormSchema,
  verifyEmailSchema,
  resetPasswordFormSchema,
} from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("accepts valid email + password", () => {
    const result = loginSchema.safeParse({
      email: "apollo@kegmil.ai",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email with EMAIL_REQUIRED", () => {
    const result = loginSchema.safeParse({ email: "", password: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("EMAIL_REQUIRED");
    }
  });

  it("rejects invalid email format with EMAIL_INVALID", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("EMAIL_INVALID");
    }
  });

  it("rejects empty password with PASSWORD_REQUIRED", () => {
    const result = loginSchema.safeParse({
      email: "apollo@kegmil.ai",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("PASSWORD_REQUIRED");
    }
  });
});

describe("registerSchema password rules", () => {
  const validBase = { name: "Apollo", email: "a@b.co" };

  it("accepts password with upper, lower, digit, special char, 8+ chars", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "Strong1@pass",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password missing uppercase", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "weak1@pass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("PASSWORD_FORMAT");
    }
  });

  it("rejects password missing special char", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "NoSpecial1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "Aa1@",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name with NAME_REQUIRED", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "a@b.co",
      password: "Strong1@pass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path.includes("name"));
      expect(nameIssue?.message).toBe("NAME_REQUIRED");
    }
  });
});

describe("registerFormSchema — confirmPassword matching", () => {
  it("accepts when password === confirmPassword", () => {
    const result = registerFormSchema.safeParse({
      name: "Apollo",
      email: "a@b.co",
      password: "Strong1@pass",
      confirmPassword: "Strong1@pass",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when password !== confirmPassword with PASSWORD_MISMATCH on confirmPassword path", () => {
    const result = registerFormSchema.safeParse({
      name: "Apollo",
      email: "a@b.co",
      password: "Strong1@pass",
      confirmPassword: "Different1@pass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatch = result.error.issues.find(
        (i) => i.message === "PASSWORD_MISMATCH",
      );
      expect(mismatch).toBeDefined();
      expect(mismatch?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("verifyEmailSchema", () => {
  it("accepts a 6-char token", () => {
    const result = verifyEmailSchema.safeParse({
      email: "a@b.co",
      token: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects token with wrong length with TOKEN_LENGTH", () => {
    const result = verifyEmailSchema.safeParse({
      email: "a@b.co",
      token: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("TOKEN_LENGTH");
    }
  });
});

describe("resetPasswordFormSchema", () => {
  it("rejects when newPassword !== confirmPassword", () => {
    const result = resetPasswordFormSchema.safeParse({
      email: "a@b.co",
      token: "123456",
      newPassword: "Strong1@pass",
      confirmPassword: "Other1@pass",
    });
    expect(result.success).toBe(false);
  });
});
