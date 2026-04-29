import Stripe from "stripe";

interface CreateCheckoutSessionInput {
  userId: string;
  userEmail?: string | null;
}

interface CheckoutSessionResult {
  url: string;
  isDevMock: boolean;
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
  };
}
