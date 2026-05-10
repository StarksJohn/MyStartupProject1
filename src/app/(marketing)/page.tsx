import Link from "next/link";

import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { AnalyticsPageView } from "@/components/analytics/analytics-page-view";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { Button } from "@/components/ui/button";

/**
 * Story 1.3 landing page.
 * Scope: hero value narrative plus Safety / FAQ / Footer CTA trust close.
 * Analytics, onboarding, checkout, and SEO content land in later stories.
 */
export default function LandingPage() {
  const painPoints = [
    {
      title: "The follow-up visit was too short",
      body: "You heard \"start moving it,\" but left without a simple day-by-day plan.",
    },
    {
      title: "Search results are fragmented",
      body: "Google, forums, and generic health sites rarely match your exact cast-removal timing.",
    },
    {
      title: "You are afraid of doing it wrong",
      body: "You want to move enough to make progress without pushing through warning signs.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Take a 2-minute quiz",
      body: "Share your injury type, cast-removal timing, hardware status, pain level, and daily constraints.",
    },
    {
      step: "2",
      title: "Pay once, then unlock your plan",
      body: "A one-time $14.99 purchase unlocks your 14-day recovery companion. No subscription.",
    },
    {
      step: "3",
      title: "Follow daily actions + ask AI",
      body: "Each day gives you focused exercises, progress cues, and safety-aware answers to common concerns.",
    },
  ];

  const whatYouGet = [
    "Daily exercise cards with clear reps, timing, and caution notes",
    "Timer and progress cues so you know what is done today",
    "AI answers for common recovery worries, with safety boundaries",
    "A completion summary you can review or share when the 14 days are done",
  ];

  return (
    <>
      <AnalyticsPageView
        eventName="landing_view"
        properties={{ surface: "landing" }}
      />
      <section
        data-testid="landing-hero"
        className="container flex flex-col items-center justify-center gap-6 py-16 text-center sm:py-24 lg:py-28"
      >
        <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          Informational companion - not a medical device
        </span>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Your day-by-day recovery companion for the critical 2 weeks after cast removal.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Get a structured 14-day plan with daily exercises, safety-aware AI
          answers, and calm guidance for the moments when your doctor visit was
          too short and search results feel too generic.
        </p>
        <div
          id="get-started"
          className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4"
        >
          <Button size="lg" asChild>
            <AnalyticsLink
              href="/onboarding"
              eventProperties={{ surface: "landing", cta_id: "hero_primary" }}
            >
              Start my 2-minute quiz
            </AnalyticsLink>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <AnalyticsLink
              href="#how-it-works"
              eventProperties={{ surface: "landing", cta_id: "hero_secondary" }}
            >
              See how the 14-day plan works
            </AnalyticsLink>
          </Button>
        </div>
        <p className="max-w-xl text-xs text-muted-foreground">
          Built for adults recovering from finger or metacarpal fractures around
          cast removal. Not for emergencies, diagnosis, or replacing your
          clinician.
        </p>
      </section>

      <section
        data-testid="landing-pain-points"
        className="container py-10 sm:py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Why this moment feels confusing
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Cast removal should feel like progress, not guesswork.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {painPoints.map((item) => (
            <article key={item.title} className="rounded-xl border bg-card p-5">
              <h3 className="text-base font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        data-testid="landing-how-it-works"
        className="container scroll-mt-20 py-10 sm:py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            A simple path from anxiety search to daily action.
          </h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {howItWorks.map((item) => (
            <article
              key={item.step}
              className="rounded-xl border bg-card p-5 shadow-xs"
            >
              <div className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {item.step}
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        data-testid="landing-what-you-get"
        className="container py-10 sm:py-16"
      >
        <div className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What you get
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to know what to do today.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              The goal is not to overwhelm you with medical content. It is to
              give you a clear, finishable plan and help you recognize when to
              contact a clinician.
            </p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {whatYouGet.map((item) => (
              <li
                key={item}
                className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        data-testid="landing-safety"
        className="container py-10 sm:py-16"
      >
        <div className="rounded-2xl border bg-muted/40 p-6 shadow-xs sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Safety first
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Clear guidance, with medical boundaries always visible.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              Fracture Recovery Companion is informational and educational. It
              is not a medical device, not for diagnosis, and does not replace
              your doctor or physical therapist.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-5">
              <h3 className="text-base font-semibold tracking-tight">
                When to contact a clinician
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Seek medical help for severe pain, numbness, discoloration,
                fever, rapidly worsening swelling, or symptoms that feel urgent.
              </p>
            </div>
            <div className="rounded-xl border bg-background p-5">
              <h3 className="text-base font-semibold tracking-tight">
                Read the full disclaimer
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The product supports education and daily structure. Your
                clinician remains the source for diagnosis and treatment
                decisions.
              </p>
              <Link
                href="/legal/disclaimer"
                className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Medical Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section data-testid="landing-faq" className="container py-10 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions cautious users ask before starting.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Short answers for fit, safety, price, and refund expectations before
            you start the quiz.
          </p>
        </div>
        <LandingFaq />
      </section>

      <section
        data-testid="landing-footer-cta"
        className="container py-10 sm:py-16"
      >
        <div className="rounded-2xl border bg-card p-6 text-center shadow-xs sm:p-10">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-4xl">
            Build your 14-day companion before the recovery window gets away.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Start with a 2-minute quiz, unlock a one-time $14.99 plan, and keep
            the medical boundary clear: this is not a medical device or a
            replacement for clinician care.
          </p>
          <div className="mt-6">
            <Button size="lg" asChild>
              <AnalyticsLink
                href="/onboarding"
                eventProperties={{ surface: "landing", cta_id: "footer_primary" }}
              >
                Start my 2-minute quiz
              </AnalyticsLink>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
