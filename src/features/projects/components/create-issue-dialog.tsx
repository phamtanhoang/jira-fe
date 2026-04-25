"use client";

import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { onShortcutEvent, SHORTCUT_EVENTS } from "@/lib/hooks/use-shortcuts";
import { useIssueTemplates } from "@/features/issue-templates/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useCreateIssue } from "../hooks";
import type { Issue, Sprint } from "../types";

export function CreateIssueDialog({
  projectId,
  sprints = [],
}: {
  projectId: string;
  sprints?: Sprint[];
}) {
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Issue["type"]>("TASK");
  const [priority, setPriority] = useState<Issue["priority"]>("MEDIUM");
  const [sprintId, setSprintId] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState("");

  const { mutate: create, isPending } = useCreateIssue();
  const { data: templates } = useIssueTemplates(open ? projectId : undefined);

  // The "c" global shortcut opens this dialog from anywhere on a board page.
  useEffect(() => {
    return onShortcutEvent(SHORTCUT_EVENTS.OPEN_CREATE_ISSUE, () => setOpen(true));
  }, []);

  // Apply template defaults; doesn't lock the form — user can still tweak.
  function applyTemplate(id: string) {
    const tpl = templates?.find((x) => x.id === id);
    if (!tpl) return;
    setType(tpl.type);
    if (tpl.defaultPriority) setPriority(tpl.defaultPriority);
    if (tpl.descriptionHtml) setDescription(tpl.descriptionHtml);
    if (!summary) setSummary(tpl.name);
  }

  // Only show active/planning sprints
  const availableSprints = sprints.filter(
    (s) => s.status === "ACTIVE" || s.status === "PLANNING",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    create(
      {
        projectId,
        summary: summary.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        sprintId: sprintId || undefined,
        storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSummary("");
          setDescription("");
          setType("TASK");
          setPriority("MEDIUM");
          setSprintId("");
          setStoryPoints("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button render={<DialogTrigger />} size="sm">
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {t("issue.createIssue")}
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("issue.createIssue")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template picker — only shows if any templates exist */}
          {templates && templates.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                <FileText className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                {t("issue.fromTemplate")}
              </label>
              <Select
                onValueChange={(v) => v && applyTemplate(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("issue.pickTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("common.type")}</label>
              <Select value={type} onValueChange={(v) => v && setType(v as Issue["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EPIC">{t("issue.types.EPIC")}</SelectItem>
                  <SelectItem value="STORY">{t("issue.types.STORY")}</SelectItem>
                  <SelectItem value="BUG">{t("issue.types.BUG")}</SelectItem>
                  <SelectItem value="TASK">{t("issue.types.TASK")}</SelectItem>
                  <SelectItem value="SUBTASK">{t("issue.types.SUBTASK")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("issue.priority")}</label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as Issue["priority"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGHEST">{t("issue.priorities.HIGHEST")}</SelectItem>
                  <SelectItem value="HIGH">{t("issue.priorities.HIGH")}</SelectItem>
                  <SelectItem value="MEDIUM">{t("issue.priorities.MEDIUM")}</SelectItem>
                  <SelectItem value="LOW">{t("issue.priorities.LOW")}</SelectItem>
                  <SelectItem value="LOWEST">{t("issue.priorities.LOWEST")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">{t("issue.summary")}</label>
            <Input
              placeholder={t("issue.summaryPlaceholder")}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">{t("common.description")}</label>
            <Textarea
              placeholder={t("issue.descPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sprint */}
            {availableSprints.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">{t("issue.sprint")}</label>
                <Select value={sprintId} onValueChange={(v) => setSprintId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("issue.backlogStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("issue.backlogStatus")}</SelectItem>
                    {availableSprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.status === "ACTIVE" && ` (${t("sprint.active")})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Story points */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">{t("issue.storyPoints")}</label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !summary.trim()}>
            {isPending ? t("common.creating") : t("issue.createIssue")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
