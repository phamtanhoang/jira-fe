"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";

const PROMPT_DISMISSED_KEY = "pwa.installDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Registers the service worker + surfaces an "Install app" toast when the
 * browser fires `beforeinstallprompt`. Dismissed state is sticky in
 * localStorage so the prompt doesn't nag on every visit.
 *
 * Notifications-permission flow lives in `NotificationsPushOptIn` — kept
 * separate so the install prompt fires even when push isn't supported.
 */
export function PwaProvider() {
  const { t } = useAppStore();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(PROMPT_DISMISSED_KEY) === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !installEvent) return null;

  const handleInstall = async () => {
    try {
      await installEvent.prompt();
      await installEvent.userChoice.catch(() => null);
    } finally {
      setVisible(false);
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
      <Download className="h-3.5 w-3.5" />
      <span>{t("pwa.installPrompt")}</span>
      <Button size="xs" onClick={handleInstall}>
        {t("pwa.install")}
      </Button>
      <Button size="icon-xs" variant="ghost" onClick={handleDismiss}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
