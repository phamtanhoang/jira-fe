"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ROUTES } from "@/lib/constants";
import { registerFormSchema } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/hooks";
import { OAuthButtons } from "../oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type RegisterForm = z.infer<typeof registerFormSchema>;

export function SignUpForm() {
  const { t } = useAppStore();

  const { mutate: registerUser, isPending } = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(data: RegisterForm) {
    // Drop confirmPassword — only used by zod schema for client-side
    // matching, not by the BE register endpoint.
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
    };
    registerUser(payload);
  }

  const te = (key: string) => t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">{t("auth.signUp")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.signUpDesc")}</p>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.name")}</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

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
                  <PasswordInput placeholder={t("auth.passwordHint")} {...field} />
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
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage renderMessage={te} />
              </FormItem>
            )}
          />

          <Button type="button" className="w-full p-5" disabled={isPending} onClick={form.handleSubmit(onSubmit)}>
            {isPending ? t("auth.processing") : t("auth.signUp")}
          </Button>
        </div>
      </Form>

      <div className="mt-4">
        <OAuthButtons />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <a href={ROUTES.SIGN_IN} className="text-primary hover:underline">{t("auth.signIn")}</a>
      </p>
    </div>
  );
}
