"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Lock, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import {
  useInvitePreview,
  useJoinViaInvite,
} from "@/features/invite-links/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { data: preview, isLoading, isError } = useInvitePreview(token);
  const { mutate: join, isPending, data: joined } = useJoinViaInvite();

  // After successful join, redirect to the workspace.
  useEffect(() => {
    if (!joined?.workspace) return;
    const id = joined.workspace.id;
    const t = setTimeout(() => router.push(ROUTES.WORKSPACE(id)), 1200);
    return () => clearTimeout(t);
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
        <h1 className="mb-1 text-lg font-semibold">Invite unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This invite link is invalid, expired, or has been revoked.
        </p>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h1 className="mb-1 text-lg font-semibold">
          {joined.alreadyMember
            ? `Welcome back to ${joined.workspace?.name}`
            : `You're now a member of ${joined.workspace?.name}`}
        </h1>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
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
          Join {preview.workspace.name}
        </h1>
        {preview.workspace.description && (
          <p className="mb-3 text-sm text-muted-foreground">
            {preview.workspace.description}
          </p>
        )}
        <p className="mb-6 text-[12px] text-muted-foreground">
          You&apos;ll join with the role <strong>{preview.role}</strong>.
          {preview.expiresAt && (
            <>
              {" "}
              Expires {new Date(preview.expiresAt).toLocaleDateString()}.
            </>
          )}
          {preview.remainingUses != null && (
            <>
              {" "}
              {preview.remainingUses} {preview.remainingUses === 1 ? "use" : "uses"} left.
            </>
          )}
        </p>
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() => join(token)}
        >
          {isPending ? "Joining…" : "Accept invite"}
        </Button>
      </div>
    </div>
  );
}
