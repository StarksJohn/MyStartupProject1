import Stripe from "stripe";
import { PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface CreateCheckoutSessionInput {
  userId: string;
  userEmail?: string | null;
}

interface CheckoutSessionResult {
  url: string;
  isDevMock: boolean;
  checkoutSessionId?: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  amount?: number;
  currency?: string;
}

const checkoutPriceCents = 1499;
let stripeClient: Stripe | null = null;

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
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

export async function createCheckoutSession({
  userId,
  userEmail,
}: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient();

  if (!stripe) {
    return {
      url: "/onboarding/checkout/success?session_id=dev_mock",
      isDevMock: true,
    };
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_email: userEmail ?? undefined,
    success_url: `${appUrl}/onboarding/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/onboarding/checkout/cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: checkoutPriceCents,
          product_data: {
            name: "Fracture Recovery Companion - 14-day plan",
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session did not include a redirect URL.");
  }

  return {
    url: session.url,
    isDevMock: false,
    checkoutSessionId: session.id,
    stripePaymentIntentId: normalizeStripeId(session.payment_intent),
    stripeCustomerId: normalizeStripeId(session.customer),
    amount: session.amount_total ?? checkoutPriceCents,
    currency: session.currency?.toLowerCase() || "usd",
  };
}

export async function recordPendingPurchaseForCheckoutSession({
  userId,
  checkoutSessionId,
  stripePaymentIntentId,
  stripeCustomerId,
  amount,
  currency,
}: {
  userId: string;
  checkoutSessionId: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  amount: number;
  currency: string;
}) {
  await prisma.purchase.upsert({
    where: {
      stripeCheckoutSessionId: checkoutSessionId,
    },
    create: {
      userId,
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      stripeCustomerId: stripeCustomerId ?? undefined,
      amount,
      currency: currency.toLowerCase(),
      status: PurchaseStatus.PENDING,
    },
    update: {
      stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      stripeCustomerId: stripeCustomerId ?? undefined,
      amount,
      currency: currency.toLowerCase(),
    },
  });
}
