/**
 * Sentry Client Configuration
 * Runs whenever a user loads a page in their browser.
 * No-op if NEXT_PUBLIC_SENTRY_DSN is not configured.
 */

import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    debug: process.env.NODE_ENV === "development",
    environment: process.env.NODE_ENV,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration({
        enableInp: true,
      }),
    ],

    beforeSend(event, hint) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Sentry] Event captured (dev mode):", event);
        return null;
      }

      const error = hint.originalException;
      if (error instanceof Error) {
        if (
          error.message.includes("NetworkError") ||
          error.message.includes("Failed to fetch")
        ) {
          return null;
        }
      }

      return event;
    },
  });
}
