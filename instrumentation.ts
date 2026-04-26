/**
 * Next.js Instrumentation entry.
 * Runs once when the server starts and dispatches runtime-specific Sentry init.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "App" | "Pages";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason: "on-demand" | "stale" | undefined;
  }
) => {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    extra: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
};
