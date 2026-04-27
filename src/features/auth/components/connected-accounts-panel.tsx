"use client";

import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { ENDPOINTS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyOAuthAccounts,
  useUnlinkOAuthAccount,
} from "../hooks";
import { useOAuthProviders } from "./oauth-buttons";
import type { OAuthAccountRow } from "../types";

const PROVIDER_META: Record<string, { label: string; href: string }> = {
  google: { label: "Google", href: ENDPOINTS.auth.oauthGoogle },
  github: { label: "GitHub", href: ENDPOINTS.auth.oauthGithub },
};

export function ConnectedAccountsPanel() {
  const { t } = useAppStore();
  const { data, isLoading } = useMyOAuthAccounts();
  const { data: providerToggles } = useOAuthProviders();
  const unlink = useUnlinkOAuthAccount();
  const [unlinkTarget, setUnlinkTarget] = useState<OAuthAccountRow | null>(
    null,
  );

  const linkedProviders = new Set((data ?? []).map((a) => a.provider));
  const availableProviders = (
    [
      ["google", providerToggles?.google],
      ["github", providerToggles?.github],
    ] as const
  )
    .filter(([id, on]) => on && !linkedProviders.has(id))
    .map(([id]) => id);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4" />
            {t("auth.connectedAccounts.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("auth.connectedAccounts.description")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          compact
          icon={Link2}
          title={t("auth.connectedAccounts.emptyTitle")}
          description={t("auth.connectedAccounts.emptyDesc")}
        />
      ) : (
        <div className="divide-y rounded-md border">
          {data.map((row) => (
            <ProviderRow
              key={row.id}
              row={row}
              onUnlink={() => setUnlinkTarget(row)}
            />
          ))}
        </div>
      )}

      {availableProviders.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {availableProviders.map((id) => {
            const meta = PROVIDER_META[id];
            return (
              <Button
                key={id}
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  window.location.href = `/api${meta.href}`;
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("auth.connectedAccounts.link", { provider: meta.label })}
              </Button>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!unlinkTarget}
        onOpenChange={(o) => !o && setUnlinkTarget(null)}
        title={t("auth.connectedAccounts.unlinkTitle")}
        description={t("auth.connectedAccounts.unlinkDesc", {
          provider:
            (unlinkTarget && PROVIDER_META[unlinkTarget.provider]?.label) ??
            unlinkTarget?.provider ??
            "",
        })}
        confirmLabel={t("auth.connectedAccounts.unlink")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={unlink.isPending}
        onConfirm={() => {
          if (!unlinkTarget) return Promise.resolve();
          return new Promise<void>((resolve, reject) =>
            unlink.mutate(unlinkTarget.provider, {
              onSuccess: () => {
                setUnlinkTarget(null);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          );
        }}
      />
    </div>
  );
}

function ProviderRow({
  row,
  onUnlink,
}: {
  row: OAuthAccountRow;
  onUnlink: () => void;
}) {
  const { t } = useAppStore();
  const meta = PROVIDER_META[row.provider] ?? { label: row.provider };
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{meta.label}</span>
          {row.email && (
            <span className="truncate text-[11px] text-muted-foreground">
              {row.email}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {t("auth.connectedAccounts.linkedOn", {
            date: formatDateTime(row.createdAt),
          })}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onUnlink}
        className="text-muted-foreground hover:text-destructive"
        aria-label={t("auth.connectedAccounts.unlink")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
