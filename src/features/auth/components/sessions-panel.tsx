"use client";

import { useState } from "react";
import {
  Laptop,
  LogOut,
  Smartphone,
  Tablet,
  Shield,
  Monitor,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useMySessions,
  useRevokeAllMySessions,
  useRevokeMySession,
  useRevokeOtherSessions,
} from "../hooks";
import type { SessionRow } from "../types";

interface ParsedUA {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop";
}

/**
 * Minimal, dependency-free UA parser. Extracts enough to show a recognisable
 * label ("Chrome 147 on Windows"); not bulletproof — good enough for the
 * session list. Heavy parsers (ua-parser-js ~20KB) aren't worth the bundle
 * cost when we only need a friendly display.
 */
function parseUA(ua: string | null | undefined): ParsedUA {
  if (!ua) return { browser: "Unknown", os: "Unknown", deviceType: "desktop" };

  const isMobile = /Mobile|Android.*Mobile|iPhone|iPod/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  let browser = "Unknown";
  const edge = /Edg\/(\d+)/.exec(ua);
  const chrome = /Chrome\/(\d+)/.exec(ua);
  const firefox = /Firefox\/(\d+)/.exec(ua);
  const safari = /Version\/(\d+).*Safari/.exec(ua);
  if (edge) browser = `Edge ${edge[1]}`;
  else if (firefox) browser = `Firefox ${firefox[1]}`;
  else if (chrome) browser = `Chrome ${chrome[1]}`;
  else if (safari) browser = `Safari ${safari[1]}`;

  let os = "Unknown";
  if (/Windows NT 10/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os, deviceType };
}

function DeviceIcon({ type }: { type: ParsedUA["deviceType"] }) {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

export function SessionsPanel() {
  const { t } = useAppStore();
  const { data: sessions, isLoading } = useMySessions();
  const revokeOne = useRevokeMySession();
  const revokeOthers = useRevokeOtherSessions();
  const revokeAll = useRevokeAllMySessions();

  const [toRevoke, setToRevoke] = useState<SessionRow | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const hasOthers = (sessions?.filter((s) => !s.isCurrent).length ?? 0) > 0;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <Monitor className="h-4 w-4" />
            {t("profile.sessions.title")}
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t("profile.sessions.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasOthers || revokeOthers.isPending}
            onClick={() => setConfirmOthers(true)}
          >
            {revokeOthers.isPending && (
              <Spinner className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("profile.sessions.signOutOthers")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={revokeAll.isPending}
            onClick={() => setConfirmAll(true)}
          >
            {revokeAll.isPending ? (
              <Spinner className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("profile.sessions.signOutAll")}
          </Button>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : !sessions?.length ? (
          <EmptyState
            compact
            icon={Monitor}
            title={t("profile.sessions.empty")}
            description={t("profile.sessions.emptyDesc")}
          />
        ) : (
          sessions.map((s) => {
            const ua = parseUA(s.userAgent);
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 border-b px-5 py-3.5 last:border-b-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                  <DeviceIcon type={ua.deviceType} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium">
                      {ua.browser} · {ua.os}
                    </span>
                    {s.isCurrent && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400"
                      >
                        <Shield className="h-3 w-3" />
                        {t("profile.sessions.thisDevice")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {s.ip && <span className="font-mono">{s.ip}</span>}
                    <span>
                      {t("profile.sessions.lastUsed", {
                        date: formatDateTime(s.lastUsedAt),
                      })}
                    </span>
                    <span>
                      {t("profile.sessions.signedIn", {
                        date: formatDateTime(s.createdAt),
                      })}
                    </span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setToRevoke(s)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {t("profile.sessions.signOut")}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!toRevoke}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title={t("profile.sessions.signOut")}
        description={t("profile.sessions.signOutConfirm")}
        confirmLabel={t("profile.sessions.signOut")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={revokeOne.isPending}
        onConfirm={() => {
          if (!toRevoke) return;
          return new Promise<void>((resolve, reject) =>
            revokeOne.mutate(toRevoke.id, {
              onSuccess: () => {
                setToRevoke(null);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          );
        }}
      />

      <ConfirmDialog
        open={confirmOthers}
        onOpenChange={setConfirmOthers}
        title={t("profile.sessions.signOutOthers")}
        description={t("profile.sessions.signOutOthersConfirm")}
        confirmLabel={t("profile.sessions.signOutOthers")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={revokeOthers.isPending}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            revokeOthers.mutate(undefined, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }),
          )
        }
      />

      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={t("profile.sessions.signOutAll")}
        description={t("profile.sessions.signOutAllConfirm")}
        confirmLabel={t("profile.sessions.signOutAll")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={revokeAll.isPending}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            revokeAll.mutate(undefined, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }),
          )
        }
      />
    </div>
  );
}
