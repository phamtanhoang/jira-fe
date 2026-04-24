"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { RichEditorProps } from "./editor.client";

/**
 * Tiptap pulls in ~80KB of editor code. We only need it when the user is
 * actually editing — reading an issue never loads it. `next/dynamic` with
 * `ssr: false` makes Next emit it as a separate chunk that lazy-loads.
 */
export const RichEditor = dynamic<RichEditorProps>(
  () => import("./editor.client"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border bg-background">
        <div className="h-8 border-b" />
        <Skeleton className="m-3 h-20" />
      </div>
    ),
  },
);

/**
 * Read-only renderer for stored HTML content. Pure render — no Tiptap
 * dependency, so this stays in the main bundle and SSRs fine.
 */
export function RichContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html || html === "<p></p>") return null;

  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
