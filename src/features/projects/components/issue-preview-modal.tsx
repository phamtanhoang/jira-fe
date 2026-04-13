"use client";

import { useEffect } from "react";
import { IssueDetailContent } from "./issue-detail-content";

export function IssuePreviewModal({
  issueKey,
  onClose,
}: {
  issueKey: string;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
