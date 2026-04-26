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
        Placeholder - finalized in Story 5.x (Stripe payment &amp; refunds).
      </p>
      <p className="mt-6">
        Because we charge once for each recovery program, this page will
        describe the refund window, how to request a refund, and the cases in
        which refunds are not possible (for example, after substantial
        program usage).
      </p>
    </article>
  );
}
