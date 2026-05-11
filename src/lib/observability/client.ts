"use client";

function isSentryConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

type SentryModule = typeof import("@sentry/nextjs");

function loadSentry() {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<SentryModule>;

  return dynamicImport("@sentry/nextjs");
}

export function captureRenderError(error: Error, route: string) {
  if (!isSentryConfigured()) {
    return;
  }

  void loadSentry().then((Sentry) => {
    Sentry.captureException(error, {
      tags: {
        flow: "app_render",
        operation: "render_boundary",
        route,
      },
    });
  });
}
