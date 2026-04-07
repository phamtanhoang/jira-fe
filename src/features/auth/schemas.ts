import { z } from "zod";
import { VERIFICATION_CODE_LENGTH, PASSWORD_REGEX } from "@/lib/constants";

const passwordSchema = z
  .string()
  .regex(PASSWORD_REGEX, {
    message: "PASSWORD_FORMAT",
  });

export const loginSchema = z.object({
  email: z.string().email({ message: "EMAIL_INVALID" }),
  password: z.string().min(1, { message: "PASSWORD_REQUIRED" }),
});

export const registerSchema = z.object({
  name: z.string().min(1, { message: "NAME_REQUIRED" }),
  email: z.string().email({ message: "EMAIL_INVALID" }),
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
  email: z.string().email({ message: "EMAIL_INVALID" }),
  token: z.string().length(VERIFICATION_CODE_LENGTH, { message: "TOKEN_LENGTH" }),
});
