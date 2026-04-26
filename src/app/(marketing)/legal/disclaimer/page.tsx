import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Disclaimer",
  description:
    "Fracture Recovery Companion is informational and does not replace medical care.",
};

export default function DisclaimerPage() {
  return (
    <article
      data-testid="legal-disclaimer"
      className="container max-w-3xl py-12 sm:py-16 prose prose-neutral dark:prose-invert"
    >
      <h1 className="text-3xl font-semibold tracking-tight">
        Medical Disclaimer
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Baseline copy - refined alongside AI safety work in Story 4.x.
      </p>

      <p className="mt-6">
        <strong>Fracture Recovery Companion is not a medical device and is
        not a substitute for professional medical advice, diagnosis, or
        treatment.</strong>{" "}
        The content, programs, and AI responses you see here are
        educational and supportive in nature.
      </p>

      <p className="mt-4">
        Always consult your doctor, orthopedic specialist, or physical
        therapist before starting, changing, or stopping any part of your
        recovery plan. Never delay seeking medical care because of anything
        you read or are told inside this product.
      </p>

      <p className="mt-4">
        Seek urgent care immediately if you experience severe pain,
        significant swelling, numbness, a change in skin color, fever, or
        any symptom that feels like an emergency.
      </p>
    </article>
  );
}
