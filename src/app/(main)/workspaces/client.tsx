"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, FolderKanban, ArrowRight, Rocket } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useWorkspaces, useCreateWorkspace } from "@/features/workspaces/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GRADIENT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

export default function WorkspacesPage() {
  const { t } = useAppStore();
  const { data: workspaces, isLoading } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: create, isPending } = useCreateWorkspace();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => { setOpen(false); setName(""); setDescription(""); } },
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("workspace.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("workspace.subtitle")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button render={<DialogTrigger />}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("workspace.newWorkspace")}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("workspace.createWorkspace")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">{t("common.name")}</label>
                <Input
                  placeholder={t("workspace.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  {t("common.description")} <span className="text-muted-foreground">{t("common.optional")}</span>
                </label>
                <Textarea
                  placeholder={t("workspace.descPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
                {isPending ? t("common.creating") : t("workspace.createWorkspace")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : !Array.isArray(workspaces) || !workspaces.length ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-20 text-center">
          <Rocket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/25" />
          <p className="mb-1 text-sm font-semibold">{t("workspace.noWorkspaces")}</p>
          <p className="mb-6 text-[13px] text-muted-foreground">
            {t("workspace.noWorkspacesDesc")}
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("workspace.createWorkspace")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws, i) => (
            <Link key={ws.id} href={ROUTES.WORKSPACE(ws.id)}>
              <div className="group relative overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                {/* Gradient strip */}
                <div className={`h-1.5 bg-linear-to-r ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]}`} />

                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} text-base font-bold text-white shadow-sm`}>
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
                  </div>

                  <h3 className="mb-0.5 text-[15px] font-semibold group-hover:text-primary">
                    {ws.name}
                  </h3>
                  {ws.description ? (
                    <p className="mb-4 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                      {ws.description}
                    </p>
                  ) : (
                    <div className="mb-4" />
                  )}

                  <div className="flex items-center gap-4 border-t pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {ws._count?.members ?? 0} {t("common.members")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {ws._count?.projects ?? 0} {t("common.projects")}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
