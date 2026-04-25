"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  appEmailSchema,
  SETTING_KEYS,
  SMTP_PASSWORD_PLACEHOLDER,
  useSetting,
  useUpdateSetting,
  type AppEmailValue,
  type MailProvider,
} from "@/features/admin";
import { useMailConfigStatus, useSendTestMail } from "@/features/mail-logs/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormShape {
  provider: MailProvider;
  fromEmail: string;
  fromName?: string;
  smtp?: {
    host?: string;
    port?: number;
    secure: boolean;
    user?: string;
    password?: string;
  };
}

const EMPTY: FormShape = {
  provider: "resend",
  fromEmail: "",
  fromName: "",
  smtp: {
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
  },
};

export function AppEmailForm() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<AppEmailValue>(SETTING_KEYS.APP_EMAIL);
  const update = useUpdateSetting<AppEmailValue>(SETTING_KEYS.APP_EMAIL);
  const status = useMailConfigStatus();

  const form = useForm<FormShape>({
    resolver: zodResolver(appEmailSchema),
    defaultValues: EMPTY,
  });
  const provider = form.watch("provider");

  useEffect(() => {
    if (data?.value) {
      form.reset(toFormShape(data.value));
    }
  }, [data, form]);

  const te = (key: string) =>
    t(`validation.${key}` as "validation.EMAIL_INVALID");

  const [testOpen, setTestOpen] = useState(false);

  function onSubmit(values: FormShape) {
    update.mutate(toApiShape(values), {
      onSuccess: () => status.refetch(),
    });
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t("admin.settings.tabAppEmail")}</CardTitle>
        <CardDescription className="text-xs">
          {t("admin.settings.appEmail.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ConfigStatusBanner />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("admin.settings.appEmail.provider")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(v) =>
                          v && field.onChange(v as MailProvider)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resend">
                            {t("admin.settings.appEmail.providerResend")}
                          </SelectItem>
                          <SelectItem value="smtp">
                            {t("admin.settings.appEmail.providerSmtp")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      {provider === "smtp"
                        ? t("admin.settings.appEmail.providerSmtpHint")
                        : t("admin.settings.appEmail.providerResendHint")}
                    </p>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("admin.settings.appEmail.fromEmail")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="noreply@yourdomain.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage renderMessage={te} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("admin.settings.appEmail.fromName")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "admin.settings.appEmail.fromNamePlaceholder",
                          )}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage renderMessage={te} />
                    </FormItem>
                  )}
                />
              </div>

              {provider === "smtp" && (
                <div className="space-y-4 rounded-md border bg-muted/20 p-4">
                  <div>
                    <h4 className="text-[13px] font-semibold">
                      {t("admin.settings.appEmail.smtp")}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("admin.settings.appEmail.smtpHint")}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="smtp.host"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>
                            {t("admin.settings.appEmail.host")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="smtp.gmail.com"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage renderMessage={te} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtp.port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.settings.appEmail.port")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="587"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage renderMessage={te} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="smtp.secure"
                    render={({ field }) => (
                      <FormItem>
                        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 accent-primary"
                          />
                          {t("admin.settings.appEmail.secure")}
                        </label>
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="smtp.user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.settings.appEmail.user")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@gmail.com"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage renderMessage={te} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtp.password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.settings.appEmail.password")}
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder={
                                field.value === SMTP_PASSWORD_PLACEHOLDER
                                  ? t("admin.settings.appEmail.passwordKept")
                                  : ""
                              }
                              autoComplete="new-password"
                              {...field}
                              value={field.value ?? ""}
                              onFocus={(e) => {
                                if (
                                  e.target.value === SMTP_PASSWORD_PLACEHOLDER
                                ) {
                                  field.onChange("");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage renderMessage={te} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("admin.settings.appEmail.passwordHint")}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestOpen(true)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {t("admin.mail.sendTest")}
                </Button>
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

      <SendTestDialog open={testOpen} onOpenChange={setTestOpen} />
    </Card>
  );
}

function ConfigStatusBanner() {
  const { t } = useAppStore();
  const { data: status } = useMailConfigStatus();
  if (!status) return null;
  if (status.configured) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-[12px] text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t("admin.settings.appEmail.configured")}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-800 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <div className="font-medium">
          {t("admin.settings.appEmail.missingTitle")}
        </div>
        <ul className="list-inside list-disc space-y-0.5">
          {status.missing.map((field) => (
            <li key={field} className="font-mono text-[11px]">
              {field}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SendTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useAppStore();
  const [to, setTo] = useState("");
  const { mutate, isPending } = useSendTestMail();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) return;
    mutate(to.trim(), {
      onSuccess: () => {
        onOpenChange(false);
        setTo("");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.mail.sendTest")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-[12px] text-muted-foreground">
            {t("admin.mail.sendTestDesc")}
          </p>
          <Input
            type="email"
            placeholder="you@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !to.trim()}
              className={cn(isPending && "opacity-80")}
            >
              {isPending && <Spinner className="mr-1.5 h-3.5 w-3.5" />}
              {t("admin.mail.sendTest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toFormShape(value: AppEmailValue): FormShape {
  return {
    provider: value.provider ?? "resend",
    fromEmail: (value.fromEmail ?? value.email ?? "").trim(),
    fromName: value.fromName ?? "",
    smtp: {
      host: value.smtp?.host ?? "",
      port: value.smtp?.port ?? 587,
      secure: !!value.smtp?.secure,
      user: value.smtp?.user ?? "",
      password: value.smtp?.password ?? "",
    },
  };
}

function toApiShape(values: FormShape): AppEmailValue {
  const out: AppEmailValue = {
    provider: values.provider,
    fromEmail: values.fromEmail.trim(),
    fromName: values.fromName?.trim() || undefined,
  };
  if (values.provider === "smtp" && values.smtp) {
    out.smtp = {
      host: values.smtp.host?.trim() || undefined,
      port: values.smtp.port,
      secure: !!values.smtp.secure,
      user: values.smtp.user?.trim() || undefined,
      password: values.smtp.password ?? "",
    };
  }
  return out;
}
