"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ROUTES } from "@/lib/constants";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { useForgotPassword } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { t } = useAppStore();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const email = form.watch("email");

  const { mutate: forgotPassword, isPending } = useForgotPassword({
    onSuccess: () => {
      window.location.href = `${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}`;
    },
  });

  const te = (key: string) => t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">{t("auth.forgotPasswordTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgotPasswordDesc")}</p>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.email")}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

          <Button type="button" className="w-full p-5" disabled={isPending} onClick={form.handleSubmit((data) => forgotPassword(data))}>
            {isPending ? t("auth.sending") : t("auth.sendResetCode")}
          </Button>
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href={ROUTES.SIGN_IN} className="text-primary hover:underline">{t("auth.backToSignIn")}</a>
      </p>
    </div>
  );
}
