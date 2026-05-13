import { expect, test } from "@playwright/test";
import { PrismaClient, ProgramStatus, PurchaseStatus } from "@prisma/client";
import Stripe from "stripe";

import {
  loadProgramContentBundle,
  validateProgramContentReferences,
  type ProgramContentBundle,
} from "../src/lib/program/program-content";
import { recordPendingPurchaseForCheckoutSession } from "../src/lib/billing/purchase-service";

const prisma = new PrismaClient();
const stripe = new Stripe("sk_test_playwright");
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_playwright_test";

const createdUserIds = new Set<string>();
const createdEventIds = new Set<string>();

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createWebhookUser({ withProfile }: { withProfile: boolean }) {
  const userId = uniqueId("dev-webhook-user");
  createdUserIds.add(userId);

  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@example.com`,
    },
  });

  if (withProfile) {
    await prisma.recoveryProfile.create({
      data: {
        userId,
        bodyPart: "finger",
        subType: "proximal phalanx stiffness",
        castRemovedAt: new Date(),
        hasHardware: "no",
        referredToPt: "not_sure",
        painLevel: 3,
        dominantHandAffected: false,
        jobType: "desk",
        riskFlagsJson: {},
      },
    });
  }

  return userId;
}

function createEventPayload(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  return { payload, signature };
}

function checkoutCompletedEvent({
  eventId,
  checkoutSessionId,
  userId,
  paymentIntentId,
}: {
  eventId: string;
  checkoutSessionId: string;
  userId: string;
  paymentIntentId: string;
}) {
  createdEventIds.add(eventId);

  return {
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkoutSessionId,
        object: "checkout.session",
        client_reference_id: userId,
        amount_total: 1499,
        currency: "usd",
        customer: `cus_${checkoutSessionId}`,
        payment_intent: paymentIntentId,
      },
    },
  };
}

async function postSignedWebhook(
  request: import("@playwright/test").APIRequestContext,
  event: Record<string, unknown>
) {
  const { payload, signature } = createEventPayload(event);

  return request.post("/api/stripe/webhook", {
    data: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
  });
}

test.describe("stripe webhook unlock", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "Webhook API coverage only runs once."
    );
  });

  test.afterAll(async () => {
    await prisma.stripeWebhookEvent.deleteMany({
      where: { stripeEventId: { in: [...createdEventIds] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [...createdUserIds] } },
    });
    await prisma.$disconnect();
  });

  test("program content loader ignores contracts and rejects unresolved refs", async () => {
    const bundle = await loadProgramContentBundle();
    expect(bundle.templates.map((template) => template.templateVersion)).toEqual([
      "finger-v1",
    ]);
    expect(bundle.exercises.map((exercise) => exercise.slug)).not.toContain(
      "string"
    );
    expect(bundle.faqs.map((faq) => faq.slug)).not.toContain("string");

    const invalidBundle: ProgramContentBundle = {
      ...bundle,
      templates: [
        {
          ...bundle.templates[0],
          days: bundle.templates[0].days.map((day) =>
            day.dayIndex === 1
              ? { ...day, exerciseSlugs: ["missing-exercise-slug"] }
              : day
          ),
        },
      ],
    };

    expect(() => validateProgramContentReferences(invalidBundle)).toThrow(
      /missing exercise slug: missing-exercise-slug/
    );

    const invalidFaqBundle: ProgramContentBundle = {
      ...bundle,
      templates: [
        {
          ...bundle.templates[0],
          days: bundle.templates[0].days.map((day) =>
            day.dayIndex === 1 ? { ...day, faqSlugs: ["missing-faq-slug"] } : day
          ),
        },
      ],
    };

    expect(() => validateProgramContentReferences(invalidFaqBundle)).toThrow(
      /missing FAQ slug: missing-faq-slug/
    );
  });

  test("valid checkout webhook creates one paid purchase, program, and 14 days", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const checkoutSessionId = uniqueId("cs_test_completed");
    const event = checkoutCompletedEvent({
      eventId: uniqueId("evt_completed"),
      checkoutSessionId,
      userId,
      paymentIntentId: uniqueId("pi_completed"),
    });

    const response = await postSignedWebhook(request, event);
    expect(response.status()).toBe(200);

    const purchase = await prisma.purchase.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: {
        program: {
          include: { days: true },
        },
      },
    });

    expect(purchase?.status).toBe(PurchaseStatus.PAID);
    expect(purchase?.program?.currentDay).toBe(1);
    expect(purchase?.program?.templateVersion).toBe("finger-v1");
    expect(purchase?.program?.days).toHaveLength(14);
    expect(
      purchase?.program?.days.map((day) => day.dayIndex).sort((a, b) => a - b)
    ).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    const dayOne = purchase?.program?.days.find((day) => day.dayIndex === 1);
    expect(dayOne?.stage).toBe("early_mobility");
    expect(dayOne?.estimatedMinutes).toBeGreaterThan(0);
    expect(dayOne?.contentJson).toMatchObject({
      title: "Day 1: Begin gentle motion",
      exerciseSlugs: expect.arrayContaining(["gentle-finger-bends"]),
      faqSlugs: expect.arrayContaining(["finger-swelling-after-cast"]),
    });
    expect(JSON.stringify(dayOne?.contentJson)).toContain("severe pain");
    expect(JSON.stringify(dayOne?.contentJson)).toContain(
      "Stop and contact a clinician"
    );
  });

  test("repeated checkout webhook delivery is idempotent", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const checkoutSessionId = uniqueId("cs_test_repeat");
    const event = checkoutCompletedEvent({
      eventId: uniqueId("evt_repeat"),
      checkoutSessionId,
      userId,
      paymentIntentId: uniqueId("pi_repeat"),
    });

    await expect((await postSignedWebhook(request, event)).status()).toBe(200);
    await expect((await postSignedWebhook(request, event)).status()).toBe(200);

    const purchaseCount = await prisma.purchase.count({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });
    const programCount = await prisma.program.count({
      where: { purchase: { stripeCheckoutSessionId: checkoutSessionId } },
    });
    const dayCount = await prisma.programDay.count({
      where: { program: { purchase: { stripeCheckoutSessionId: checkoutSessionId } } },
    });

    expect(purchaseCount).toBe(1);
    expect(programCount).toBe(1);
    expect(dayCount).toBe(14);
  });

  test("checkout webhook upgrades existing placeholder days without losing progress", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const recoveryProfile = await prisma.recoveryProfile.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    const checkoutSessionId = uniqueId("cs_test_backfill");
    const paymentIntentId = uniqueId("pi_backfill");
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        stripeCheckoutSessionId: checkoutSessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: 1499,
        currency: "usd",
        status: PurchaseStatus.PAID,
        paidAt: new Date(),
      },
    });
    const program = await prisma.program.create({
      data: {
        userId,
        recoveryProfileId: recoveryProfile.id,
        purchaseId: purchase.id,
        templateVersion: "story-3-2-placeholder-v1",
        startDate: new Date(),
        endDate: new Date(),
        currentDay: 1,
        status: ProgramStatus.ACTIVE,
        generatedSummaryJson: {
          source: "story-3-2-placeholder",
        },
      },
    });
    const completedAt = new Date();
    await prisma.programDay.createMany({
      data: Array.from({ length: 14 }, (_, index) => {
        const dayIndex = index + 1;

        return {
          programId: program.id,
          dayIndex,
          stage: "placeholder",
          contentJson: {
            title: `Placeholder day ${dayIndex}`,
            exerciseSlugs: [],
            faqSlugs: [],
          },
          estimatedMinutes: 10,
          completionPercent: dayIndex === 1 ? 50 : 0,
          completedAt: dayIndex === 1 ? completedAt : null,
        };
      }),
    });
    await prisma.programDay.create({
      data: {
        programId: program.id,
        dayIndex: 15,
        stage: "placeholder",
        contentJson: {
          title: "Invalid extra placeholder day",
          exerciseSlugs: [],
          faqSlugs: [],
        },
        estimatedMinutes: 10,
      },
    });
    const event = checkoutCompletedEvent({
      eventId: uniqueId("evt_backfill"),
      checkoutSessionId,
      userId,
      paymentIntentId,
    });

    const response = await postSignedWebhook(request, event);
    expect(response.status()).toBe(200);

    const updatedProgram = await prisma.program.findUniqueOrThrow({
      where: { id: program.id },
      include: { days: true },
    });
    const dayOne = updatedProgram.days.find((day) => day.dayIndex === 1);

    expect(updatedProgram.templateVersion).toBe("finger-v1");
    expect(updatedProgram.days).toHaveLength(14);
    expect(updatedProgram.days.map((day) => day.dayIndex)).not.toContain(15);
    expect(dayOne?.stage).toBe("early_mobility");
    expect(dayOne?.completionPercent).toBe(50);
    expect(dayOne?.completedAt).not.toBeNull();
    expect(dayOne?.contentJson).toMatchObject({
      title: "Day 1: Begin gentle motion",
      exerciseSlugs: expect.arrayContaining(["gentle-finger-bends"]),
    });
  });

  test("invalid webhook signature returns 400 without purchase writes", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const checkoutSessionId = uniqueId("cs_test_invalid");
    const event = checkoutCompletedEvent({
      eventId: uniqueId("evt_invalid"),
      checkoutSessionId,
      userId,
      paymentIntentId: uniqueId("pi_invalid"),
    });

    const response = await request.post("/api/stripe/webhook", {
      data: JSON.stringify(event),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "invalid_signature",
      },
    });

    expect(response.status()).toBe(400);
    await expect(
      prisma.purchase.count({ where: { stripeCheckoutSessionId: checkoutSessionId } })
    ).resolves.toBe(0);
  });

  test("checkout webhook without recovery profile records purchase but no program", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: false });
    const checkoutSessionId = uniqueId("cs_test_missing_profile");
    const event = checkoutCompletedEvent({
      eventId: uniqueId("evt_missing_profile"),
      checkoutSessionId,
      userId,
      paymentIntentId: uniqueId("pi_missing_profile"),
    });

    const response = await postSignedWebhook(request, event);
    expect(response.status()).toBe(200);

    const purchase = await prisma.purchase.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: { program: true },
    });

    expect(purchase?.status).toBe(PurchaseStatus.PAID);
    expect(purchase?.program).toBeNull();
  });

  test("checkout creation can persist a pending purchase without unsafe unlock", async () => {
    const userId = await createWebhookUser({ withProfile: true });
    const checkoutSessionId = uniqueId("cs_pending_creation");
    const paymentIntentId = uniqueId("pi_pending_creation");

    await recordPendingPurchaseForCheckoutSession({
      userId,
      checkoutSessionId,
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: uniqueId("cus_pending_creation"),
      amount: 1499,
      currency: "USD",
    });

    const purchase = await prisma.purchase.findUniqueOrThrow({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: { program: true },
    });

    expect(purchase).toMatchObject({
      userId,
      stripePaymentIntentId: paymentIntentId,
      amount: 1499,
      currency: "usd",
      status: PurchaseStatus.PENDING,
    });
    expect(purchase.program).toBeNull();
  });

  test("failed and expired checkout events update only pending purchases", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const paymentIntentId = uniqueId("pi_pending_failure");
    const pendingPurchase = await prisma.purchase.create({
      data: {
        userId,
        stripeCheckoutSessionId: uniqueId("cs_test_pending_failure"),
        stripePaymentIntentId: paymentIntentId,
        amount: 1499,
        currency: "usd",
        status: PurchaseStatus.PENDING,
      },
    });

    const failedEventId = uniqueId("evt_payment_failed");
    createdEventIds.add(failedEventId);
    const failedResponse = await postSignedWebhook(request, {
      id: failedEventId,
      object: "event",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: paymentIntentId,
          object: "payment_intent",
        },
      },
    });
    expect(failedResponse.status()).toBe(200);

    await expect(
      prisma.purchase.findUniqueOrThrow({ where: { id: pendingPurchase.id } })
    ).resolves.toMatchObject({ status: PurchaseStatus.FAILED });

    const expiredPurchase = await prisma.purchase.create({
      data: {
        userId,
        stripeCheckoutSessionId: uniqueId("cs_test_expired"),
        amount: 1499,
        currency: "usd",
        status: PurchaseStatus.PENDING,
      },
    });
    const expiredEventId = uniqueId("evt_checkout_expired");
    createdEventIds.add(expiredEventId);
    const expiredResponse = await postSignedWebhook(request, {
      id: expiredEventId,
      object: "event",
      type: "checkout.session.expired",
      data: {
        object: {
          id: expiredPurchase.stripeCheckoutSessionId,
          object: "checkout.session",
        },
      },
    });
    expect(expiredResponse.status()).toBe(200);

    await expect(
      prisma.purchase.findUniqueOrThrow({ where: { id: expiredPurchase.id } })
    ).resolves.toMatchObject({ status: PurchaseStatus.FAILED });
  });

  test("stale failure does not downgrade paid active access, while refund revokes it", async ({
    request,
  }) => {
    const userId = await createWebhookUser({ withProfile: true });
    const recoveryProfile = await prisma.recoveryProfile.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    const paymentIntentId = uniqueId("pi_paid_not_downgraded");
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        stripeCheckoutSessionId: uniqueId("cs_paid_not_downgraded"),
        stripePaymentIntentId: paymentIntentId,
        amount: 1499,
        currency: "usd",
        status: PurchaseStatus.PAID,
        paidAt: new Date(),
      },
    });
    const program = await prisma.program.create({
      data: {
        userId,
        recoveryProfileId: recoveryProfile.id,
        purchaseId: purchase.id,
        templateVersion: "finger-v1",
        startDate: new Date(),
        endDate: new Date(),
        currentDay: 1,
        status: ProgramStatus.ACTIVE,
      },
    });

    const failedEventId = uniqueId("evt_stale_payment_failed");
    createdEventIds.add(failedEventId);
    const failedResponse = await postSignedWebhook(request, {
      id: failedEventId,
      object: "event",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: paymentIntentId,
          object: "payment_intent",
        },
      },
    });
    expect(failedResponse.status()).toBe(200);

    await expect(
      prisma.purchase.findUniqueOrThrow({ where: { id: purchase.id } })
    ).resolves.toMatchObject({ status: PurchaseStatus.PAID });

    const refundedEventId = uniqueId("evt_charge_refunded");
    createdEventIds.add(refundedEventId);
    const refundedResponse = await postSignedWebhook(request, {
      id: refundedEventId,
      object: "event",
      type: "charge.refunded",
      data: {
        object: {
          id: uniqueId("ch_refunded"),
          object: "charge",
          payment_intent: paymentIntentId,
        },
      },
    });
    expect(refundedResponse.status()).toBe(200);

    await expect(
      prisma.purchase.findUniqueOrThrow({ where: { id: purchase.id } })
    ).resolves.toMatchObject({ status: PurchaseStatus.REFUNDED });
    await expect(
      prisma.program.findUniqueOrThrow({ where: { id: program.id } })
    ).resolves.toMatchObject({ status: ProgramStatus.EXPIRED });
    await expect(
      prisma.program.count({ where: { purchaseId: purchase.id } })
    ).resolves.toBe(1);

    const lateCompletedEvent = checkoutCompletedEvent({
      eventId: uniqueId("evt_late_completed_after_refund"),
      checkoutSessionId: purchase.stripeCheckoutSessionId,
      userId,
      paymentIntentId,
    });
    const lateCompletedResponse = await postSignedWebhook(
      request,
      lateCompletedEvent
    );
    expect(lateCompletedResponse.status()).toBe(200);

    await expect(
      prisma.purchase.findUniqueOrThrow({ where: { id: purchase.id } })
    ).resolves.toMatchObject({ status: PurchaseStatus.REFUNDED });
    await expect(
      prisma.program.findUniqueOrThrow({ where: { id: program.id } })
    ).resolves.toMatchObject({ status: ProgramStatus.EXPIRED });
  });
});
