import Link from "next/link";
import { redirect } from "next/navigation";

import { AnalyticsPageView } from "@/components/analytics/analytics-page-view";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import {
  getCheckoutUnlockState,
  provisionDevMockPurchaseAndProgram,
} from "@/lib/program/provisioning-service";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fonboarding%2Fcheckout%2Fsuccess");
  }

  const { session_id: checkoutSessionId } = await searchParams;
  const unlockState =
    checkoutSessionId === "dev_mock"
      ? await provisionDevMockPurchaseAndProgram(session.user.id)
      : checkoutSessionId
        ? await getCheckoutUnlockState({
            userId: session.user.id,
            checkoutSessionId,
          })
        : { purchaseId: null, program: null };
  const isPlanReady = Boolean(unlockState.program);
  const currentDay = unlockState.program?.currentDay ?? 1;

  return (
    <main className="container py-10 sm:py-14">
      {isPlanReady ? (
        <AnalyticsPageView
          eventName="paid"
          properties={{
            surface: "checkout_success",
            source: "checkout_success",
            plan_ready: true,
          }}
        />
      ) : null}
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Checkout success
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isPlanReady
            ? "Your 14-day plan is ready"
            : "We are confirming your payment"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {isPlanReady
            ? "Your payment is confirmed and your first recovery day is ready to open. Continue to Day 1 when you are ready."
            : "Your personalized plan will be unlocked shortly after the payment is confirmed. If this page stays pending, wait a moment and refresh after Stripe finishes processing."}
        </p>

        {checkoutSessionId ? (
          <p className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Checkout reference:{" "}
            <span className="font-medium">{checkoutSessionId}</span>
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          {isPlanReady
            ? "This page only confirms unlock. The full Day experience lands in the next stories."
            : "Do not reload to retry payment from this page. If you need help, return to onboarding or contact support when the support flow is available."}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {isPlanReady ? (
            <Button asChild>
              <Link href={`/day/${currentDay}`}>Open Day {currentDay}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/onboarding">Back to onboarding</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">Back to landing page</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
