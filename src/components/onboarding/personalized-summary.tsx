"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/client";
import type { RecoveryProfileInput } from "@/lib/onboarding/recovery-profile";
import {
  formatDominantHandImpact,
  getBodyPartLabel,
  getJobTypeLabel,
  getRecoveryWindowSummary,
} from "@/lib/onboarding/summary";

interface PersonalizedSummaryProps {
  userEmail: string;
  profile: RecoveryProfileInput;
  onBackToProfile: () => void;
}

interface CheckoutResponse {
  url?: string;
  error?: string;
  redirectTo?: string;
}

const includedItems = [
  "14 daily exercise guides tuned for your body part and recovery window",
  "AI recovery Q&A with safety guardrails and clinician-escalation for red flags",
  "A completion report at the end of Day 14",
];

export function PersonalizedSummary({
  userEmail,
  profile,
  onBackToProfile,
}: PersonalizedSummaryProps) {
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorRedirectTo, setErrorRedirectTo] = useState<string | null>(null);

  async function startCheckout() {
    if (status === "redirecting") {
      return;
    }

    setStatus("redirecting");
    setErrorMessage(null);
    setErrorRedirectTo(null);
    trackEvent("checkout_start", { surface: "personalized_summary" });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !data.url) {
        setStatus("error");
        setErrorMessage(
          data.error === "recovery_profile_missing"
            ? "We could not find your recovery profile. Go back to onboarding and save it again."
            : "We could not start checkout. Please try again."
        );
        setErrorRedirectTo(data.redirectTo ?? null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setStatus("error");
      setErrorMessage("We could not start checkout. Check your connection and try again.");
      setErrorRedirectTo(null);
    }
  }

  return (
    <main className="container py-10 sm:py-14">
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step 3 of 3
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Personalized Summary
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Review the context your 14-day educational plan will use before
              checkout. This is not diagnosis or treatment.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Signed in as <span className="font-medium">{userEmail}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recovery window
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {getRecoveryWindowSummary(profile.castRemovedAt)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Profile" value={`${getBodyPartLabel(profile.bodyPart)} - ${profile.subType}`} />
          <SummaryItem
            label="Pain level"
            value={`${profile.painLevel} / 10`}
          />
          <SummaryItem
            label="Dominant hand affected"
            value={formatDominantHandImpact(profile.dominantHandAffected)}
          />
          <SummaryItem label="Daily-use category" value={getJobTypeLabel(profile.jobType)} />
        </div>

        <div className="mt-6 rounded-2xl border p-5">
          <h2 className="text-xl font-semibold tracking-tight">
            What your 14-day plan includes
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {includedItems.map((item) => (
              <li key={item} className="rounded-xl border bg-muted/30 p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            One-time unlock
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            $14.99 one-time
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            No subscription. Refund requests follow the plain-language terms on
            our{" "}
            <Link href="/legal/refund" className="font-medium underline">
              refund policy
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Fracture Recovery Companion is educational support, not diagnosis or
            treatment.
          </p>
        </div>

        {status === "error" && errorMessage ? (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{errorMessage}</p>
            {errorRedirectTo ? (
              <Link
                href={errorRedirectTo}
                className="mt-3 inline-flex font-medium underline"
              >
                Return to onboarding
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBackToProfile}>
            Previous
          </Button>
          <Button
            type="button"
            onClick={startCheckout}
            disabled={status === "redirecting"}
          >
            {status === "redirecting"
              ? "Starting checkout..."
              : "Unlock my 14-day plan"}
          </Button>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
