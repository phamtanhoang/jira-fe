"use client";

import { useEffect } from "react";
import { MOBILE_BREAKPOINT, useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { IssueDetailContent } from "./issue-detail-content";

export function IssuePreviewModal({
  issueKey,
  onClose,
}: {
  issueKey: string;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  // Close on Escape (desktop modal only — Sheet handles its own escape).
  useEffect(() => {
    if (isMobile) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, isMobile]);

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="flex h-[92vh] flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetTitle className="sr-only">Issue {issueKey}</SheetTitle>
          <SheetDescription className="sr-only">
            Issue detail bottom sheet for mobile.
          </SheetDescription>
          <div className="flex-1 overflow-hidden">
            <IssueDetailContent
              key={issueKey}
              issueKey={issueKey}
              modal
              onClose={onClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 supports-backdrop-filter:backdrop-blur-sm" />

      <div
        className="relative z-10 h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <IssueDetailContent key={issueKey} issueKey={issueKey} modal onClose={onClose} />
      </div>
    </div>
  );
}
