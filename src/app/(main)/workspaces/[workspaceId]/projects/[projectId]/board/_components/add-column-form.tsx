"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddColumnForm({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const { t } = useAppStore();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName("");
    setShowInput(false);
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex h-10 w-68 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed text-[12px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("board.addColumn")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-fit w-68 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-3"
    >
      <Input
        placeholder={t("board.columnName")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-[12px]"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="xs" type="submit" disabled={!name.trim()}>
          {t("common.add")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          type="button"
          onClick={() => setShowInput(false)}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
