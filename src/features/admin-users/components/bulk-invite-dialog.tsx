"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useBulkInvite } from "../hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 500;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function BulkInviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useAppStore();
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");
  const bulkInvite = useBulkInvite();

  const { valid, invalid, total } = useMemo(() => {
    const all = parseEmails(raw);
    const v = all.filter((e) => EMAIL_RE.test(e));
    return { valid: v, invalid: all.length - v.length, total: all.length };
  }, [raw]);

  const handleSubmit = () => {
    if (valid.length === 0) return;
    bulkInvite.mutate(
      { emails: valid, message: message.trim() || undefined },
      {
        onSuccess: () => {
          setRaw("");
          setMessage("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.users.bulkInvite.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.users.bulkInvite.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-emails">
              {t("admin.users.bulkInvite.emailsLabel")}
            </Label>
            <Textarea
              id="bulk-emails"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={t("admin.users.bulkInvite.emailsPlaceholder")}
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              {t("admin.users.bulkInvite.parsedHint", {
                valid: String(valid.length),
                invalid: String(invalid),
                total: String(total),
                max: String(MAX_EMAILS),
              })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-message">
              {t("admin.users.bulkInvite.messageLabel")}{" "}
              <span className="text-[10px] text-muted-foreground">
                ({t("admin.users.bulkInvite.optional")})
              </span>
            </Label>
            <Textarea
              id="bulk-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("admin.users.bulkInvite.messagePlaceholder")}
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkInvite.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              valid.length === 0 ||
              valid.length > MAX_EMAILS ||
              bulkInvite.isPending
            }
          >
            {bulkInvite.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("admin.users.bulkInvite.submit", { count: String(valid.length) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
