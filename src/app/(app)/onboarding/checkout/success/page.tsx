import Link from "next/link";
import { redirect } from "next/navigation";

import { AnalyticsPageView } from "@/components/analytics/analytics-page-view";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import {
  getCheckoutUnlockState,
  provisionDevMockPurchaseAndProgram,
  type UnlockState,
} from "@/lib/program/provisioning-service";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

function getPendingRefreshHref(checkoutSessionId: string | undefined) {
  return checkoutSessionId
    ? `/onboarding/checkout/success?session_id=${encodeURIComponent(
        checkoutSessionId
      )}`
    : "/onboarding/checkout/success";
}

function getCheckoutStateContent({
  state,
  checkoutSessionId,
}: {
  state: UnlockState;
  checkoutSessionId?: string;
}) {
  switch (state.status) {
    case "ready":
      return {
        eyebrow: "Checkout success",
        title: "Your 14-day plan is ready",
        description:
          "Your payment is confirmed and your first recovery day is ready to open. Continue when you are ready.",
        note:
          "This product is educational support only. Keep following your clinician's instructions and use the plan as daily structure.",
        primaryHref: `/day/${state.program?.currentDay ?? 1}`,
        primaryLabel: `Open Day ${state.program?.currentDay ?? 1}`,
        secondaryHref: "/progress",
        secondaryLabel: "Progress overview",
      };
    case "missing_program_recovered":
      return {
        eyebrow: "Checkout recovered",
        title: "Your 14-day plan is ready",
        description:
          "Your payment was already confirmed, and we restored the missing program setup for this account.",
        note:
          "If anything still looks out of place, use Progress first so we can avoid showing partial recovery guidance.",
        primaryHref: `/day/${state.program?.currentDay ?? 1}`,
        primaryLabel: `Open Day ${state.program?.currentDay ?? 1}`,
        secondaryHref: "/progress",
        secondaryLabel: "Progress overview",
      };
    case "payment_pending":
      return {
        eyebrow: "Checkout confirming",
        title: "Your payment is still confirming",
        description:
          "Stripe has not confirmed the payment yet. We will not open Day 1 until the paid program is active.",
        note:
          "Wait a moment and refresh this page. If the checkout remains pending, return to onboarding and retry when you are ready.",
        primaryHref: getPendingRefreshHref(checkoutSessionId),
        primaryLabel: "Refresh payment status",
        secondaryHref: "/onboarding",
        secondaryLabel: "Back to onboarding",
      };
    case "payment_failed":
      return {
        eyebrow: "Checkout not completed",
        title: "Your payment did not complete",
        description:
          "This checkout attempt failed or expired, so no 14-day plan has been unlocked from it.",
        note:
          "You can retry checkout from onboarding. If you believe you were charged, review the refund policy before contacting support.",
        primaryHref: "/onboarding",
        primaryLabel: "Retry checkout",
        secondaryHref: "/legal/refund",
        secondaryLabel: "Payment help",
      };
    case "purchase_refunded":
      return {
        eyebrow: "Access revoked",
        title: "This purchase was refunded",
        description:
          "The matched purchase has been refunded, so paid recovery access is no longer active for this checkout.",
        note:
          "You can read the refund policy or return to onboarding if you want to start a new checkout.",
        primaryHref: "/legal/refund",
        primaryLabel: "Read refund policy",
        secondaryHref: "/onboarding",
        secondaryLabel: "Back to onboarding",
      };
    case "missing_profile":
      return {
        eyebrow: "Checkout needs profile",
        title: "Finish your recovery profile",
        description:
          "Your payment is on file, but the recovery profile needed to generate the plan is missing.",
        note:
          "Return to onboarding and save the profile again. We will not show partial recovery guidance without it.",
        primaryHref: "/onboarding",
        primaryLabel: "Finish profile",
        secondaryHref: "/legal/refund",
        secondaryLabel: "Payment help",
      };
    case "missing_program":
      return {
        eyebrow: "Checkout needs support",
        title: "Your plan needs support before opening",
        description:
          "Your payment is on file, but we could not safely create the 14-day plan yet.",
        note:
          "Use Progress to retry the recovery path. If it stays blocked, review the support instructions in the refund policy.",
        primaryHref: "/progress",
        primaryLabel: "Retry progress",
        secondaryHref: "/legal/refund",
        secondaryLabel: "Support options",
      };
    case "unknown_session":
    default:
      return {
        eyebrow: "Checkout status unavailable",
        title: "We could not match this checkout",
        description:
          "This checkout reference is missing or does not belong to the signed-in account.",
        note:
          "For privacy, we do not expose payment identifiers here. Return to onboarding or check the refund policy if you need help.",
        primaryHref: "/onboarding",
        primaryLabel: "Back to onboarding",
        secondaryHref: "/legal/refund",
        secondaryLabel: "Payment help",
      };
  }
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
        : ({ status: "unknown_session", program: null } satisfies UnlockState);
  const isPlanReady = Boolean(unlockState.program);
  const content = getCheckoutStateContent({ state: unlockState, checkoutSessionId });

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
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {content.description}
        </p>

        {unlockState.supportReference ? (
          <p className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Support reference:{" "}
            <span className="font-medium">{unlockState.supportReference}</span>
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          {content.note}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={content.primaryHref}>{content.primaryLabel}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={content.secondaryHref}>{content.secondaryLabel}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
