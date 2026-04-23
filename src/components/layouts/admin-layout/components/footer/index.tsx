"use client";

import { ShieldCheck } from "lucide-react";


export function AdminFooter() {

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t bg-muted/30 px-4 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
      </div>
    </footer>
  );
}
