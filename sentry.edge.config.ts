/**
 * Sentry Edge Configuration
 * Used for Edge runtime functions (middleware, Edge API routes).
 * No-op if neither SENTRY_DSN nor NEXT_PUBLIC_SENTRY_DSN is configured.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    debug: process.env.NODE_ENV === "development",
    environment: process.env.NODE_ENV,

    beforeSend(event) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Sentry Edge] Event captured (dev mode):",
          event.message
        );
        return null;
      }
      return event;
    },
  });
}
