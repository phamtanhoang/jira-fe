import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Next.js automatically calls register() once on server start.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Sentry is intentionally skipped in non-production environments so local
 * `next dev` runs never send events upstream, even if a DSN is present in .env.
 */
export function register() {
  if (!DSN || !IS_PROD) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
