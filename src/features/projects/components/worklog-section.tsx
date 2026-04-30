"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useWorklogs, useAddWorklog, useUpdateWorklog, useDeleteWorklog } from "../hooks";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function WorklogSection({
  issueId,
  currentUserId,
}: {
  issueId: string;
  currentUserId: string;
}) {
  const { t } = useAppStore();
  const { data: worklogs } = useWorklogs(issueId);
  const { mutate: addWorklog, isPending } = useAddWorklog(issueId);
  const { mutate: updateWorklog } = useUpdateWorklog(issueId);
  const { mutate: deleteWorklog } = useDeleteWorklog(issueId);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const totalSeconds = worklogs?.reduce((s, w) => s + w.timeSpent, 0) ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const timeSpent = h * 3600 + m * 60;
    if (timeSpent <= 0) return;
    addWorklog(
      { timeSpent, startedAt: new Date().toISOString(), description: description.trim() || undefined },
      { onSuccess: () => { setHours(""); setMinutes(""); setDescription(""); setShowForm(false); } },
    );
  }

  function startEdit(w: { id: string; timeSpent: number; description: string | null }) {
    setEditingId(w.id);
    setEditHours(String(Math.floor(w.timeSpent / 3600)));
    setEditMinutes(String(Math.floor((w.timeSpent % 3600) / 60)));
    setEditDesc(w.description ?? "");
  }

  function saveEdit() {
    if (!editingId) return;
    const h = parseInt(editHours) || 0;
    const m = parseInt(editMinutes) || 0;
    const timeSpent = h * 3600 + m * 60;
    if (timeSpent <= 0) return;
    updateWorklog({ worklogId: editingId, timeSpent, description: editDesc.trim() || undefined });
    setEditingId(null);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
          <Clock className="h-3.5 w-3.5" />
          {t("worklog.title")}
          {totalSeconds > 0 && (
            <span className="ml-1 normal-case text-foreground">
              {formatDuration(totalSeconds)}
            </span>
          )}
        </h3>
        <Button size="xs" variant="ghost" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-3 w-3" />
          {t("worklog.log")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("worklog.hours")}</label>
              <Input type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} className="h-7 text-[12px]" placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("worklog.minutes")}</label>
              <Input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="h-7 text-[12px]" placeholder="0" />
            </div>
          </div>
          <Input placeholder={t("worklog.descOptional")} value={description} onChange={(e) => setDescription(e.target.value)} className="h-7 text-[12px]" />
          <div className="flex gap-2">
            <Button size="xs" type="submit" disabled={isPending}>{t("common.save")}</Button>
            <Button size="xs" variant="ghost" type="button" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      {worklogs && worklogs.length > 0 && (
        <div className="space-y-2">
          {worklogs.map((w) => (
            <div key={w.id}>
              {editingId === w.id ? (
                <div className="rounded border bg-muted/30 p-2 space-y-1.5">
                  <div className="flex gap-2">
                    <Input type="number" min={0} value={editHours} onChange={(e) => setEditHours(e.target.value)} className="h-6 w-16 text-[11px]" placeholder="h" />
                    <Input type="number" min={0} max={59} value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="h-6 w-16 text-[11px]" placeholder="m" />
                    <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-6 flex-1 text-[11px]" placeholder={t("worklog.descOptional")} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="text-primary hover:text-primary/80"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12px]">
                  <UserAvatar
                    user={w.user}
                    className="h-5 w-5 shrink-0"
                    fallbackClassName="text-[8px]"
                  />
                  <span className="font-medium">{formatDuration(w.timeSpent)}</span>
                  {w.description && <span className="truncate text-muted-foreground">— {w.description}</span>}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {formatDateShort(w.startedAt)}
                  </span>
                  {w.userId === currentUserId && (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => startEdit(w)}
                        aria-label={t("common.edit")}
                        className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteWorklog(w.id)}
                        aria-label={t("common.delete")}
                        className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
