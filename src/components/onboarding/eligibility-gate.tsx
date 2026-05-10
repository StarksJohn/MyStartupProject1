"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics/client";
import { PersonalizedSummary } from "@/components/onboarding/personalized-summary";
import { RecoveryProfileForm } from "@/components/onboarding/recovery-profile-form";
import { Button } from "@/components/ui/button";
import {
  classifyEligibility,
  type EligibilityGateAnswers,
  type EligibilityResult,
} from "@/lib/onboarding/eligibility";
import type { RecoveryProfileInput } from "@/lib/onboarding/recovery-profile";

interface EligibilityGateProps {
  userEmail: string;
}

const eligibilityGateSchema = z.object({
  clinicianEvaluated: z.enum(["yes", "no"], {
    error: "Choose whether a clinician has evaluated this injury.",
  }),
  immobilizationStatus: z.enum(
    ["removed_or_near_removal", "still_immobilized", "not_sure"],
    {
      error: "Choose your current cast or immobilization status.",
    }
  ),
  injuryArea: z.enum(["finger_or_metacarpal", "other_body_part", "not_sure"], {
    error: "Choose whether your injury is within the first version's scope.",
  }),
  hasRedFlags: z.enum(["yes", "no"], {
    error: "Choose whether urgent warning signs are present.",
  }),
});

const questions = [
  {
    name: "clinicianEvaluated",
    legend: "Have you already been evaluated by a clinician for this injury?",
    options: [
      {
        value: "yes",
        label: "Yes, I have been evaluated",
        description: "A doctor, physical therapist, or clinician has reviewed it.",
      },
      {
        value: "no",
        label: "No, not yet",
        description: "I have not had this injury evaluated yet.",
      },
    ],
  },
  {
    name: "immobilizationStatus",
    legend: "Where are you in the cast or splint timeline?",
    options: [
      {
        value: "removed_or_near_removal",
        label: "Removed or near removal",
        description: "The cast or splint is removed, or removal is coming soon.",
      },
      {
        value: "still_immobilized",
        label: "Still immobilized",
        description: "I am still fully fixed in a cast or splint.",
      },
      {
        value: "not_sure",
        label: "Not sure",
        description: "I am not sure whether this timing fits.",
      },
    ],
  },
  {
    name: "injuryArea",
    legend: "Which area are you recovering from?",
    options: [
      {
        value: "finger_or_metacarpal",
        label: "Finger or metacarpal",
        description: "This matches the first version's narrow scope.",
      },
      {
        value: "other_body_part",
        label: "Another body part",
        description: "For example ankle, wrist, shoulder, hip, or spine.",
      },
      {
        value: "not_sure",
        label: "Not sure",
        description: "I am not sure how to classify the injury area.",
      },
    ],
  },
  {
    name: "hasRedFlags",
    legend: "Do you have any urgent warning signs right now?",
    options: [
      {
        value: "yes",
        label: "Yes, I have urgent warning signs",
        description:
          "Severe pain, numbness, color change, fever, pus, rapidly worsening swelling, inability to move, or another urgent warning sign.",
      },
      {
        value: "no",
        label: "No urgent warning signs",
        description: "None of those urgent warning signs are present right now.",
      },
    ],
  },
] satisfies Array<{
  name: keyof EligibilityGateAnswers;
  legend: string;
  options: Array<{
    value: EligibilityGateAnswers[keyof EligibilityGateAnswers];
    label: string;
    description: string;
  }>;
}>;

function getOutcomeContent(result: EligibilityResult) {
  if (result === "needs_clinician_attention") {
    return {
      wrapperClass:
        "border-destructive/40 bg-destructive/10 text-destructive",
      eyebrow: "Clinician attention",
      title: "This product cannot guide urgent or unusual symptoms",
      body: "This product cannot guide urgent or unusual symptoms. Contact a clinician or seek urgent care if symptoms feel urgent.",
      showLinks: true,
    };
  }

  if (result === "not_eligible") {
    return {
      wrapperClass: "border-amber-500/40 bg-amber-50 text-amber-950",
      eyebrow: "Not eligible",
      title: "This first version is not designed for your situation",
      body: "This first version is not designed for your situation. The flow stops here before recovery profile capture or payment.",
      showLinks: true,
    };
  }

  return {
    wrapperClass: "border-emerald-500/40 bg-emerald-50 text-emerald-950",
    eyebrow: "Eligible",
    title: "You look within the first version's scope",
    body: "You look within the first version's scope. The recovery profile step is next, where Story 2.3 will collect the details needed for your 14-day plan.",
    showLinks: false,
  };
}

function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function answersMatchSubmitted(
  current: Partial<EligibilityGateAnswers>,
  submitted: EligibilityGateAnswers
) {
  return (
    current.clinicianEvaluated === submitted.clinicianEvaluated &&
    current.immobilizationStatus === submitted.immobilizationStatus &&
    current.injuryArea === submitted.injuryArea &&
    current.hasRedFlags === submitted.hasRedFlags
  );
}

export function EligibilityGate({ userEmail }: EligibilityGateProps) {
  const [onboardingStep, setOnboardingStep] = useState<
    "eligibility" | "profile" | "summary"
  >("eligibility");
  const [savedProfile, setSavedProfile] = useState<RecoveryProfileInput | null>(
    null
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot
  );
  const [submittedAnswers, setSubmittedAnswers] =
    useState<EligibilityGateAnswers | null>(null);
  const quizStartedRef = useRef(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EligibilityGateAnswers>({
    resolver: zodResolver(eligibilityGateSchema),
  });
  const clinicianEvaluated = useWatch({ control, name: "clinicianEvaluated" });
  const immobilizationStatus = useWatch({
    control,
    name: "immobilizationStatus",
  });
  const injuryArea = useWatch({ control, name: "injuryArea" });
  const hasRedFlags = useWatch({ control, name: "hasRedFlags" });

  function onSubmit(answers: EligibilityGateAnswers) {
    setSubmittedAnswers(answers);
    trackEvent("quiz_submit", {
      surface: "onboarding",
      result: classifyEligibility(answers),
    });
  }

  function trackQuizStartOnce() {
    if (quizStartedRef.current) {
      return;
    }

    quizStartedRef.current = true;
    trackEvent("quiz_start", {
      surface: "onboarding",
      step: "eligibility",
    });
  }

  const currentAnswers = {
    clinicianEvaluated,
    immobilizationStatus,
    injuryArea,
    hasRedFlags,
  } satisfies Partial<EligibilityGateAnswers>;
  const result =
    submittedAnswers && answersMatchSubmitted(currentAnswers, submittedAnswers)
      ? classifyEligibility(submittedAnswers)
      : null;
  const outcome = result ? getOutcomeContent(result) : null;
  const outcomeA11yProps =
    result === "needs_clinician_attention"
      ? ({ role: "alert", "aria-live": "assertive" } as const)
      : ({ "aria-live": "polite" } as const);

  if (onboardingStep === "profile") {
    return (
      <RecoveryProfileForm
        userEmail={userEmail}
        onBackToEligibility={() => setOnboardingStep("eligibility")}
        onProfileSaved={(profile) => {
          setSavedProfile(profile);
          setOnboardingStep("summary");
        }}
      />
    );
  }

  if (onboardingStep === "summary" && savedProfile) {
    return (
      <PersonalizedSummary
        userEmail={userEmail}
        profile={savedProfile}
        onBackToProfile={() => setOnboardingStep("profile")}
      />
    );
  }

  return (
    <main className="container py-10 sm:py-14">
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step 1 of 3
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Eligibility & Safety Gate
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Fracture Recovery Companion is educational support, not diagnosis
              or treatment. This first step checks whether the first version is
              a fit before asking for profile details or payment.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Signed in as <span className="font-medium">{userEmail}</span>
          </div>
        </div>

        <p className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          If you have severe pain, numbness, color change, fever, pus, rapidly
          worsening swelling, or symptoms that feel urgent, contact a clinician.
        </p>

        <form
          className="mt-6 space-y-6"
          noValidate
          onChange={trackQuizStartOnce}
          onSubmit={handleSubmit(onSubmit)}
        >
          {questions.map((question) => (
            <fieldset key={question.name} className="space-y-3">
              <legend className="text-sm font-semibold">{question.legend}</legend>
              <div className="grid gap-3">
                {question.options.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`${question.name}-${option.value}`}
                    className="flex cursor-pointer gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                  >
                    <input
                      id={`${question.name}-${option.value}`}
                      type="radio"
                      value={option.value}
                      className="mt-1"
                      {...register(question.name)}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors[question.name]?.message ? (
                <p className="text-sm text-destructive">
                  {errors[question.name]?.message}
                </p>
              ) : null}
            </fieldset>
          ))}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!isHydrated}
          >
            Check eligibility
          </Button>
        </form>

        {outcome ? (
          <section
            {...outcomeA11yProps}
            className={`mt-6 rounded-2xl border p-5 ${outcome.wrapperClass}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide">
              {outcome.eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {outcome.title}
            </h2>
            <p className="mt-2 text-sm">{outcome.body}</p>
            {outcome.showLinks ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" asChild>
                  <Link href="/">Back to landing page</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/legal/disclaimer">Read the medical disclaimer</Link>
                </Button>
              </div>
            ) : null}
            {result === "eligible" ? (
              <div className="mt-4">
                <Button type="button" onClick={() => setOnboardingStep("profile")}>
                  Continue to Recovery Profile
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
