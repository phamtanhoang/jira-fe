"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { cn, sanitizeRichHtml } from "@/lib/utils";
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
 * Read-only renderer for stored rich-text HTML.
 *
 * Defense-in-depth: BE also sanitizes on write. The FE pass here protects
 * against (a) historical rows persisted before BE sanitization shipped and
 * (b) any future BE bypass. DOMPurify is the industry-standard sanitizer —
 * preserves Tiptap's mention/image/link semantics while stripping every
 * known XSS vector (script, on*-handlers, javascript:, data:text/html,
 * mutation XSS, namespace confusion, ...).
 */
export function RichContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const router = useRouter();
  const safeHtml = useMemo(() => sanitizeRichHtml(html), [html]);

  // Delegated click handler — finds the closest mention span and routes to
  // the user's profile page. The click is fired on the inner span produced
  // by Tiptap (`<span data-mention data-id="UUID">@Name</span>`); using
  // `closest()` survives nested formatting like bold/italic mentions.
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-mention][data-id]",
      );
      if (!target) return;
      const id = target.dataset.id;
      if (!id) return;
      e.preventDefault();
      router.push(`/u/${id}`);
    },
    [router],
  );

  if (!safeHtml || safeHtml === "<p></p>") return null;

  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
