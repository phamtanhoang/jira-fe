"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  appEmailSchema,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type AppEmailInput,
  type AppEmailValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function AppEmailForm() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<AppEmailValue>(SETTING_KEYS.APP_EMAIL);
  const update = useUpdateSetting<AppEmailValue>(SETTING_KEYS.APP_EMAIL);

  const form = useForm<AppEmailInput>({
    resolver: zodResolver(appEmailSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (data?.value) {
      form.reset({ email: data.value.email ?? "" });
    }
  }, [data, form]);

  const te = (key: string) =>
    t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t("admin.settings.tabAppEmail")}</CardTitle>
        <CardDescription className="text-xs">
          {t("admin.settings.appEmail.emailHint")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) =>
                update.mutate(values as AppEmailValue),
              )}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.settings.appEmail.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t(
                          "admin.settings.appEmail.emailPlaceholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage renderMessage={te} />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? (
                    <>
                      <Spinner className="mr-2 h-3.5 w-3.5" />
                      {t("common.saving")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
