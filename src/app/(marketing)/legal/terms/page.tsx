import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Fracture Recovery Companion.",
};

export default function TermsPage() {
  return (
    <article
      data-testid="legal-terms"
      className="container max-w-3xl py-12 sm:py-16 prose prose-neutral dark:prose-invert"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder - finalized in Story 7.x (Compliance &amp; Launch Prep).
      </p>
      <p className="mt-6">
        By using Fracture Recovery Companion you agree to terms that will be
        published here before launch. The product is informational only and
        does not replace medical care; the Terms will make that explicit.
      </p>
    </article>
  );
}
