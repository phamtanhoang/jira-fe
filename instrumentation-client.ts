import * as Sentry from "@sentry/nextjs";
import { ENV } from "@/lib/constants";

// Local dev: NEVER init Sentry even when the DSN is set, so events from
// developer machines do not pollute the project quota.
if (ENV.SENTRY_DSN && ENV.IS_PRODUCTION) {
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
}
