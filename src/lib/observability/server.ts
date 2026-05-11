export type ObservabilityFlow =
  | "checkout"
  | "billing_webhook"
  | "day_completion"
  | "completion_report"
  | "chat"
  | "chat_quota"
  | "chat_stream"
  | "rag_retrieval"
  | "auth_session"
  | "app_render";

export type ObservabilitySeverity = "fatal" | "error" | "warning" | "info";

export interface ObservabilityContext {
  flow: ObservabilityFlow;
  operation: string;
  route?: string;
  status?: string;
  stripe_event_type?: string;
  stripe_event_id?: string;
  day?: number;
  provider?: "gemini" | "groq" | "mock" | "local-safety";
  used_fallback?: boolean;
  severity?: ObservabilitySeverity;
}

export interface ObservabilityCapture {
  kind: "error" | "message";
  message?: string;
  error?: Error;
  context: ObservabilityContext;
}

type UnsafeObservabilityContext = ObservabilityContext & Record<string, unknown>;
type ObservabilityTestSink = (capture: ObservabilityCapture) => void;
type SentryModule = typeof import("@sentry/nextjs");

const safeKeys = new Set<keyof ObservabilityContext>([
  "flow",
  "operation",
  "route",
  "status",
  "stripe_event_type",
  "stripe_event_id",
  "day",
  "provider",
  "used_fallback",
  "severity",
]);

let observabilityTestSink: ObservabilityTestSink | null = null;

export function setObservabilityTestSink(sink: ObservabilityTestSink) {
  observabilityTestSink = sink;
}

export function clearObservabilityTestSink() {
  observabilityTestSink = null;
}

function isSentryConfigured() {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

function normalizeRoute(route: string) {
  return route.split("?")[0] || route;
}

function normalizeProvider(value: unknown): ObservabilityContext["provider"] | undefined {
  return value === "gemini" ||
    value === "groq" ||
    value === "mock" ||
    value === "local-safety"
    ? value
    : undefined;
}

function sanitizeErrorMessage(message: string) {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/https?:\/\/\S+/g, "[redacted-url]")
    .replace(/\b(sk|rk)_(live|test)_[A-Za-z0-9_]+/g, "[redacted-stripe-secret]")
    .replace(/\bwhsec_[A-Za-z0-9_]+/g, "[redacted-webhook-secret]")
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted-token]");
}

function normalizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Unknown captured error");
  }

  const sanitizedError = new Error(sanitizeErrorMessage(error.message));
  sanitizedError.name = error.name;

  return sanitizedError;
}

export function sanitizeObservabilityContext(
  context: UnsafeObservabilityContext
): ObservabilityContext {
  const sanitized: Partial<ObservabilityContext> = {};

  for (const key of safeKeys) {
    const value = context[key];

    if (value === undefined || value === null) {
      continue;
    }

    switch (key) {
      case "flow":
      case "operation":
      case "status":
      case "stripe_event_type":
      case "stripe_event_id":
      case "severity":
        if (typeof value === "string") {
          sanitized[key] = value as never;
        }
        break;
      case "route":
        if (typeof value === "string") {
          sanitized.route = normalizeRoute(value);
        }
        break;
      case "day":
        if (typeof value === "number" && Number.isInteger(value)) {
          sanitized.day = value;
        }
        break;
      case "provider":
        sanitized.provider = normalizeProvider(value);
        break;
      case "used_fallback":
        if (typeof value === "boolean") {
          sanitized.used_fallback = value;
        }
        break;
    }
  }

  return {
    flow: sanitized.flow ?? context.flow,
    operation: sanitized.operation ?? context.operation,
    ...sanitized,
  };
}

function buildSentryScope(context: ObservabilityContext) {
  const extra = Object.fromEntries(
    Object.entries(context).filter(([key]) => key !== "severity")
  );

  return {
    level: context.severity ?? "error",
    tags: {
      flow: context.flow,
      operation: context.operation,
      ...(context.route ? { route: context.route } : {}),
      ...(context.status ? { status: context.status } : {}),
      ...(context.provider ? { provider: context.provider } : {}),
    },
    extra,
  };
}

function loadSentry() {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<SentryModule>;

  return dynamicImport("@sentry/nextjs");
}

function sendErrorToSentry(error: Error, context: ObservabilityContext) {
  void loadSentry().then((Sentry) => {
    Sentry.captureException(error, buildSentryScope(context));
  });
}

function sendMessageToSentry(message: string, context: ObservabilityContext) {
  void loadSentry().then((Sentry) => {
    Sentry.captureMessage(message, buildSentryScope(context));
  });
}

export function captureError(error: unknown, context: UnsafeObservabilityContext) {
  const normalizedError = normalizeError(error);
  const sanitized = sanitizeObservabilityContext(context);

  observabilityTestSink?.({
    kind: "error",
    error: normalizedError,
    context: sanitized,
  });

  if (!isSentryConfigured()) {
    return;
  }

  sendErrorToSentry(normalizedError, sanitized);
}

export function captureMessage(message: string, context: UnsafeObservabilityContext) {
  const sanitized = sanitizeObservabilityContext(context);

  observabilityTestSink?.({
    kind: "message",
    message,
    context: sanitized,
  });

  if (!isSentryConfigured()) {
    return;
  }

  sendMessageToSentry(message, sanitized);
}
