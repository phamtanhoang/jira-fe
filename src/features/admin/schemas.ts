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

export const appEmailSchema = z
  .object({
    provider: z.enum(["resend", "smtp"]),
    fromEmail: z
      .string()
      .trim()
      .min(1, { message: "EMAIL_REQUIRED" })
      .regex(EMAIL_REGEX, { message: "EMAIL_INVALID" }),
    fromName: z.string().trim().max(80).optional(),
    smtp: z
      .object({
        host: z.string().trim().optional(),
        port: z.number().int().min(1).max(65535).optional(),
        secure: z.boolean(),
        user: z.string().trim().optional(),
        password: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider !== "smtp") return;
    const required: Array<"host" | "port" | "user" | "password"> = [
      "host",
      "port",
      "user",
      "password",
    ];
    for (const key of required) {
      const v = value.smtp?.[key];
      if (v === undefined || v === null || v === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["smtp", key],
          message: "SMTP_FIELD_REQUIRED",
        });
      }
    }
  });

export type AppInfoInput = z.infer<typeof appInfoSchema>;
export type AppEmailInput = z.infer<typeof appEmailSchema>;
