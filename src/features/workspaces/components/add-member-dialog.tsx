"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useAddWorkspaceMember } from "../hooks";
import type { AddWorkspaceMemberPayload } from "../types";

export function AddMemberDialog({ workspaceId }: { workspaceId: string }) {
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AddWorkspaceMemberPayload["role"]>("MEMBER");

  const { mutate: addMember, isPending } = useAddWorkspaceMember(workspaceId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    addMember(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setOpen(false);
          setEmail("");
          setRole("MEMBER");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button render={<DialogTrigger />} size="sm">
        <UserPlus className="mr-1.5 h-4 w-4" />
        {t("workspace.addMember")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("workspace.addMember")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("common.email")}</label>
            <Input
              type="email"
              placeholder={t("workspace.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("workspace.existingAccountHint")}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("common.role")}</label>
            <Select
              value={role}
              onValueChange={(v) =>
                v && setRole(v as AddWorkspaceMemberPayload["role"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{t("workspace.roles.ADMIN")}</SelectItem>
                <SelectItem value="MEMBER">{t("workspace.roles.MEMBER")}</SelectItem>
                <SelectItem value="VIEWER">{t("workspace.roles.VIEWER")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !email.trim()}
          >
            {isPending ? t("common.adding") : t("workspace.addMember")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
