import { NextResponse } from "next/server";

import { createCheckoutSession } from "@/lib/billing/purchase-service";
import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
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

    return NextResponse.json(checkoutSession);
  } catch (error) {
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
