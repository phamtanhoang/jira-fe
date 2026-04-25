"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useShortcuts,
  onShortcutEvent,
  SHORTCUT_EVENTS,
} from "@/lib/hooks/use-shortcuts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Static binding map — kept here so the cheatsheet renders the same source
// of truth that the listener wires up.
const BINDINGS = [
  { keys: ["?"], labelKey: "shortcuts.cheatsheet" as const },
  { keys: ["c"], labelKey: "shortcuts.createIssue" as const },
  { keys: ["g", "d"], labelKey: "shortcuts.goDashboard" as const },
  { keys: ["g", "w"], labelKey: "shortcuts.goWorkspaces" as const },
  { keys: ["g", "p"], labelKey: "shortcuts.goProfile" as const },
  { keys: ["Ctrl", "K"], labelKey: "shortcuts.openSearch" as const },
];

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useAppStore();
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const navigate = useCallback((path: string) => router.push(path), [router]);

  useShortcuts(
    {
      single: {
        "?": { kind: "event", name: SHORTCUT_EVENTS.TOGGLE_CHEATSHEET },
        c: { kind: "event", name: SHORTCUT_EVENTS.OPEN_CREATE_ISSUE },
      },
      leader: {
        g: {
          d: { kind: "navigate", path: ROUTES.DASHBOARD },
          w: { kind: "navigate", path: ROUTES.WORKSPACES },
          p: { kind: "navigate", path: ROUTES.PROFILE },
        },
      },
    },
    navigate,
  );

  useEffect(() => {
    return onShortcutEvent(SHORTCUT_EVENTS.TOGGLE_CHEATSHEET, () => {
      setCheatsheetOpen((prev) => !prev);
    });
  }, []);

  return (
    <>
      {children}
      <Dialog open={cheatsheetOpen} onOpenChange={setCheatsheetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("shortcuts.title")}</DialogTitle>
            <DialogDescription>{t("shortcuts.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            {BINDINGS.map((b) => (
              <div
                key={b.labelKey}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] hover:bg-muted/40"
              >
                <span className="text-muted-foreground">{t(b.labelKey)}</span>
                <span className="flex items-center gap-1">
                  {b.keys.map((k, i) => (
                    <kbd
                      key={i}
                      className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
