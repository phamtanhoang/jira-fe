"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ENDPOINTS } from "@/lib/constants";
import { STALE_PUBLIC_SETTING } from "@/lib/constants/query-stale";
import { Button } from "@/components/ui/button";
import { authApi } from "../api";

// Hits BE for the configured-provider whitelist. Cached aggressively because
// the answer only changes when admin updates env vars or toggles the
// `app.auth_providers` setting. Exported so SignInForm can also hide the
// password block when the password provider is disabled.
export function useOAuthProviders() {
  return useQuery({
    queryKey: ["auth", "oauth-providers"],
    queryFn: () => authApi.oauthProviders(),
    staleTime: STALE_PUBLIC_SETTING,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function OAuthButtons() {
  const { t } = useAppStore();
  const { data } = useOAuthProviders();
  const google = data?.google;
  const github = data?.github;
  if (!google && !github) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("auth.or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {google && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          // Plain anchor-style nav: BE redirects to Google, then back to FE
          // via callback. Don't go through axios — we need a top-level
          // navigation so the browser follows redirects and stores cookies.
          onClick={() => {
            window.location.href = `/api${ENDPOINTS.auth.oauthGoogle}`;
          }}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {t("auth.continueWithGoogle")}
        </Button>
      )}

      {github && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = `/api${ENDPOINTS.auth.oauthGithub}`;
          }}
        >
          <GithubIcon className="mr-2 h-4 w-4" />
          {t("auth.continueWithGithub")}
        </Button>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.15v3.18c0 .31.21.66.8.55 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
  );
}
