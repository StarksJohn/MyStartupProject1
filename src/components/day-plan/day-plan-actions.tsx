"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ExerciseCards } from "@/components/day-plan/exercise-cards";
import { Button } from "@/components/ui/button";
import type { DayExerciseCard } from "@/lib/program/current-program-service";

interface DayPlanActionsProps {
  day: number;
  exercises: DayExerciseCard[];
}

interface CompletionResponse {
  status: string;
  message?: string;
  currentDay?: number;
  programStatus?: string;
}

export function DayPlanActions({ day, exercises }: DayPlanActionsProps) {
  const router = useRouter();
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(
    () => new Set()
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const completedCount = exercises.filter((exercise) =>
    completedSlugs.has(exercise.slug)
  ).length;
  const completionPercent =
    exercises.length === 0
      ? 100
      : Math.round((completedCount / exercises.length) * 100);
  const allExercisesComplete = completionPercent >= 100;
  const completionSummary = useMemo(
    () =>
      exercises.length === 0
        ? "No exercise cards are available for this day."
        : `${completedCount} of ${exercises.length} exercise cards checked`,
    [completedCount, exercises.length]
  );

  function toggleExercise(slug: string) {
    setCompletedSlugs((previous) => {
      const next = new Set(previous);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }

  async function completeDay() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/program/day/${day}/complete`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as CompletionResponse;

      if (!response.ok) {
        setFeedback(body.message ?? "This day could not be completed right now.");
        return;
      }

      setShowConfirmation(false);
      setFeedback(body.message ?? "Day marked complete.");
      window.setTimeout(() => {
        if (body.programStatus === "COMPLETED") {
          router.push("/completion");
        } else if (typeof body.currentDay === "number" && body.currentDay > day) {
          router.push(`/day/${body.currentDay}`);
        } else {
          router.refresh();
        }
      }, 1000);
    } catch {
      setFeedback("This day could not be completed right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrimaryComplete() {
    if (!allExercisesComplete) {
      setShowConfirmation(true);
      setFeedback(null);
      return;
    }

    void completeDay();
  }

  return (
    <>
      <ExerciseCards
        exercises={exercises}
        completedSlugs={completedSlugs}
        onToggleExercise={toggleExercise}
      />

      <section
        data-testid="day-completion-actions"
        className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Day Completion
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Ready to close today?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {completionSummary}. Completing the day updates your saved program
          progress.
        </p>

        {showConfirmation ? (
          <div
            data-testid="day-completion-confirmation"
            className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground"
          >
            <h3 className="font-semibold text-foreground">
              Complete with unchecked exercise cards?
            </h3>
            <p className="mt-2">
              Not every visible exercise card is checked. You can still complete
              today if you intentionally stopped early or followed clinician
              limits.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void completeDay()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing..." : "Complete day anyway"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Keep working
              </Button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <p
            data-testid="day-completion-feedback"
            aria-live="polite"
            className="mt-4 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground"
          >
            {feedback}
          </p>
        ) : null}

        {!showConfirmation ? (
          <div className="mt-5">
            <Button
              type="button"
              onClick={handlePrimaryComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Completing..." : "Mark day complete"}
            </Button>
          </div>
        ) : null}
      </section>
    </>
  );
}
