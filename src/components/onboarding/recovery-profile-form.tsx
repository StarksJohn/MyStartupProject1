"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  recoveryProfileSchema,
  type RecoveryProfileInput,
} from "@/lib/onboarding/recovery-profile";

interface RecoveryProfileFormProps {
  userEmail: string;
  onBackToEligibility: () => void;
}

type FieldName = keyof RecoveryProfileInput;

const profileSteps: Array<{
  title: string;
  description: string;
  fields: FieldName[];
}> = [
  {
    title: "Injury details",
    description: "Tell us what narrow first-version path this profile maps to.",
    fields: ["bodyPart", "subType", "castRemovedAt"],
  },
  {
    title: "Recovery context",
    description: "Capture signals that shape future day-by-day plan variants.",
    fields: ["hasHardware", "referredToPt", "painLevel"],
  },
  {
    title: "Daily-life impact",
    description: "Add practical context without turning this into diagnosis.",
    fields: ["dominantHandAffected", "jobType", "notes"],
  },
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function RecoveryProfileForm({
  userEmail,
  onBackToEligibility,
}: RecoveryProfileFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    trigger,
  } = useForm<RecoveryProfileInput>({
    resolver: zodResolver(recoveryProfileSchema),
    defaultValues: {
      bodyPart: "finger",
      hasHardware: "not_sure",
      referredToPt: "not_sure",
      dominantHandAffected: "no",
      jobType: "desk",
      notes: "",
    },
  });

  const step = profileSteps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === profileSteps.length - 1;

  async function goNext() {
    const isValid = await trigger(step.fields, { shouldFocus: true });

    if (isValid) {
      setActiveStep((current) => current + 1);
    }
  }

  function goPrevious() {
    if (isFirstStep) {
      onBackToEligibility();
      return;
    }

    setActiveStep((current) => current - 1);
  }

  async function onSubmit(values: RecoveryProfileInput) {
    setStatus("saving");

    const response = await fetch("/api/onboarding/recovery-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    setStatus(response.ok ? "saved" : "error");
  }

  if (status === "saved") {
    const values = getValues();

    return (
      <main className="container py-10 sm:py-14">
        <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step 2 of 3 complete
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Recovery Profile saved
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Your profile is ready for the personalized summary and checkout step
            in Story 2.4. No payment or program has been created yet.
          </p>
          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm">
            <p>
              <span className="font-medium">Profile:</span> {values.bodyPart},{" "}
              {values.subType}, pain level {values.painLevel}/10
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container py-10 sm:py-14">
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step 2 of 3
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Recovery Profile
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              This profile collects only the details needed to map a future
              14-day educational plan. It is not diagnosis or treatment.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Signed in as <span className="font-medium">{userEmail}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Profile part {activeStep + 1} of {profileSteps.length}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {step.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step.description}
          </p>
        </div>

        <form
          className="mt-6 space-y-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {activeStep === 0 ? (
            <>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  Which area is this profile for?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["finger", "Finger"],
                    ["metacarpal", "Metacarpal"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        value={value}
                        className="mt-1"
                        {...register("bodyPart")}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.bodyPart?.message} />
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="subType" className="text-sm font-semibold">
                  Subtype or short injury description
                </label>
                <input
                  id="subType"
                  type="text"
                  placeholder="e.g. proximal phalanx stiffness"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("subType")}
                />
                <FieldError message={errors.subType?.message} />
              </div>

              <div className="space-y-2">
                <label htmlFor="castRemovedAt" className="text-sm font-semibold">
                  Cast or splint removal date
                </label>
                <input
                  id="castRemovedAt"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("castRemovedAt")}
                />
                <FieldError message={errors.castRemovedAt?.message} />
              </div>
            </>
          ) : null}

          {activeStep === 1 ? (
            <>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  Do you have plates, screws, pins, or other hardware?
                </legend>
                <div className="grid gap-3">
                  {[
                    ["yes", "Yes"],
                    ["no", "No"],
                    ["not_sure", "Not sure"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        value={value}
                        className="mt-1"
                        {...register("hasHardware")}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.hasHardware?.message} />
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  Were you referred to physical therapy?
                </legend>
                <div className="grid gap-3">
                  {[
                    ["yes", "Yes"],
                    ["no", "No"],
                    ["not_sure", "Not sure"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        value={value}
                        className="mt-1"
                        {...register("referredToPt")}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.referredToPt?.message} />
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="painLevel" className="text-sm font-semibold">
                  Current pain level, 0 to 10
                </label>
                <input
                  id="painLevel"
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("painLevel", { valueAsNumber: true })}
                />
                <FieldError message={errors.painLevel?.message} />
              </div>
            </>
          ) : null}

          {activeStep === 2 ? (
            <>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  Is your dominant hand affected?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["yes", "Yes"],
                    ["no", "No"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        value={value}
                        className="mt-1"
                        {...register("dominantHandAffected")}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.dominantHandAffected?.message} />
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="jobType" className="text-sm font-semibold">
                  Work or daily-use category
                </label>
                <select
                  id="jobType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("jobType")}
                >
                  <option value="desk">Desk or computer work</option>
                  <option value="manual">Manual or tool-heavy work</option>
                  <option value="caregiving">Caregiving or household tasks</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
                <FieldError message={errors.jobType?.message} />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-semibold">
                  Optional notes for plan mapping
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Optional. Keep this to practical context, not diagnosis."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("notes")}
                />
                <FieldError message={errors.notes?.message} />
              </div>
            </>
          ) : null}

          {status === "error" ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              We could not save your profile. Check the fields and try again.
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={goPrevious}>
              Previous
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Saving..." : "Save Recovery Profile"}
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
