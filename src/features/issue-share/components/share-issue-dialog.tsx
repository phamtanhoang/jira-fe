"use client";

import { useState } from "react";
import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
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

const EXPIRY_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: "Never", value: undefined },
  { label: "1 day", value: 24 * 3600 },
  { label: "7 days", value: 7 * 24 * 3600 },
  { label: "30 days", value: 30 * 24 * 3600 },
];

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
    7 * 24 * 3600,
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
    setTimeout(() => setCopied(null), 1500);
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
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.label}
                    value={o.value === undefined ? NEVER_VALUE : String(o.value)}
                  >
                    {o.label}
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
