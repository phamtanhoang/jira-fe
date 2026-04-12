"use client";

import { useAppStore } from "@/lib/stores/use-app-store";

export function AppFooter({ className }: { className?: string }) {
  const { name, authorName, authorUrl, t } = useAppStore();
  const year = new Date().getFullYear().toString();

  return (
    <div className={className}>
      <p className="text-[10px] text-muted-foreground/60">
        {t("footer.copyright", { year, name: name || "Jira Clone" })}
      </p>
      {authorName && (
        <p className="text-[10px] text-muted-foreground/60">
          {t("footer.builtBy")}{" "}
          {authorUrl ? (
            <a
              href={authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-muted-foreground"
            >
              {authorName}
            </a>
          ) : (
            authorName
          )}
        </p>
      )}
    </div>
  );
}
