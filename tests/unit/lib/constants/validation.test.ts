/**
 * Tests for regex constants — EMAIL_REGEX and PASSWORD_REGEX.
 *
 * These regexes are the single source of truth for client-side validation,
 * so we cover both accept + reject paths thoroughly.
 */
import {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  VERIFICATION_CODE_LENGTH,
} from "@/lib/constants/validation";

describe("VERIFICATION_CODE_LENGTH", () => {
  it("is 6 (matches BE OTP length)", () => {
    expect(VERIFICATION_CODE_LENGTH).toBe(6);
  });
});

describe("EMAIL_REGEX", () => {
  it("accepts standard emails", () => {
    expect(EMAIL_REGEX.test("a@b.co")).toBe(true);
    expect(EMAIL_REGEX.test("apollo@3hteam.ai")).toBe(true);
    expect(EMAIL_REGEX.test("user.name+tag@example.com")).toBe(true);
  });

  it("rejects emails without @", () => {
    expect(EMAIL_REGEX.test("no-at-sign.com")).toBe(false);
  });

  it("rejects emails without domain", () => {
    expect(EMAIL_REGEX.test("a@")).toBe(false);
  });

  it("rejects emails without TLD", () => {
    expect(EMAIL_REGEX.test("a@b")).toBe(false);
  });

  it("rejects emails with spaces", () => {
    expect(EMAIL_REGEX.test("a b@c.com")).toBe(false);
    expect(EMAIL_REGEX.test("a@b .com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(EMAIL_REGEX.test("")).toBe(false);
  });
});

describe("PASSWORD_REGEX", () => {
  it("accepts a password with upper, lower, digit, special, and 8+ chars", () => {
    expect(PASSWORD_REGEX.test("Strong1@pass")).toBe(true);
    expect(PASSWORD_REGEX.test("Aa1@aaaa")).toBe(true);
  });

  it("rejects a password missing uppercase", () => {
    expect(PASSWORD_REGEX.test("weak1@pass")).toBe(false);
  });

  it("rejects a password missing lowercase", () => {
    expect(PASSWORD_REGEX.test("STRONG1@PASS")).toBe(false);
  });

  it("rejects a password missing digit", () => {
    expect(PASSWORD_REGEX.test("Strong@pass")).toBe(false);
  });

  it("rejects a password missing special char", () => {
    expect(PASSWORD_REGEX.test("Strong1pass")).toBe(false);
  });

  it("rejects a password shorter than 8", () => {
    expect(PASSWORD_REGEX.test("Aa1@")).toBe(false);
    expect(PASSWORD_REGEX.test("Aa1@aaa")).toBe(false); // 7 chars
  });

  it("accepts exactly 8 chars", () => {
    expect(PASSWORD_REGEX.test("Aa1@aaaa")).toBe(true); // 8 chars
  });
});
