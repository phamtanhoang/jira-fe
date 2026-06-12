"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Lock, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useInvitePreview,
  useJoinViaInvite,
} from "@/features/invite-links/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinPage() {
  const router = useRouter();
  const { t } = useAppStore();
  const { token } = useParams<{ token: string }>();
  const { data: preview, isLoading, isError } = useInvitePreview(token);
  const { mutate: join, isPending, data: joined } = useJoinViaInvite();

  // After successful join, redirect to the workspace.
  useEffect(() => {
    if (!joined?.workspace) return;
    const id = joined.workspace.id;
    const tm = setTimeout(() => router.push(ROUTES.WORKSPACE(id)), 1200);
    return () => clearTimeout(tm);
  }, [joined, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <Skeleton className="mb-3 h-7 w-40" />
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <Lock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-1 text-lg font-semibold">
          {t("invite.unavailableTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("invite.unavailableDesc")}
        </p>
      </div>
    );
  }

  if (joined) {
    const wsName = joined.workspace?.name ?? "";
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h1 className="mb-1 text-lg font-semibold">
          {joined.alreadyMember
            ? t("invite.alreadyMember", { name: wsName })
            : t("invite.joined", { name: wsName })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("invite.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mb-1 text-lg font-semibold">
          {t("invite.acceptTitle", { name: preview.workspace.name })}
        </h1>
        {preview.workspace.description && (
          <p className="mb-3 text-sm text-muted-foreground">
            {preview.workspace.description}
          </p>
        )}
        <p className="mb-6 text-[12px] text-muted-foreground">
          {t("invite.roleHint", { role: preview.role })}
          {preview.expiresAt && (
            <>
              {" "}
              {t("invite.expiresOn", {
                date: new Date(preview.expiresAt).toLocaleDateString(),
              })}
            </>
          )}
          {preview.remainingUses != null && (
            <>
              {" "}
              {preview.remainingUses === 1
                ? t("invite.oneUseLeft")
                : t("invite.usesLeft", { count: String(preview.remainingUses) })}
            </>
          )}
        </p>
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() => join(token)}
        >
          {isPending ? t("invite.joining") : t("invite.accept")}
        </Button>
      </div>
    </div>
  );
}
