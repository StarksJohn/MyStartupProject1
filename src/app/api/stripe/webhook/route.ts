import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { handleVerifiedStripeEvent } from "@/lib/billing/webhook-service";
import { captureError, captureMessage } from "@/lib/observability/server";

let stripeClient: Stripe | null = null;

function getStripeClient() {
  stripeClient ??= new Stripe(
    process.env.STRIPE_SECRET_KEY || "sk_test_webhook_signature_only"
  );

  return stripeClient;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: "stripe_webhook_signature_missing" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    captureMessage("stripe_webhook_signature_invalid", {
      flow: "billing_webhook",
      operation: "verify_signature",
      route: "/api/stripe/webhook",
      status: "stripe_webhook_signature_invalid",
      severity: "warning",
    });
    console.warn("Stripe webhook signature verification failed", { error });

    return NextResponse.json(
      { error: "stripe_webhook_signature_invalid" },
      { status: 400 }
    );
  }

  try {
    const result = await handleVerifiedStripeEvent(event);
    return NextResponse.json({ received: true, status: result.status });
  } catch (error) {
    captureError(error, {
      flow: "billing_webhook",
      operation: "process_event",
      route: "/api/stripe/webhook",
      status: "stripe_webhook_processing_failed",
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    });
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      type: event.type,
      error,
    });

    return NextResponse.json(
      { error: "stripe_webhook_processing_failed" },
      { status: 500 }
    );
  }
}
