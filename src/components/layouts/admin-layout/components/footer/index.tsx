"use client";

import { ShieldCheck, BookOpen } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

export function AdminFooter() {
  const { t } = useAppStore();

  // BE mounts Swagger at /api — we reach it through the FE rewrite.
  const docsUrl = "/api";

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t bg-muted/30 px-4 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        <span className="font-medium">{t("admin.footer.system")}</span>
        <span className="text-muted-foreground/60">·</span>
        <span>
          {t("admin.footer.version")} <span className="font-mono">{APP_VERSION}</span>
        </span>
      </div>
      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-foreground"
      >
        <BookOpen className="h-3 w-3" />
        {t("admin.footer.docs")}
      </a>
    </footer>
  );
}
