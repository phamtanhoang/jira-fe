"use client";

import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/logging";
import { useAppStore } from "@/lib/stores/use-app-store";

/**
 * Wraps recharts components, which throw on undefined domains / NaN data.
 * A bad data point shouldn't crash the surrounding admin/dashboard page.
 *
 * Usage:
 *   <ChartErrorBoundary>
 *     <BurndownChart {...} />
 *   </ChartErrorBoundary>
 */
export function ChartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ChartFallback}
      onError={(error) => reportError(error, { level: "WARN" })}
    >
      {children}
    </ErrorBoundary>
  );
}

function ChartFallback({ resetErrorBoundary }: FallbackProps) {
  const { t } = useAppStore();
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/20 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="max-w-xs text-sm text-muted-foreground">
        {t("errors.chartFailed")}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("errors.tryAgain")}
      </button>
    </div>
  );
}
