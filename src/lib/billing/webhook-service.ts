import Stripe from "stripe";
import { Prisma, PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
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
    console.warn("Stripe checkout completed for missing user", {
      checkoutSessionId: session.id,
      userId,
    });
    return { status: "ignored" };
  }

  const preparedProgram = await prepareTemplateFirstProgramForUser(userId);

  return prisma.$transaction(
    async (tx) => {
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
    },
    data: {
      status: PurchaseStatus.FAILED,
    },
  });

  return { status: updated.count > 0 ? "processed" : "ignored" };
}

async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<WebhookHandlingResult> {
  const paymentIntentId = normalizeStripeId(charge.payment_intent);

  if (!paymentIntentId) {
    return { status: "ignored" };
  }

  const updated = await prisma.purchase.updateMany({
    where: {
      stripePaymentIntentId: paymentIntentId,
    },
    data: {
      status: PurchaseStatus.REFUNDED,
      refundedAt: new Date(),
    },
  });

  return { status: updated.count > 0 ? "processed" : "ignored" };
}

async function processVerifiedStripeEvent(
  event: Stripe.Event
): Promise<WebhookHandlingResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    case "payment_intent.payment_failed":
      return handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
    case "charge.refunded":
      return handleChargeRefunded(event.data.object as Stripe.Charge);
    default:
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
          console.error("Failed to clean up unprocessed Stripe event lock", {
            eventId: event.id,
            cleanupError,
          });
        });
    }

    throw error;
  }
}
