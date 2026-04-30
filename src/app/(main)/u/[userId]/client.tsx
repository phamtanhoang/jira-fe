"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Mail, Pencil, UserX, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDate, getInitials } from "@/lib/utils";
import { useUserProfile } from "@/features/users/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useAppStore();
  const { data: profile, isLoading, isError } = useUserProfile(userId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <UserX className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-1 text-lg font-semibold">
          {t("userProfile.unavailableTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("userProfile.unavailableDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              {profile.image && (
                <AvatarImage
                  src={profile.image}
                  alt={profile.name ?? profile.email}
                />
              )}
              <AvatarFallback className={AVATAR_GRADIENT}>
                {getInitials(profile.name, profile.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold">
                    {profile.name ?? profile.email}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{profile.email}</span>
                  </p>
                </div>

                {profile.isSelf && (
                  <Link href={ROUTES.PROFILE}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      {t("userProfile.editProfile")}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("userProfile.joined")}
                  value={formatDate(profile.createdAt)}
                />
                {!profile.isSelf && (
                  <Stat
                    icon={<Users className="h-4 w-4" />}
                    label={t("userProfile.sharedWorkspaces")}
                    value={String(profile.sharedWorkspacesCount)}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
