"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import { handleApiError, showMessage } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ServerConfig = { enabled: boolean; publicKey: string | null };

/**
 * Renders the "Enable browser push" button on the profile page. The flow:
 *
 *   1. Fetch `/push/config` — bail if the server isn't configured (no
 *      VAPID keys → push module disabled).
 *   2. If the user has no SW registration / no subscription, render an
 *      "Enable" CTA that requests Notification permission, calls
 *      `pushManager.subscribe()`, then POSTs to `/push/subscribe`.
 *   3. If already subscribed, show "Disable" — DELETE `/push/subscribe`
 *      with the endpoint, then `subscription.unsubscribe()`.
 */
export function PushOptIn() {
  const { t } = useAppStore();
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">(
    "unknown",
  );
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);

    api
      .get<ServerConfig>(ENDPOINTS.push.config)
      .then((r) => setConfig(r.data))
      .catch(() => setConfig({ enabled: false, publicKey: null }));

    void navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      setSubscribed(!!sub);
    });
  }, []);

  if (!supported) return null;
  if (!config?.enabled || !config.publicKey) return null;

  const handleEnable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        showMessage("PUSH_PERMISSION_DENIED");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey!) as BufferSource,
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await api.post(ENDPOINTS.push.subscribe, {
        subscription: json,
        userAgent: navigator.userAgent,
      });
      setSubscribed(true);
      showMessage("PUSH_SUBSCRIBED");
    } catch (err) {
      handleApiError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api
          .delete(ENDPOINTS.push.subscribe, {
            data: { endpoint: sub.endpoint },
          })
          .catch(() => null);
        await sub.unsubscribe().catch(() => null);
      }
      setSubscribed(false);
      showMessage("PUSH_UNSUBSCRIBED");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold">
            {subscribed ? (
              <Bell className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {t("notifications.push.title")}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {subscribed
              ? t("notifications.push.descOn")
              : t("notifications.push.descOff")}
          </p>
        </div>
        {subscribed ? (
          <Button
            size="xs"
            variant="outline"
            disabled={busy}
            onClick={handleDisable}
          >
            {busy ? <Spinner className="h-3 w-3" /> : null}
            {t("notifications.push.disable")}
          </Button>
        ) : (
          <Button
            size="xs"
            disabled={busy || permission === "denied"}
            onClick={handleEnable}
          >
            {busy ? <Spinner className="h-3 w-3" /> : null}
            {permission === "denied"
              ? t("notifications.push.blocked")
              : t("notifications.push.enable")}
          </Button>
        )}
      </div>
    </div>
  );
}

// VAPID public keys are base64url-encoded; the PushManager API needs a
// Uint8Array. Standard helper.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
