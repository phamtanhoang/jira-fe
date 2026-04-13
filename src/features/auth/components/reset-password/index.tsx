"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { KeyRound } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ROUTES, VERIFICATION_CODE_LENGTH } from "@/lib/constants";
import { resetPasswordFormSchema } from "@/features/auth/schemas";
import { useResetPassword } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordForm() {
  const { t } = useAppStore();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  const { mutate: resetPassword, isPending } = useResetPassword();

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { email, token: "", newPassword: "", confirmPassword: "" },
  });

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    form.setValue("token", next.join(""));
    if (value && index < VERIFICATION_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    form.setValue("token", next.join(""));
    inputRefs.current[Math.min(pasted.length, VERIFICATION_CODE_LENGTH - 1)]?.focus();
  }

  function onSubmit(data: ResetPasswordForm) {
    resetPassword({
      email: data.email,
      token: data.token,
      newPassword: data.newPassword,
    });
  }

  const te = (key: string) => t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">{t("auth.resetPassword")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.resetPasswordDesc")}
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">{t("auth.enterCode")}</label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-10 text-center text-lg font-semibold"
                />
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.newPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("auth.passwordHint")} {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

          <Button
            type="button"
            className="w-full p-5"
            disabled={isPending || code.length !== VERIFICATION_CODE_LENGTH}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? t("auth.resetting") : t("auth.resetPassword")}
          </Button>
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href={ROUTES.SIGN_IN} className="text-primary hover:underline">{t("auth.backToSignIn")}</a>
      </p>
    </div>
  );
}
