"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ROUTES } from "@/lib/constants";
import { loginSchema } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type LoginForm = z.infer<typeof loginSchema>;

export function SignInForm() {
  const { t } = useAppStore();

  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const te = (key: string) => t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">{t("auth.signIn")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.signInDesc")}</p>
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.password")}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <a href={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:underline">
              {t("auth.forgotPassword")}
            </a>
          </div>

          <Button type="button" className="w-full p-5" disabled={isPending} onClick={form.handleSubmit((data) => login(data))}>
            {isPending ? t("auth.processing") : t("auth.signIn")}
          </Button>
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <a href={ROUTES.SIGN_UP} className="text-primary hover:underline">{t("auth.signUp")}</a>
      </p>
    </div>
  );
}
