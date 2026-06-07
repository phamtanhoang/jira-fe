"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ROUTES } from "@/lib/constants";
import { loginSchema } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks";
import { OAuthButtons, useOAuthProviders } from "../oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type LoginForm = z.infer<typeof loginSchema>;

// Mirrors BE's MSG.ERROR.* keys for OAuth-callback failures. Keep these
// strings byte-stable with the BE constants — they're the contract the
// redirect URL uses.
const OAUTH_ERROR_I18N: Record<string, string> = {
  OAUTH_EMAIL_REQUIRED: "auth.oauthEmailRequired",
  OAUTH_VERIFY_EMAIL_FIRST: "auth.oauthVerifyEmailFirst",
  ACCOUNT_DEACTIVATED: "auth.oauthAccountDeactivated",
};

export function SignInForm() {
  const { t } = useAppStore();
  const searchParams = useSearchParams();

  const { mutate: login, isPending } = useLogin();
  // Default to enabled while the providers query is still loading so the form
  // doesn't flash empty on first paint.
  const { data: providers } = useOAuthProviders();
  const passwordEnabled = providers?.password ?? true;

  // OAuth callback redirects with `?error=<CODE>` when something fails.
  // Map known BE error codes to localized strings so end-users see a
  // useful message instead of an opaque shoutcase identifier. Unknown
  // codes (provider-side errors, schema drift) fall through to the
  // decoded text so admins can still debug from the toast.
  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    const decoded = decodeURIComponent(err);
    const i18nKey = OAUTH_ERROR_I18N[decoded];
    if (i18nKey) {
      toast.error(t(i18nKey as "auth.oauthFailed"));
      return;
    }
    toast.error(
      decoded && decoded !== "oauth_failed" ? decoded : t("auth.oauthFailed"),
    );
  }, [searchParams, t]);

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

      {passwordEnabled ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-4">
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
                    <PasswordInput {...field} />
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

            <Button type="submit" className="w-full p-5" disabled={isPending}>
              {isPending ? t("auth.processing") : t("auth.signIn")}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="rounded-md border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          {t("auth.passwordDisabled")}
        </div>
      )}

      <div className="mt-4">
        <OAuthButtons />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <a href={ROUTES.SIGN_UP} className="text-primary hover:underline">{t("auth.signUp")}</a>
      </p>
    </div>
  );
}
