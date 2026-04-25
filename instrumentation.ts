import * as Sentry from "@sentry/nextjs";
import { ENV } from "@/lib/constants";

/**
 * Next.js automatically calls register() once on server start.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Sentry is intentionally skipped in non-production environments so local
 * `next dev` runs never send events upstream, even if a DSN is present in .env.
 */
export function register() {
  if (!ENV.SENTRY_DSN || !ENV.IS_PRODUCTION) return;

  if (ENV.IS_NODE_RUNTIME) {
    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      environment: ENV.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }

  if (ENV.IS_EDGE_RUNTIME) {
    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      environment: ENV.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
