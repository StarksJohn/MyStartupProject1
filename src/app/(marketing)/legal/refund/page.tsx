import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "How refunds work for Fracture Recovery Companion purchases.",
};

export default function RefundPage() {
  return (
    <article
      data-testid="legal-refund"
      className="container max-w-3xl py-12 sm:py-16 prose prose-neutral dark:prose-invert"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Plain-language billing support for the one-time 14-day plan.
      </p>
      <p className="mt-6">
        Fracture Recovery Companion is sold as a one-time purchase for one
        educational 14-day recovery companion. It is not a subscription, not a
        medical device, and not a promise of a medical outcome.
      </p>
      <h2>When to ask for help</h2>
      <p>
        Use the billing support path if payment is pending for more than a few
        minutes, checkout failed but your card appears charged, access was
        revoked after a refund, or your paid plan cannot be opened safely.
      </p>
      <h2>Refund expectations</h2>
      <p>
        For the MVP, refund requests should be made within 7 days of purchase.
        Include the email used at checkout and the short checkout reference
        shown in the product or receipt if available. Do not send medical
        notes, pain details, chat transcripts, or screenshots containing
        private recovery information.
      </p>
      <h2>What happens after a refund</h2>
      <p>
        A matched Stripe refund revokes paid product access. Existing progress
        records may remain for account consistency, but the app will not show
        paid Day or Chat experiences after access is refunded.
      </p>
      <h2>Support path</h2>
      <p>
        Start by replying to the checkout or sign-in email associated with your
        purchase. If you do not have that message, keep the request generic:
        share the account email and the short checkout reference only. Never
        send Stripe secrets, full payment intent IDs, medical records, recovery
        notes, or chat content.
      </p>
    </article>
  );
}
