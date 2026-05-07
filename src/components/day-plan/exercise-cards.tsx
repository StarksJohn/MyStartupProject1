"use client";

import { useMemo, useState } from "react";

import type { DayExerciseCard } from "@/lib/program/current-program-service";

interface ExerciseCardsProps {
  exercises: DayExerciseCard[];
  completedSlugs?: Set<string>;
  onToggleExercise?: (slug: string) => void;
}

export function ExerciseCards({
  exercises,
  completedSlugs,
  onToggleExercise,
}: ExerciseCardsProps) {
  const [internalCompletedSlugs, setInternalCompletedSlugs] = useState<Set<string>>(
    () => new Set()
  );
  const activeCompletedSlugs = completedSlugs ?? internalCompletedSlugs;
  const completedCount = exercises.filter((exercise) =>
    activeCompletedSlugs.has(exercise.slug)
  ).length;
  const completionPercent =
    exercises.length === 0
      ? 0
      : Math.round((completedCount / exercises.length) * 100);
  const completionSummary = useMemo(
    () => `${completedCount} of ${exercises.length} exercises complete`,
    [completedCount, exercises.length]
  );

  function toggleExercise(slug: string) {
    if (onToggleExercise) {
      onToggleExercise(slug);
      return;
    }

    setInternalCompletedSlugs((previous) => {
      const next = new Set(previous);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }

  if (exercises.length === 0) {
    return (
      <section
        data-testid="exercise-cards-empty"
        className="rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground"
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Exercise details are being prepared
        </h2>
        <p className="mt-2">
          Your day orientation is available above. The exercise card details are
          not ready yet, so do not improvise exercises from this fallback.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="exercise-cards"
      className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Exercise Cards
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Work through today&apos;s exercises
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check off each card as you complete it. This is page-local progress;
            the full day completion flow arrives in the next story.
          </p>
        </div>

        <div
          aria-live="polite"
          className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground"
        >
          <div className="font-medium text-foreground">
            {completionPercent}% complete
          </div>
          <div className="mt-1">{completionSummary}</div>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="mt-6 space-y-4">
        {exercises.map((exercise, index) => {
          const isComplete = activeCompletedSlugs.has(exercise.slug);
          const checkboxId = `exercise-${exercise.slug}`;

          return (
            <article
              key={exercise.slug}
              className="rounded-2xl border bg-muted/20 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Exercise {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {exercise.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {exercise.durationLabel}
                  </p>
                </div>

                <label
                  htmlFor={checkboxId}
                  className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2 text-sm font-medium"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isComplete}
                    onChange={() => toggleExercise(exercise.slug)}
                    aria-label={`Mark ${exercise.title} complete`}
                    className="h-4 w-4"
                  />
                  {isComplete ? "Complete" : "Mark complete"}
                </label>
              </div>

              {exercise.instructions.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold">How to do it</h4>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    {exercise.instructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Use gentle, comfortable effort and follow clinician-specific
                  limits first.
                </p>
              )}

              {exercise.cautions.length > 0 ? (
                <div className="mt-4 rounded-xl border bg-background/60 p-3 text-sm text-muted-foreground">
                  <h4 className="font-medium text-foreground">Caution</h4>
                  <ul className="mt-2 space-y-1">
                    {exercise.cautions.map((caution) => (
                      <li key={caution}>- {caution}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
