import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";

export default async function CheckoutCancelledPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fonboarding%2Fcheckout%2Fcancelled");
  }

  return (
    <main className="container py-10 sm:py-14">
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Checkout cancelled
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          No payment was completed
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          You can return to onboarding when you are ready to retry. No program,
          purchase, or recovery plan has been created from this cancelled
          checkout attempt.
        </p>

        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          If a bank statement ever shows a charge after a cancelled or failed
          checkout, do not share payment IDs in chat or screenshots. Use the
          refund policy for the safe support path and include only the checkout
          receipt reference if Stripe sent one.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/onboarding">Back to onboarding</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to landing page</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/legal/refund">Read the refund policy</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
