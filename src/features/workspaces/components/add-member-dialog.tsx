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
import { useAddWorkspaceMember } from "../hooks";
import type { AddWorkspaceMemberPayload } from "../types";

export function AddMemberDialog({ workspaceId }: { workspaceId: string }) {
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
        Add Member
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              User must have an existing account
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
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
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !email.trim()}
          >
            {isPending ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
