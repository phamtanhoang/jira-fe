"use client";

import { useEffect, useState } from "react";
import { Mail, Save, Send } from "lucide-react";
import {
  DEFAULT_EMAIL_TEMPLATES,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type EmailTemplate,
  type EmailTemplateKey,
  type EmailTemplatesValue,
} from "@/features/admin";
import { mailLogsApi } from "@/features/mail-logs/api";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { handleApiError, showMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichContent, RichEditor } from "@/components/shared/rich-editor";

const TEMPLATE_KEYS: EmailTemplateKey[] = [
  "verification",
  "resetPassword",
  "welcome",
];

// Tokens that the BE substitutes when rendering the saved template. Listed
// here so admins know what they can use in subject + body.
const PLACEHOLDERS = [
  "{{appName}}",
  "{{logoUrl}}",
  "{{otp}}",
  "{{expiryMinutes}}",
  "{{recipientEmail}}",
];

export function EmailTemplatesForm() {
  const { t } = useAppStore();
  const { data, isLoading } =
    useSetting<EmailTemplatesValue>(SETTING_KEYS.APP_EMAIL_TEMPLATES);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          {t("admin.settings.emailTemplates.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.settings.emailTemplates.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <EmailTemplatesInner
            initial={{
              verification:
                data?.value?.verification ??
                DEFAULT_EMAIL_TEMPLATES.verification,
              resetPassword:
                data?.value?.resetPassword ??
                DEFAULT_EMAIL_TEMPLATES.resetPassword,
              welcome: data?.value?.welcome ?? DEFAULT_EMAIL_TEMPLATES.welcome,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmailTemplatesInner({ initial }: { initial: EmailTemplatesValue }) {
  const { t } = useAppStore();
  const [state, setState] = useState<EmailTemplatesValue>(initial);
  const [active, setActive] = useState<EmailTemplateKey>("verification");
  const update = useUpdateSetting<EmailTemplatesValue>(
    SETTING_KEYS.APP_EMAIL_TEMPLATES,
  );

  useEffect(() => {
    setState(initial);
  }, [initial]);

  const updateField = (
    key: EmailTemplateKey,
    field: keyof EmailTemplate,
    value: string,
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  return (
    <div className="space-y-3">
      <Tabs
        value={active}
        onValueChange={(v) => v && setActive(v as EmailTemplateKey)}
      >
        <TabsList>
          {TEMPLATE_KEYS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`admin.settings.emailTemplates.tab.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {TEMPLATE_KEYS.map((k) => (
          <TabsContent key={k} value={k} className="mt-4 space-y-4">
            <SubjectField
              value={state[k].subject}
              onChange={(v) => updateField(k, "subject", v)}
            />
            <BodyField
              value={state[k].html}
              onChange={(v) => updateField(k, "html", v)}
            />
            {(k === "verification" || k === "resetPassword") && (
              <SendTestRow templateKey={k} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">
          {t("admin.settings.emailTemplates.placeholders")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <code
              key={p}
              className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px]"
            >
              {p}
            </code>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => update.mutate(state)} disabled={update.isPending}>
          {update.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

function SubjectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useAppStore();
  return (
    <div className="space-y-1.5">
      <Label>{t("admin.settings.emailTemplates.subject")}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("admin.settings.emailTemplates.subjectPlaceholder")}
      />
      <p className="text-[10px] text-muted-foreground">
        {t("admin.settings.emailTemplates.fallbackHint")}
      </p>
    </div>
  );
}

function BodyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useAppStore();
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{t("admin.settings.emailTemplates.body")}</Label>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview
            ? t("admin.settings.emailTemplates.editMode")
            : t("admin.settings.emailTemplates.previewMode")}
        </Button>
      </div>
      {showPreview ? (
        <div className="rounded-md border bg-card p-3 text-sm">
          {value ? (
            <RichContent html={value} />
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("admin.settings.emailTemplates.fallbackHint")}
            </p>
          )}
        </div>
      ) : (
        <RichEditor
          content={value}
          onChange={onChange}
          placeholder={t("admin.settings.emailTemplates.bodyPlaceholder")}
        />
      )}
    </div>
  );
}

function SendTestRow({
  templateKey,
}: {
  templateKey: "verification" | "resetPassword";
}) {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const [to, setTo] = useState(user?.email ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user?.email && !to) setTo(user.email);
  }, [user?.email, to]);

  const send = async () => {
    if (!to.trim()) return;
    setPending(true);
    try {
      const res = await mailLogsApi.sendTemplateTest(to.trim(), templateKey);
      showMessage(res.message);
    } catch (err) {
      handleApiError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex-1 space-y-1">
        <Label className="text-[11px] uppercase tracking-wide">
          {t("admin.settings.emailTemplates.testTo")}
        </Label>
        <Input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you@example.com"
          className="h-8"
        />
      </div>
      <Button size="sm" onClick={send} disabled={pending || !to.trim()}>
        {pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        {t("admin.settings.emailTemplates.sendTest")}
      </Button>
      <p className="basis-full text-[10px] text-muted-foreground">
        {t("admin.settings.emailTemplates.sendTestHint")}
      </p>
    </div>
  );
}
