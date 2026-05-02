"use client";

import Link from "next/link";
import { Users, Kanban, LayoutGrid } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/features/projects/types";

export function ProjectCard({
  proj,
  workspaceId,
  colorClass,
}: {
  proj: Project;
  workspaceId: string;
  colorClass: string;
}) {
  return (
    <Link href={ROUTES.BOARD(workspaceId, proj.id)}>
      <div className="group overflow-hidden rounded-xl border bg-card shadow-xs dark:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md dark:hover:shadow-black/40">
        {/* Gradient top */}
        <div className={`h-1 bg-linear-to-r ${colorClass}`} />

        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br ${colorClass} text-[11px] font-bold text-white shadow-sm`}>
              {proj.key}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[14px] font-semibold group-hover:text-primary">
                {proj.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                  {proj.type === "SCRUM" ? (
                    <><Kanban className="h-2.5 w-2.5" /> Scrum</>
                  ) : (
                    <><LayoutGrid className="h-2.5 w-2.5" /> Kanban</>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {proj.description && (
            <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
              {proj.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {proj._count?.members ?? 0}
              </span>
              {proj.lead && (
                <span className="truncate">
                  Lead: {proj.lead.name || "—"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
