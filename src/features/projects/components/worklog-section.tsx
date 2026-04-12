"use client";

import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWorklogs, useAddWorklog, useDeleteWorklog } from "../hooks";

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
  const { mutate: deleteWorklog } = useDeleteWorklog(issueId);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");

  const totalSeconds = worklogs?.reduce((s, w) => s + w.timeSpent, 0) ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const timeSpent = h * 3600 + m * 60;
    if (timeSpent <= 0) return;
    addWorklog(
      {
        timeSpent,
        startedAt: new Date().toISOString(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setHours("");
          setMinutes("");
          setDescription("");
          setShowForm(false);
        },
      },
    );
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
            <div key={w.id} className="flex items-center gap-2 text-[12px]">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[8px]">
                  {(w.user.name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{formatDuration(w.timeSpent)}</span>
              {w.description && <span className="truncate text-muted-foreground">— {w.description}</span>}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {new Date(w.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              {w.userId === currentUserId && (
                <button onClick={() => deleteWorklog(w.id)} className="text-muted-foreground/50 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
