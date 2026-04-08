import { z } from "zod";
import { VERIFICATION_CODE_LENGTH, EMAIL_REGEX, PASSWORD_REGEX } from "@/lib/constants";

const emailSchema = z
  .string()
  .min(1, { message: "EMAIL_REQUIRED" })
  .regex(EMAIL_REGEX, { message: "EMAIL_INVALID" });

const passwordSchema = z
  .string()
  .regex(PASSWORD_REGEX, { message: "PASSWORD_FORMAT" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "PASSWORD_REQUIRED" }),
});

export const registerSchema = z.object({
  name: z.string().min(1, { message: "NAME_REQUIRED" }),
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, { message: "PASSWORD_REQUIRED" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: z.string().length(VERIFICATION_CODE_LENGTH, { message: "TOKEN_LENGTH" }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().length(VERIFICATION_CODE_LENGTH, { message: "TOKEN_LENGTH" }),
  newPassword: passwordSchema,
});

export const resetPasswordFormSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string().min(1, { message: "PASSWORD_REQUIRED" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  });
