import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Fracture Recovery Companion collects and uses your data.",
};

export default function PrivacyPage() {
  return (
    <article
      data-testid="legal-privacy"
      className="container max-w-3xl py-12 sm:py-16 prose prose-neutral dark:prose-invert"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder - finalized in Story 7.x (Compliance &amp; Launch Prep).
      </p>
      <p className="mt-6">
        We respect your privacy. This page will describe what data we collect,
        how we store it, and the choices you have about its use. The full
        policy is being drafted with legal review and will be published before
        the first public release.
      </p>
    </article>
  );
}
