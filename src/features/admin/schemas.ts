import { z } from "zod";
import { EMAIL_REGEX } from "@/lib/constants";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: "URL_INVALID" },
  );

export const appInfoSchema = z.object({
  name: z.string().trim().min(1, { message: "NAME_REQUIRED" }).max(80),
  logoUrl: optionalUrl,
  description: z.string().trim().max(500).optional(),
  authorName: z.string().trim().max(80).optional(),
  authorUrl: optionalUrl,
});

export const appEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "EMAIL_REQUIRED" })
    .regex(EMAIL_REGEX, { message: "EMAIL_INVALID" }),
});

export type AppInfoInput = z.infer<typeof appInfoSchema>;
export type AppEmailInput = z.infer<typeof appEmailSchema>;
