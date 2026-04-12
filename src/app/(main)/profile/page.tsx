"use client";

import { useState } from "react";
import { User, Lock, Mail } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser, useUpdateProfile, useChangePassword } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChanging } = useChangePassword();

  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync name when user loads
  if (user?.name && !name) setName(user.name);

  function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile({ name: name.trim() });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  }

  const initials = (user?.name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t("profile.personalInfo")}</p>

      {/* Avatar + Info */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-5 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-linear-to-br from-teal-400 to-cyan-500 text-xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{user?.name || "User"}</h2>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Update profile form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold">
            <User className="h-4 w-4" />
            {t("profile.personalInfo")}
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("profile.nameLabel")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.nameLabel")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("profile.emailLabel")}</label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>
            <Button type="submit" disabled={isUpdating || !name.trim()}>
              {isUpdating ? t("common.loading") : t("profile.updateProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold">
            <Lock className="h-4 w-4" />
            {t("profile.changePassword")}
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("profile.currentPassword")}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("profile.newPassword")}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("profile.confirmNewPassword")}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-[11px] text-destructive">{t("validation.PASSWORD_MISMATCH")}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isChanging || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {isChanging ? t("common.loading") : t("profile.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
