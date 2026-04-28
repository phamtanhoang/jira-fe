"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ban,
  Copy as CopyIcon,
  GitBranch,
  Link2,
  Plus,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { TYPE_CONFIG } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddIssueLink, useRemoveIssueLink } from "../hooks";
import { issuesApi } from "../api";
import type { Issue, IssueLink, IssueLinkType } from "../types";

const LINK_TYPES: {
  value: IssueLinkType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "BLOCKS", label: "Blocks", icon: Ban },
  { value: "RELATES", label: "Relates to", icon: Link2 },
  { value: "DUPLICATES", label: "Duplicates", icon: CopyIcon },
  { value: "CLONED_FROM", label: "Cloned from", icon: GitBranch },
];

const INBOUND_LABEL: Record<IssueLinkType, string> = {
  BLOCKS: "Is blocked by",
  RELATES: "Relates to",
  DUPLICATES: "Is duplicated by",
  CLONED_FROM: "Cloned to",
};

export function IssueLinksSection({ issue }: { issue: Issue }) {
  const { t } = useAppStore();
  const [adding, setAdding] = useState(false);
  const { mutate: addLink, isPending: linking } = useAddIssueLink(issue.key);
  const { mutate: removeLink } = useRemoveIssueLink(issue.key);

  const out = issue.outboundLinks ?? [];
  const inb = issue.inboundLinks ?? [];

  if (out.length === 0 && inb.length === 0 && !adding) {
    return (
      <div className="px-2 py-1">
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          {t("issue.addLink")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("issue.links")}
        </span>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            {t("common.add")}
          </button>
        )}
      </div>

      {/* Outbound */}
      {LINK_TYPES.map((tgrp) => {
        const rows = out.filter((l) => l.type === tgrp.value);
        if (rows.length === 0) return null;
        return (
          <LinkGroup
            key={`out-${tgrp.value}`}
            label={tgrp.label}
            icon={tgrp.icon}
            links={rows}
            peerKey="target"
            onRemove={(lid) => removeLink({ id: issue.id, linkId: lid })}
          />
        );
      })}

      {/* Inbound */}
      {LINK_TYPES.map((tgrp) => {
        const rows = inb.filter((l) => l.type === tgrp.value);
        if (rows.length === 0) return null;
        return (
          <LinkGroup
            key={`in-${tgrp.value}`}
            label={INBOUND_LABEL[tgrp.value]}
            icon={tgrp.icon}
            links={rows}
            peerKey="source"
            onRemove={(lid) => removeLink({ id: issue.id, linkId: lid })}
          />
        );
      })}

      {adding && (
        <AddLinkRow
          projectId={issue.projectId}
          excludeId={issue.id}
          disabled={linking}
          onCancel={() => setAdding(false)}
          onSubmit={(targetIssueId, type) => {
            addLink(
              { id: issue.id, targetIssueId, type },
              { onSuccess: () => setAdding(false) },
            );
          }}
        />
      )}
    </div>
  );
}

function LinkGroup({
  label,
  icon: Icon,
  links,
  peerKey,
  onRemove,
}: {
  label: string;
  icon: React.ElementType;
  links: IssueLink[];
  peerKey: "target" | "source";
  onRemove: (linkId: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <div className="space-y-1">
        {links.map((l) => {
          const peer = l[peerKey];
          if (!peer) return null;
          const typeConf = TYPE_CONFIG[peer.type] ?? TYPE_CONFIG.TASK;
          const TypeIcon = typeConf.icon;
          return (
            <div
              key={l.id}
              className="group/link flex items-center gap-1.5 rounded px-1 py-1 hover:bg-muted/40"
            >
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm ${typeConf.bg}`}
              >
                <TypeIcon className="h-2.5 w-2.5 text-white" />
              </div>
              <Link
                href={ROUTES.ISSUE(peer.key)}
                className="min-w-0 flex-1 truncate text-[12px] hover:text-primary hover:underline"
                title={`${peer.key} ${peer.summary}`}
              >
                <span className="font-medium text-muted-foreground">
                  {peer.key}
                </span>
                <span className="ml-1.5 text-foreground">{peer.summary}</span>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(l.id)}
                className="rounded p-0.5 text-muted-foreground/40 opacity-0 hover:text-destructive group-hover/link:opacity-100"
                aria-label="Remove link"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddLinkRow({
  projectId,
  excludeId,
  disabled,
  onSubmit,
  onCancel,
}: {
  projectId: string;
  excludeId: string;
  disabled?: boolean;
  onSubmit: (targetIssueId: string, type: IssueLinkType) => void;
  onCancel: () => void;
}) {
  const { t } = useAppStore();
  const [type, setType] = useState<IssueLinkType>("RELATES");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<
    { id: string; key: string; summary: string }[]
  >([]);
  const [searching, setSearching] = useState(false);

  // Tiny debounce — don't pound the search endpoint while typing.
  function onSearchChange(value: string) {
    setSearch(value);
    if (!value.trim() || value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    issuesApi
      .list(projectId, { search: value.trim() })
      .then((rs) =>
        setResults(
          rs
            .filter((i) => i.id !== excludeId)
            .slice(0, 8)
            .map((i) => ({ id: i.id, key: i.key, summary: i.summary })),
        ),
      )
      .finally(() => setSearching(false));
  }

  return (
    <div className="space-y-2 rounded-md border bg-card p-2">
      <div className="flex items-center gap-2">
        <Select
          value={type}
          onValueChange={(v) => v && setType(v as IssueLinkType)}
        >
          <SelectTrigger className="h-7 w-32 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LINK_TYPES.map((tt) => (
              <SelectItem key={tt.value} value={tt.value}>
                {tt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("issue.linkSearchPlaceholder")}
          className="h-7 text-[12px]"
          autoFocus
        />
      </div>
      <div className="max-h-40 space-y-0.5 overflow-auto">
        {searching && (
          <div className="px-2 py-1 text-[11px] text-muted-foreground">
            {t("common.loading")}
          </div>
        )}
        {!searching && results.length === 0 && search.trim() && (
          <div className="px-2 py-1 text-[11px] text-muted-foreground">
            {t("common.noResults")}
          </div>
        )}
        {results.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(r.id, type)}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] hover:bg-muted/60 disabled:opacity-50"
          >
            <span className="font-medium text-muted-foreground">{r.key}</span>
            <span className="min-w-0 flex-1 truncate">{r.summary}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
