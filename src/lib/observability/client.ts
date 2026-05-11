"use client";

import * as Sentry from "@sentry/nextjs";

function isSentryConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureRenderError(error: Error, route: string) {
  if (!isSentryConfigured()) {
    return;
  }

  Sentry.captureException(error, {
    tags: {
      flow: "app_render",
      operation: "render_boundary",
      route,
    },
  });
}
