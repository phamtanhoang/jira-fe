"use client";

import { useState } from "react";
import { Mail, Pencil, Save, Send, Sparkles } from "lucide-react";
import {
  EMPTY_EMAIL_TEMPLATE,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type EmailTemplate,
  type EmailTemplateKey,
  type EmailTemplatesValue,
} from "@/features/admin";
import { mailLogsApi } from "@/features/mail-logs/api";
import { useEmailTemplateSchema } from "@/features/mail-logs/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { formatHtml, handleApiError, showMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/** Substitute `{{var}}` tokens against BE-supplied sample values so the
 *  preview matches what real recipients see (real appName/logoUrl/expiry,
 *  sample otp/recipientEmail). Unknown keys are left intact so a typo in
 *  the template surfaces as `{{xxx}}` literal in the preview. */
function renderForPreview(
  html: string,
  sample: Record<string, string>,
): string {
  return html.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (match, key) => {
    const v = sample[key as string];
    return v === undefined ? match : v;
  });
}

export function EmailTemplatesForm() {
  const { t } = useAppStore();
  // Both fetches run in parallel — the inner component only renders once
  // BOTH have settled so the schema (template keys + placeholders +
  // preview sample) is the single source of truth. No FE-side fallbacks.
  const setting = useSetting<EmailTemplatesValue>(
    SETTING_KEYS.APP_EMAIL_TEMPLATES,
  );
  const schema = useEmailTemplateSchema();

  const ready = !setting.isLoading && !schema.isLoading && !!schema.data;

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
        {!ready ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <EmailTemplatesInner
            templateKeys={schema.data!.templates}
            placeholders={schema.data!.placeholders}
            previewSample={schema.data!.previewSample}
            // Build the initial map dynamically from the BE template list.
            // Templates the admin hasn't customized fall back to an empty
            // shape — BE treats empty subject/html as "use built-in default".
            initial={Object.fromEntries(
              schema.data!.templates.map((k) => [
                k,
                setting.data?.value?.[k] ?? EMPTY_EMAIL_TEMPLATE,
              ]),
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmailTemplatesInner({
  initial,
  templateKeys,
  placeholders,
  previewSample,
}: {
  initial: EmailTemplatesValue;
  templateKeys: EmailTemplateKey[];
  placeholders: readonly string[];
  previewSample: Record<string, string>;
}) {
  const { t } = useAppStore();

  // Default the active tab to whatever BE listed first so we don't depend
  // on a hardcoded "verification" key — if BE renames or removes that
  // template the tab still resolves.
  const [active, setActive] = useState<EmailTemplateKey>(
    () => templateKeys[0] ?? "verification",
  );
  const [editing, setEditing] = useState<EmailTemplateKey | null>(null);

  // Latest persisted value per template — fed back into the preview after a
  // save commits via React Query refetch (parent passes new `initial`).
  const current = initial[active];

  return (
    <div className="space-y-4">
      <Tabs
        value={active}
        onValueChange={(v) => v && setActive(v as EmailTemplateKey)}
      >
        <TabsList>
          {templateKeys.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(
                `admin.settings.emailTemplates.tab.${k}` as "admin.settings.emailTemplates.tab.verification",
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {templateKeys.map((k) => (
          <TabsContent key={k} value={k} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("admin.settings.emailTemplates.subject")}
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(k)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("admin.settings.emailTemplates.editTemplate")}
                </Button>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-[13px]">
                {initial[k].subject || (
                  <span className="text-muted-foreground italic">
                    {t("admin.settings.emailTemplates.fallbackHint")}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("admin.settings.emailTemplates.preview")}
              </Label>
              <PreviewFrame
                html={initial[k].html}
                sample={previewSample}
                className="h-105"
              />
            </div>

            {(k === "verification" || k === "resetPassword") && (
              <SendTestRow templateKey={k} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Mount the dialog only when a target is selected. Keying on
          `templateKey` resets internal state (draft) on each open — replaces
          the previous useEffect+setDraft which tripped the
          react-hooks/set-state-in-effect lint. */}
      {editing && (
        <EditTemplateDialog
          key={editing}
          templateKey={editing}
          initial={initial[editing] ?? EMPTY_EMAIL_TEMPLATE}
          all={initial}
          placeholders={placeholders}
          previewSample={previewSample}
          onClose={() => setEditing(null)}
        />
      )}

      <p className="text-[11px] text-muted-foreground">
        {t("admin.settings.emailTemplates.editHint")} ·{" "}
        <span className="font-medium">
          {current.html ? "" : t("admin.settings.emailTemplates.usingDefault")}
        </span>
      </p>
    </div>
  );
}

function EditTemplateDialog({
  templateKey,
  initial,
  all,
  placeholders,
  previewSample,
  onClose,
}: {
  templateKey: EmailTemplateKey;
  initial: EmailTemplate;
  all: EmailTemplatesValue;
  placeholders: readonly string[];
  previewSample: Record<string, string>;
  onClose: () => void;
}) {
  const { t } = useAppStore();
  // Lazy initial — runs once per mount. Parent re-keys the component when
  // a different template is selected, so we get a fresh draft for free.
  // Pretty-print the saved HTML so admins (often non-tech) see readable
  // indentation instead of a single minified line on first open.
  const [draft, setDraft] = useState<EmailTemplate>(() => ({
    subject: initial.subject,
    html: formatHtml(initial.html),
  }));
  const update = useUpdateSetting<EmailTemplatesValue>(
    SETTING_KEYS.APP_EMAIL_TEMPLATES,
  );

  const save = () => {
    update.mutate(
      { ...all, [templateKey]: draft },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[85vh] max-h-205 w-[calc(100%-2rem)] max-w-275 flex-col gap-4 sm:max-w-275">
        <DialogHeader>
          <DialogTitle>
            {t("admin.settings.emailTemplates.editTitle", {
              tab: t(
                `admin.settings.emailTemplates.tab.${templateKey}` as "admin.settings.emailTemplates.tab.verification",
              ),
            })}
          </DialogTitle>
          <DialogDescription>
            {t("admin.settings.emailTemplates.editDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="space-y-1.5">
            <Label>{t("admin.settings.emailTemplates.subject")}</Label>
            <Input
              value={draft.subject}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder={t("admin.settings.emailTemplates.subjectPlaceholder")}
            />
          </div>

          <div className="grid flex-1 gap-3 overflow-hidden md:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("admin.settings.emailTemplates.codeMode")}
                </Label>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      html: formatHtml(prev.html),
                    }))
                  }
                  className="gap-1"
                  title={t("admin.settings.emailTemplates.formatHint")}
                >
                  <Sparkles className="h-3 w-3" />
                  {t("admin.settings.emailTemplates.format")}
                </Button>
              </div>
              <Textarea
                value={draft.html}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, html: e.target.value }))
                }
                placeholder={t("admin.settings.emailTemplates.bodyPlaceholder")}
                className="min-h-0 flex-1 resize-none font-mono text-[11px] leading-snug"
                spellCheck={false}
              />
            </div>
            <div className="flex min-h-0 flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("admin.settings.emailTemplates.preview")}
              </Label>
              <PreviewFrame
                html={draft.html}
                sample={previewSample}
                className="flex-1"
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">
              {t("admin.settings.emailTemplates.placeholders")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {placeholders.map((p) => (
                <code
                  key={p}
                  className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {`{{${p}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewFrame({
  html,
  sample,
  className,
}: {
  html: string;
  /** BE-resolved placeholder values — see `EmailTemplateSchema.previewSample`. */
  sample: Record<string, string>;
  className?: string;
}) {
  const { t } = useAppStore();
  if (!html.trim()) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground ${
          className ?? "min-h-90"
        }`}
      >
        {t("admin.settings.emailTemplates.fallbackHint")}
      </div>
    );
  }
  // Wrap in a minimal HTML doc so inline styles + body padding behave like
  // a real email client. `srcDoc` keeps everything sandboxed from the app's
  // own CSS — Tailwind resets, theme variables, dark mode all stay out.
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>html,body{margin:0;padding:16px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}</style></head><body>${renderForPreview(html, sample)}</body></html>`;
  return (
    <iframe
      title="Email preview"
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      className={`w-full rounded-md border bg-white ${className ?? "min-h-90"}`}
    />
  );
}

function SendTestRow({
  templateKey,
}: {
  templateKey: "verification" | "resetPassword";
}) {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  // Lazy init from the auth user — runs once per mount, no useEffect needed.
  // If the user object isn't ready yet the field starts empty and the admin
  // can type their own address.
  const [to, setTo] = useState<string>(() => user?.email ?? "");
  const [pending, setPending] = useState(false);

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
