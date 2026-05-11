import { NextResponse } from "next/server";

import {
  createCheckoutSession,
  recordPendingPurchaseForCheckoutSession,
} from "@/lib/billing/purchase-service";
import { getAuthSession } from "@/lib/auth/session";
import { captureError } from "@/lib/observability/server";
import { prisma } from "@/lib/prisma";
import { getActiveProgramForUser } from "@/lib/program/provisioning-service";

export async function POST() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const activeProgram = await getActiveProgramForUser(session.user.id);

  if (activeProgram) {
    return NextResponse.json({
      url: "/progress",
      isDevMock: false,
      alreadyUnlocked: true,
    });
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!recoveryProfile) {
    return NextResponse.json(
      { error: "recovery_profile_missing", redirectTo: "/onboarding" },
      { status: 409 }
    );
  }

  try {
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
    });

    if (!checkoutSession.isDevMock && checkoutSession.checkoutSessionId) {
      await recordPendingPurchaseForCheckoutSession({
        userId: session.user.id,
        checkoutSessionId: checkoutSession.checkoutSessionId,
        stripePaymentIntentId: checkoutSession.stripePaymentIntentId,
        stripeCustomerId: checkoutSession.stripeCustomerId,
        amount: checkoutSession.amount ?? 1499,
        currency: checkoutSession.currency ?? "usd",
      });
    }

    return NextResponse.json({
      url: checkoutSession.url,
      isDevMock: checkoutSession.isDevMock,
    });
  } catch (error) {
    captureError(error, {
      flow: "checkout",
      operation: "create_checkout_session",
      route: "/api/checkout",
      status: "stripe_checkout_unavailable",
    });
    console.error("Failed to create Stripe Checkout session", {
      userId: session.user.id,
      error,
    });

    return NextResponse.json(
      { error: "stripe_checkout_unavailable" },
      { status: 502 }
    );
  }
}
