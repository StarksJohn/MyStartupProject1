import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  captureError,
  captureMessage,
  clearObservabilityTestSink,
  sanitizeObservabilityContext,
  setObservabilityTestSink,
  type ObservabilityCapture,
} from "../src/lib/observability/server";

function readRepoFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test.describe("observability capture helper", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "Observability helper coverage only runs once."
    );
    clearObservabilityTestSink();
  });

  test.afterEach(() => {
    clearObservabilityTestSink();
  });

  test("sanitizes private metadata and keeps low-cardinality context", () => {
    const sanitized = sanitizeObservabilityContext({
      flow: "chat",
      operation: "generate_answer",
      route: "/api/chat?question=private",
      status: "chat_generation_failed",
      provider: "gemini",
      used_fallback: true,
      day: 4,
      email: "patient@example.com",
      question: "Why is my finger blue?",
      answer: "Private answer",
      contentJson: { title: "Day plan" },
      headers: { cookie: "secret" },
      stripeSecret: "sk_test_secret",
      rawUrl: "https://example.com/private?session_id=cs_test",
    });

    expect(sanitized).toEqual({
      flow: "chat",
      operation: "generate_answer",
      route: "/api/chat",
      status: "chat_generation_failed",
      provider: "gemini",
      used_fallback: true,
      day: 4,
    });
    expect(JSON.stringify(sanitized)).not.toContain("patient@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("blue");
    expect(JSON.stringify(sanitized)).not.toContain("contentJson");
    expect(JSON.stringify(sanitized)).not.toContain("secret");
  });

  test("no-DSN mode does not throw and the test sink receives sanitized captures", () => {
    const captures: ObservabilityCapture[] = [];
    setObservabilityTestSink((capture) => captures.push(capture));
    const checkoutError = new Error(
      "Checkout failed for patient@example.com via https://checkout.stripe.com/c/pay/cs_test_secret with sk_test_secret"
    );
    checkoutError.stack = [
      `Error: ${checkoutError.message}`,
      "    at createCheckoutSession (src/lib/billing/purchase-service.ts:42:11)",
    ].join("\n");

    expect(() =>
      captureError(
        checkoutError,
        {
          flow: "checkout",
          operation: "create_checkout_session",
          route: "/api/checkout",
          status: "stripe_checkout_unavailable",
          email: "private@example.com",
        }
      )
    ).not.toThrow();
    expect(() =>
      captureMessage("quota_fallback_to_database", {
        flow: "chat_quota",
        operation: "upstash_read",
        route: "/api/chat",
        severity: "warning",
        quotaKey: "chat:user:2026-05-11",
      })
    ).not.toThrow();

    expect(captures).toHaveLength(2);
    expect(captures[0]).toMatchObject({
      kind: "error",
      error: expect.objectContaining({
        message: expect.not.stringContaining("patient@example.com"),
        stack: expect.stringContaining("purchase-service.ts"),
      }),
      context: {
        flow: "checkout",
        operation: "create_checkout_session",
        route: "/api/checkout",
        status: "stripe_checkout_unavailable",
      },
    });
    expect(captures[1]).toMatchObject({
      kind: "message",
      message: "quota_fallback_to_database",
      context: {
        flow: "chat_quota",
        operation: "upstash_read",
        route: "/api/chat",
        severity: "warning",
      },
    });
    expect(captures[0].error?.stack).not.toContain("patient@example.com");
    expect(captures[0].error?.stack).not.toContain("checkout.stripe.com");
    expect(captures[0].error?.stack).not.toContain("sk_test_secret");
    expect(JSON.stringify(captures)).not.toContain("private@example.com");
    expect(JSON.stringify(captures)).not.toContain("checkout.stripe.com");
    expect(JSON.stringify(captures)).not.toContain("sk_test_secret");
    expect(JSON.stringify(captures)).not.toContain("quotaKey");
  });

  test("core caught failure paths call the shared observability helper", () => {
    const expectations = [
      {
        file: "src/app/api/checkout/route.ts",
        flow: 'flow: "checkout"',
        operation: 'operation: "create_checkout_session"',
      },
      {
        file: "src/app/api/stripe/webhook/route.ts",
        flow: 'flow: "billing_webhook"',
        operation: 'operation: "process_event"',
      },
      {
        file: "src/app/api/program/report/route.ts",
        flow: 'flow: "completion_report"',
        operation: 'operation: "generate_report"',
      },
      {
        file: "src/app/api/chat/route.ts",
        flow: 'flow: "chat"',
        operation: 'operation: "generate_answer"',
      },
      {
        file: "src/lib/chat/quota.ts",
        flow: 'flow: "chat_quota"',
        operation: 'operation: "upstash_read"',
      },
    ];

    for (const item of expectations) {
      const source = readRepoFile(item.file);
      expect(source).toContain("capture");
      expect(source).toContain(item.flow);
      expect(source).toContain(item.operation);
    }
  });
});
