import Stripe from "stripe";
import { Prisma, ProgramStatus, PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { captureError, captureMessage } from "@/lib/observability/server";
import {
  prepareTemplateFirstProgramForUser,
  provisionProgramForPaidPurchase,
} from "@/lib/program/provisioning-service";

interface WebhookHandlingResult {
  status: "processed" | "duplicate" | "ignored";
  purchaseId?: string;
  programId?: string | null;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeStripeId(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id.trim() || null;
  }

  return null;
}

function getCheckoutAmount(session: Stripe.Checkout.Session) {
  return session.amount_total ?? 1499;
}

function getCheckoutCurrency(session: Stripe.Checkout.Session) {
  return session.currency?.toLowerCase() || "usd";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<WebhookHandlingResult> {
  const userId = session.client_reference_id?.trim();

  if (!userId) {
    captureMessage("stripe_checkout_missing_client_reference", {
      flow: "billing_webhook",
      operation: "checkout_completed_missing_user_reference",
      status: "ignored",
      severity: "info",
    });
    console.warn("Stripe checkout completed without client_reference_id", {
      checkoutSessionId: session.id,
    });
    return { status: "ignored" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    captureMessage("stripe_checkout_missing_user", {
      flow: "billing_webhook",
      operation: "checkout_completed_missing_user",
      status: "ignored",
      severity: "info",
    });
    console.warn("Stripe checkout completed for missing user", {
      checkoutSessionId: session.id,
      userId,
    });
    return { status: "ignored" };
  }

  const preparedProgram = await prepareTemplateFirstProgramForUser(userId);

  return prisma.$transaction(
    async (tx) => {
      const existingPurchase = await tx.purchase.findUnique({
        where: {
          stripeCheckoutSessionId: session.id,
        },
        select: {
          id: true,
          status: true,
          program: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (existingPurchase?.status === PurchaseStatus.REFUNDED) {
        if (
          existingPurchase.program &&
          existingPurchase.program.status !== ProgramStatus.EXPIRED
        ) {
          await tx.program.update({
            where: {
              id: existingPurchase.program.id,
            },
            data: {
              status: ProgramStatus.EXPIRED,
            },
          });
        }

        return {
          status: "ignored",
          purchaseId: existingPurchase.id,
          programId: existingPurchase.program?.id ?? null,
        };
      }

      const purchase = await tx.purchase.upsert({
        where: {
          stripeCheckoutSessionId: session.id,
        },
        create: {
          userId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: normalizeStripeId(session.payment_intent),
          stripeCustomerId: normalizeStripeId(session.customer),
          amount: getCheckoutAmount(session),
          currency: getCheckoutCurrency(session),
          status: PurchaseStatus.PAID,
          paidAt: new Date(),
        },
        update: {
          stripePaymentIntentId: normalizeStripeId(session.payment_intent),
          stripeCustomerId: normalizeStripeId(session.customer),
          amount: getCheckoutAmount(session),
          currency: getCheckoutCurrency(session),
          status: PurchaseStatus.PAID,
          paidAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      const program = await provisionProgramForPaidPurchase(tx, {
        userId,
        purchaseId: purchase.id,
        preparedProgram,
      });

      return {
        status: "processed",
        purchaseId: purchase.id,
        programId: program?.id ?? null,
      };
    },
    { timeout: 30000 }
  );
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookHandlingResult> {
  const updated = await prisma.purchase.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
      status: { in: [PurchaseStatus.PENDING, PurchaseStatus.FAILED] },
    },
    data: {
      status: PurchaseStatus.FAILED,
    },
  });

  if (updated.count === 0) {
    captureMessage("stripe_payment_failure_unmatched_or_unlocked", {
      flow: "billing_webhook",
      operation: "payment_intent_failed_no_pending_purchase",
      status: "ignored",
      severity: "info",
    });
  }

  return { status: updated.count > 0 ? "processed" : "ignored" };
}

async function handleCheckoutFailedOrExpired(
  session: Stripe.Checkout.Session
): Promise<WebhookHandlingResult> {
  const updated = await prisma.purchase.updateMany({
    where: {
      stripeCheckoutSessionId: session.id,
      status: { in: [PurchaseStatus.PENDING, PurchaseStatus.FAILED] },
    },
    data: {
      status: PurchaseStatus.FAILED,
    },
  });

  if (updated.count === 0) {
    captureMessage("stripe_checkout_failure_unmatched_or_unlocked", {
      flow: "billing_webhook",
      operation: "checkout_failed_no_pending_purchase",
      status: "ignored",
      stripe_event_type: "checkout.session.failed_or_expired",
      severity: "info",
    });
  }

  return { status: updated.count > 0 ? "processed" : "ignored" };
}

async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<WebhookHandlingResult> {
  const paymentIntentId = normalizeStripeId(charge.payment_intent);

  if (!paymentIntentId) {
    return { status: "ignored" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      select: {
        id: true,
        status: true,
        program: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!purchase) {
      return { purchaseUpdated: false, programId: null as string | null };
    }

    await tx.purchase.update({
      where: {
        id: purchase.id,
      },
      data: {
        status: PurchaseStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    if (purchase.program) {
      await tx.program.update({
        where: {
          id: purchase.program.id,
        },
        data: {
          status: ProgramStatus.EXPIRED,
        },
      });
    }

    return {
      purchaseUpdated: true,
      programId: purchase.program?.id ?? null,
    };
  });

  if (!result.purchaseUpdated) {
    captureMessage("stripe_refund_unmatched_purchase", {
      flow: "billing_webhook",
      operation: "charge_refunded_no_purchase",
      status: "ignored",
      severity: "info",
    });
  }

  return {
    status: result.purchaseUpdated ? "processed" : "ignored",
    programId: result.programId,
  };
}

async function processVerifiedStripeEvent(
  event: Stripe.Event
): Promise<WebhookHandlingResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    case "payment_intent.payment_failed":
      return handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      return handleCheckoutFailedOrExpired(
        event.data.object as Stripe.Checkout.Session
      );
    case "charge.refunded":
      return handleChargeRefunded(event.data.object as Stripe.Charge);
    default:
      captureMessage("stripe_webhook_ignored_event", {
        flow: "billing_webhook",
        operation: "ignore_unsupported_event",
        status: "ignored",
        stripe_event_type: event.type,
        severity: "info",
      });
      console.info("Unhandled Stripe webhook event", { type: event.type });
      return { status: "ignored" };
  }
}

export async function handleVerifiedStripeEvent(
  event: Stripe.Event
): Promise<WebhookHandlingResult> {
  const payloadJson = toJsonValue(event);
  let ownsEventRecord = true;

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payloadJson,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const existingEvent = await prisma.stripeWebhookEvent.findUnique({
      where: {
        stripeEventId: event.id,
      },
      select: {
        processedAt: true,
      },
    });

    if (existingEvent?.processedAt) {
      return { status: "duplicate" };
    }

    ownsEventRecord = false;
  }

  try {
    const result = await processVerifiedStripeEvent(event);

    await prisma.stripeWebhookEvent.update({
      where: {
        stripeEventId: event.id,
      },
      data: {
        type: event.type,
        processedAt: new Date(),
        payloadJson,
      },
    });

    return result;
  } catch (error) {
    if (ownsEventRecord) {
      await prisma.stripeWebhookEvent
        .deleteMany({
          where: {
            stripeEventId: event.id,
            processedAt: null,
          },
        })
        .catch((cleanupError) => {
          captureError(cleanupError, {
            flow: "billing_webhook",
            operation: "cleanup_unprocessed_event_lock",
            status: "cleanup_failed",
            stripe_event_id: event.id,
            stripe_event_type: event.type,
            severity: "warning",
          });
          console.error("Failed to clean up unprocessed Stripe event lock", {
            eventId: event.id,
            cleanupError,
          });
        });
    }

    throw error;
  }
}
