"use client";

import { useState } from "react";
import { AlertTriangle, Download, ShieldX, Undo2 } from "lucide-react";
import { ENDPOINTS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelDeletion,
  useDeletionStatus,
  useRequestDeletion,
} from "../hooks";

export function PrivacyPanel() {
  const { t } = useAppStore();
  const { data: status, isLoading } = useDeletionStatus();
  const requestDeletion = useRequestDeletion();
  const cancelDeletion = useCancelDeletion();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const requested = !!status?.requestedAt;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldX className="h-4 w-4" />
          {t("auth.privacy.title")}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("auth.privacy.description")}
        </p>
      </div>

      {/* Data export */}
      <div className="rounded-md border bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold">
              {t("auth.privacy.exportTitle")}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("auth.privacy.exportDesc")}
            </p>
          </div>
          {/* Plain anchor — the BE returns a JSON file with
              Content-Disposition: attachment, so the browser downloads it
              directly. Going through axios would double-encode the body. */}
          <a
            href={`/api${ENDPOINTS.auth.dataExport}`}
            download="user-data.json"
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border bg-background px-2 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3 w-3" />
            {t("auth.privacy.exportCta")}
          </a>
        </div>
      </div>

      {/* Account deletion */}
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-destructive">
              {t("auth.privacy.deleteTitle")}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("auth.privacy.deleteDesc", {
                days: String(status?.graceDays ?? 30),
              })}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {isLoading ? (
            <Skeleton className="h-4 w-48" />
          ) : requested ? (
            <p className="text-[11px] text-destructive">
              {t("auth.privacy.scheduledFor", {
                date: formatDateTime(status!.hardDeleteAt!),
              })}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t("auth.privacy.notScheduled")}
            </p>
          )}

          {requested ? (
            <Button
              size="xs"
              variant="outline"
              onClick={() => cancelDeletion.mutate()}
              disabled={cancelDeletion.isPending}
            >
              <Undo2 className="h-3 w-3" />
              {t("auth.privacy.cancelDeletion")}
            </Button>
          ) : (
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={requestDeletion.isPending}
            >
              {t("auth.privacy.requestDeletion")}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={t("auth.privacy.confirmTitle")}
        description={t("auth.privacy.confirmDesc", {
          days: String(status?.graceDays ?? 30),
        })}
        confirmLabel={t("auth.privacy.requestDeletion")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={requestDeletion.isPending}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            requestDeletion.mutate(undefined, {
              onSuccess: () => {
                setConfirmDeleteOpen(false);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          )
        }
      />
    </div>
  );
}
