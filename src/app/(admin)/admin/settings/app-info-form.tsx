"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  appInfoSchema,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  useUploadAppLogo,
  type AppInfoInput,
  type AppInfoValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const EMPTY: AppInfoInput = {
  name: "",
  logoUrl: "",
  description: "",
  authorName: "",
  authorUrl: "",
};

export function AppInfoForm() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<AppInfoValue>(SETTING_KEYS.APP_INFO);
  const update = useUpdateSetting<AppInfoValue>(SETTING_KEYS.APP_INFO);
  const uploadLogo = useUploadAppLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AppInfoInput>({
    resolver: zodResolver(appInfoSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (data?.value) {
      form.reset({
        name: data.value.name ?? "",
        logoUrl: data.value.logoUrl ?? "",
        description: data.value.description ?? "",
        authorName: data.value.authorName ?? "",
        authorUrl: data.value.authorUrl ?? "",
      });
    }
  }, [data, form]);

  const te = (key: string) =>
    t(`validation.${key}` as "validation.EMAIL_INVALID");

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t("admin.settings.tabAppInfo")}</CardTitle>
        <CardDescription className="text-xs">
          {t("admin.settings.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) =>
                update.mutate(values as AppInfoValue),
              )}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.settings.appInfo.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "admin.settings.appInfo.namePlaceholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage renderMessage={te} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("admin.settings.appInfo.logoUrl")}
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t(
                            "admin.settings.appInfo.logoUrlPlaceholder",
                          )}
                          {...field}
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            uploadLogo.mutate(file, {
                              onSuccess: (res) => {
                                form.setValue("logoUrl", res.logoUrl, {
                                  shouldDirty: true,
                                });
                              },
                            });
                            e.target.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadLogo.isPending}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadLogo.isPending ? (
                            <Spinner className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {t("admin.settings.appInfo.uploadCta")}
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      {t("admin.settings.appInfo.uploadHint")}
                    </p>
                    <FormMessage renderMessage={te} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("admin.settings.appInfo.description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "admin.settings.appInfo.descriptionPlaceholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage renderMessage={te} />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("admin.settings.appInfo.authorName")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "admin.settings.appInfo.authorNamePlaceholder",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage renderMessage={te} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authorUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("admin.settings.appInfo.authorUrl")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "admin.settings.appInfo.authorUrlPlaceholder",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage renderMessage={te} />
                    </FormItem>
                  )}
                />
              </div>

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
