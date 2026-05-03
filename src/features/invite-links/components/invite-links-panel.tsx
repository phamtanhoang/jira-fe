"use client";

import { useState } from "react";
import { Check, Copy, Link2, Trash2, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { INVITE_EXPIRY_SEC, CLIPBOARD_FEEDBACK_MS } from "@/lib/constants/ui";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateInviteLink,
  useInviteLinks,
  useRevokeInviteLink,
} from "../hooks";
import type { InviteLink } from "../api";

const NEVER_VALUE = "__never__";

export function InviteLinksPanel({ workspaceId }: { workspaceId: string }) {
  const { t } = useAppStore();
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [expiresInSec, setExpiresInSec] = useState<number | undefined>(
    INVITE_EXPIRY_SEC.SEVEN_DAYS,
  );
  const [maxUses, setMaxUses] = useState<string>("");
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: links, isLoading } = useInviteLinks(workspaceId);
  const { mutate: create, isPending: creating } =
    useCreateInviteLink(workspaceId);
  const { mutate: revoke } = useRevokeInviteLink(workspaceId);

  // Expiry options built from constants + i18n labels
  const expiryOptions: { labelKey: string; value: number | undefined }[] = [
    { labelKey: "invite.expiryNever", value: undefined },
    { labelKey: "invite.expiry1Day", value: INVITE_EXPIRY_SEC.ONE_DAY },
    { labelKey: "invite.expiry7Days", value: INVITE_EXPIRY_SEC.SEVEN_DAYS },
    { labelKey: "invite.expiry30Days", value: INVITE_EXPIRY_SEC.THIRTY_DAYS },
  ];

  function handleCreate() {
    const parsedMax = maxUses ? parseInt(maxUses) : undefined;
    create(
      {
        role,
        expiresInSec,
        ...(parsedMax && parsedMax > 0 ? { maxUses: parsedMax } : {}),
      },
      {
        onSuccess: () => setMaxUses(""),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{t("invite.title")}</h2>
        <p className="text-[12px] text-muted-foreground">
          {t("invite.subtitle")}
        </p>
      </div>

      {/* Create form */}
      <div className="grid grid-cols-1 gap-2 rounded-lg border bg-card p-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">
            {t("invite.role")}
          </label>
          <Select
            value={role}
            onValueChange={(v) => v && setRole(v as typeof role)}
          >
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">{t("invite.roleAdmin")}</SelectItem>
              <SelectItem value="MEMBER">{t("invite.roleMember")}</SelectItem>
              <SelectItem value="VIEWER">{t("invite.roleViewer")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">
            {t("invite.expires")}
          </label>
          <Select
            value={
              expiresInSec === undefined ? NEVER_VALUE : String(expiresInSec)
            }
            onValueChange={(v) => {
              if (typeof v !== "string") return;
              setExpiresInSec(v === NEVER_VALUE ? undefined : parseInt(v));
            }}
          >
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expiryOptions.map((o) => (
                <SelectItem
                  key={o.labelKey}
                  value={o.value === undefined ? NEVER_VALUE : String(o.value)}
                >
                  {t(o.labelKey as "invite.expiryNever")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">
            {t("invite.maxUses")}
          </label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="—"
            className="h-8 w-full rounded-md border bg-background px-2 text-[12px] outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-end">
          <Button
            size="sm"
            disabled={creating}
            onClick={handleCreate}
            className="w-full"
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            {t("invite.generate")}
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton className="h-16 rounded" />
      ) : !links || links.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground/30" />
          <p className="text-[12px] text-muted-foreground">
            {t("invite.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <InviteLinkRow
              key={link.id}
              link={link}
              onRevoke={() => setRevokeId(link.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(o) => !o && setRevokeId(null)}
        title={t("invite.confirmRevokeTitle")}
        description={t("invite.confirmRevokeDesc")}
        confirmLabel={t("invite.revoke")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={() => {
          if (revokeId) {
            revoke(revokeId);
            setRevokeId(null);
          }
        }}
      />
    </div>
  );
}

function InviteLinkRow({
  link,
  onRevoke,
}: {
  link: InviteLink;
  onRevoke: () => void;
}) {
  const { t } = useAppStore();
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${ROUTES.JOIN(link.token)}`;
  const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const exhausted = link.maxUses != null && link.usedCount >= link.maxUses;
  const dead = expired || exhausted;

  function copy() {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), CLIPBOARD_FEEDBACK_MS);
  }

  return (
    <div
      className={`flex items-center gap-2 rounded border bg-card p-2 ${dead ? "opacity-60" : ""}`}
    >
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] outline-none"
      />
      <Badge variant="secondary" className="text-[10px]">
        {link.role}
      </Badge>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {link.usedCount}
        {link.maxUses != null ? ` / ${link.maxUses}` : ""} {t("invite.uses")}
        {link.expiresAt && (
          <>
            {" · "}
            {expired ? t("invite.expired") : formatDateTime(link.expiresAt)}
          </>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={copy}
        title={t("share.copy")}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRevoke}
        className="text-muted-foreground hover:text-destructive"
        title={t("invite.revoke")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
