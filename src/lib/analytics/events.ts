export const productEventNames = [
  "landing_view",
  "cta_click",
  "quiz_start",
  "quiz_submit",
  "checkout_start",
  "paid",
  "day_completed",
  "chat_sent",
  "chat_escalated",
  "share_click",
  "completion_report_view",
] as const;

export type ProductEventName = (typeof productEventNames)[number];

export interface ProductEventProperties {
  cta_id?: "hero_primary" | "hero_secondary" | "footer_primary";
  day?: number;
  method?: "native" | "clipboard" | "manual";
  outcome?: "attempt" | "success" | "fallback" | "failure" | "cancelled";
  plan_ready?: boolean;
  program_completed?: boolean;
  result?: "eligible" | "not_eligible" | "needs_clinician_attention";
  source?: "checkout_success";
  step?: "eligibility" | "profile" | "summary";
  surface?:
    | "landing"
    | "onboarding"
    | "personalized_summary"
    | "checkout_success"
    | "day"
    | "chat"
    | "completion";
}

const eventNameSet = new Set<string>(productEventNames);
const allowedPropertyKeys = new Set<keyof ProductEventProperties>([
  "cta_id",
  "day",
  "method",
  "outcome",
  "plan_ready",
  "program_completed",
  "result",
  "source",
  "step",
  "surface",
]);
const blockedKeyPatterns = [
  /email/i,
  /user.?id/i,
  /session/i,
  /program.?id/i,
  /purchase.?id/i,
  /checkout/i,
  /stripe/i,
  /payment/i,
  /body.?part/i,
  /sub.?type/i,
  /pain/i,
  /notes?/i,
  /question/i,
  /answer/i,
  /report/i,
  /content.?json/i,
  /provider/i,
  /model/i,
  /quota/i,
  /url/i,
];

export function isProductEventName(value: string): value is ProductEventName {
  return eventNameSet.has(value);
}

function isSafeValue(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isBlockedKey(key: string) {
  return blockedKeyPatterns.some((pattern) => pattern.test(key));
}

export function sanitizeEventProperties(
  properties: ProductEventProperties | Record<string, unknown> | undefined
) {
  if (!properties) {
    return undefined;
  }

  const safeProperties: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (
      !allowedPropertyKeys.has(key as keyof ProductEventProperties) ||
      isBlockedKey(key) ||
      !isSafeValue(value)
    ) {
      continue;
    }

    safeProperties[key] = value;
  }

  return Object.keys(safeProperties).length > 0 ? safeProperties : undefined;
}
