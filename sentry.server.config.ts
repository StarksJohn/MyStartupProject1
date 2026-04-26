/**
 * Sentry Server Configuration
 * Runs whenever the server handles a request.
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

    spotlight: process.env.NODE_ENV === "development",

    beforeSend(event, hint) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Sentry Server] Event captured (dev mode):",
          event.message
        );
        return null;
      }

      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes("ECONNRESET")) {
          return null;
        }
        if (
          error.message.includes("Unauthorized") ||
          error.message.includes("Not Found")
        ) {
          return null;
        }
      }

      return event;
    },

    // Prisma integration is reintroduced by Story 3.1 when the ORM lands.
  });
}
