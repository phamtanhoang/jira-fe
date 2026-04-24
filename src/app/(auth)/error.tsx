"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/logging";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useAppStore();

  useEffect(() => {
    reportError(error, { level: "ERROR" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="mb-2 text-xl font-semibold">
        {t("errors.somethingWentWrong")}
      </h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {t("errors.authHint")}
      </p>
      <Button onClick={reset}>{t("errors.tryAgain")}</Button>
    </div>
  );
}
