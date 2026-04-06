import { z } from "zod";
import { PASSWORD_MIN_LENGTH, VERIFICATION_CODE_LENGTH } from "@/lib/constants";

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: "PASSWORD_MIN" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/, {
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
