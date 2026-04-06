"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">Something went wrong</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
