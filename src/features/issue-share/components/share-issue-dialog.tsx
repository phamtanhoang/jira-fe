"use client";

import { useState } from "react";
import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { INVITE_EXPIRY_SEC, CLIPBOARD_FEEDBACK_MS } from "@/lib/constants/ui";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateShareToken,
  useRevokeShareToken,
  useShareTokens,
} from "../hooks";

const NEVER_VALUE = "__never__";

export function ShareIssueDialog({
  issueId,
  open,
  onOpenChange,
}: {
  issueId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useAppStore();
  const [expiresInSec, setExpiresInSec] = useState<number | undefined>(
    INVITE_EXPIRY_SEC.SEVEN_DAYS,
  );
  const [copied, setCopied] = useState<string | null>(null);
  const { data: tokens, isLoading } = useShareTokens(open ? issueId : undefined);
  const { mutate: create, isPending: creating } = useCreateShareToken(issueId);
  const { mutate: revoke } = useRevokeShareToken(issueId);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function copyLink(token: string) {
    const url = `${origin}${ROUTES.SHARE_ISSUE(token)}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), CLIPBOARD_FEEDBACK_MS);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>{t("share.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Create new */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">
              {t("share.expiresAfter")}
            </span>
            <Select
              value={
                expiresInSec === undefined ? NEVER_VALUE : String(expiresInSec)
              }
              onValueChange={(v) => {
                if (typeof v !== "string") return;
                setExpiresInSec(v === NEVER_VALUE ? undefined : parseInt(v));
              }}
            >
              <SelectTrigger className="h-8 w-32 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { labelKey: "invite.expiryNever", value: undefined },
                  { labelKey: "invite.expiry1Day", value: INVITE_EXPIRY_SEC.ONE_DAY },
                  { labelKey: "invite.expiry7Days", value: INVITE_EXPIRY_SEC.SEVEN_DAYS },
                  { labelKey: "invite.expiry30Days", value: INVITE_EXPIRY_SEC.THIRTY_DAYS },
                ].map((o) => (
                  <SelectItem
                    key={o.labelKey}
                    value={o.value === undefined ? NEVER_VALUE : String(o.value)}
                  >
                    {t(o.labelKey as "invite.expiryNever")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={creating}
              onClick={() => create({ expiresInSec })}
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              {t("share.createLink")}
            </Button>
          </div>

          {/* Existing tokens */}
          <div className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-12 rounded" />
            ) : !tokens || tokens.length === 0 ? (
              <p className="rounded border border-dashed py-3 text-center text-[12px] text-muted-foreground">
                {t("share.empty")}
              </p>
            ) : (
              tokens.map((tok) => {
                const url = `${origin}${ROUTES.SHARE_ISSUE(tok.token)}`;
                const expired =
                  tok.expiresAt && new Date(tok.expiresAt) < new Date();
                return (
                  <div
                    key={tok.id}
                    className={`flex items-center gap-2 rounded border bg-card p-2 ${expired ? "opacity-60" : ""}`}
                  >
                    <input
                      readOnly
                      value={url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 bg-transparent font-mono text-[11px] outline-none"
                    />
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {tok.viewCount} {t("share.views")}
                      {tok.expiresAt && (
                        <>
                          {" · "}
                          {expired ? t("share.expired") : formatDateTime(tok.expiresAt)}
                        </>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => copyLink(tok.token)}
                      title={t("share.copy")}
                    >
                      {copied === tok.token ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => revoke(tok.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title={t("share.revoke")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
