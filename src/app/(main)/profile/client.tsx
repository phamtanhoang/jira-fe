"use client";

import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  Link2,
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  User,
} from "lucide-react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { useUrlTab } from "@/lib/hooks/use-url-tab";
import { getInitials, handleApiError } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useCurrentUser,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
} from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionsPanel } from "@/features/auth/components/sessions-panel";
import { TokensPanel } from "@/features/auth/components/tokens-panel";
import { PrivacyPanel } from "@/features/auth/components/privacy-panel";
import { ConnectedAccountsPanel } from "@/features/auth/components/connected-accounts-panel";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";

const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const PROFILE_TABS = [
  "general",
  "security",
  "connections",
  "notifications",
  "privacy",
] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

export default function ProfilePage() {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChanging } = useChangePassword();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const [tab, setTab] = useUrlTab<ProfileTab>(PROFILE_TABS, "general");

  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  function handlePickAvatar() {
    fileRef.current?.click();
  }

  function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-selected

    if (!file) return;
    if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
      handleApiError({ response: { data: { message: "INVALID_IMAGE_TYPE" } } });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      handleApiError({ response: { data: { message: "IMAGE_TOO_LARGE" } } });
      return;
    }
    uploadAvatar(file);
  }

  const initials = getInitials(user?.name, user?.email);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        {t("profile.title")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("profile.subtitle")}
      </p>

      {/* Identity card — always visible above the tabs so the user
          recognises whose account they're editing regardless of tab. */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-5 p-5">
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={isUploadingAvatar}
            className="group relative h-16 w-16 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("profile.changeAvatar")}
          >
            <Avatar className="h-16 w-16">
              {user?.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback className={`${AVATAR_GRADIENT} text-xl`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {isUploadingAvatar ? (
                <Spinner className="text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED_AVATAR_MIMES.join(",")}
            className="hidden"
            onChange={handleAvatarSelected}
          />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {user?.name || "User"}
            </h2>
            <p className="flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user?.email}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              {t("profile.avatarHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as ProfileTab)}>
        <TabsList>
          <TabsTrigger value="general">
            <User className="mr-1.5 h-3.5 w-3.5" />
            {t("profile.tab.general")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {t("profile.tab.security")}
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            {t("profile.tab.connections")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            {t("profile.tab.notifications")}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            {t("profile.tab.privacy")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold">
                <User className="h-4 w-4" />
                {t("profile.personalInfo")}
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">
                    {t("profile.nameLabel")}
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("profile.nameLabel")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">
                    {t("profile.emailLabel")}
                  </label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("profile.emailImmutable")}
                  </p>
                </div>
                <Button type="submit" disabled={isUpdating || !name.trim()}>
                  {isUpdating ? t("common.loading") : t("profile.updateProfile")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold">
                <Lock className="h-4 w-4" />
                {t("profile.changePassword")}
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">
                    {t("profile.currentPassword")}
                  </label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">
                    {t("profile.newPassword")}
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-[11px] text-destructive">
                      {t("validation.PASSWORD_MISMATCH")}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={
                    isChanging ||
                    !currentPassword ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  {isChanging ? t("common.loading") : t("profile.changePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <SessionsPanel />
        </TabsContent>

        <TabsContent value="connections" className="mt-4 space-y-6">
          <ConnectedAccountsPanel />
          <TokensPanel />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <PrivacyPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
