import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgramStatus } from "@prisma/client";

import { DayPlanActions } from "@/components/day-plan/day-plan-actions";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import {
  loadProgramDayForProgram,
  resolveCurrentProgramForUser,
  type ProgramDayEntry,
} from "@/lib/program/current-program-service";

export const dynamic = "force-dynamic";

interface DayPageProps {
  params: Promise<{ day: string }>;
}

function parseDayParam(rawDay: string): number | null {
  if (!/^\d+$/.test(rawDay)) {
    return null;
  }

  const parsed = Number.parseInt(rawDay, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 14) {
    return null;
  }

  return parsed;
}

function formatStage(stage: string) {
  return stage
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getCompletionLabel(completionPercent: number, completedAt: Date | null) {
  if (completedAt) {
    return "Completed";
  }

  if (completionPercent > 0) {
    return `${completionPercent}% complete`;
  }

  return "Not started";
}

const defaultSafetyBoundary =
  "This is educational guidance, not a diagnosis or treatment plan. Stop and contact a clinician if you notice severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move.";

function getDayMode({
  requestedDay,
  currentDay,
  programStatus,
  programDay,
}: {
  requestedDay: number;
  currentDay: number;
  programStatus: ProgramStatus;
  programDay: ProgramDayEntry;
}) {
  if (requestedDay > currentDay) {
    return "locked";
  }

  if (programStatus === ProgramStatus.COMPLETED || programDay.completedAt) {
    return "completed-review";
  }

  if (requestedDay < currentDay) {
    return "review";
  }

  return "current";
}

function DayContentSection({
  programDay,
  mode,
}: {
  programDay: ProgramDayEntry;
  mode: "current" | "review" | "completed-review";
}) {
  const isCurrent = mode === "current";

  return (
    <section
      data-testid={isCurrent ? "today-focus" : "day-review-state"}
      className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {isCurrent ? "Today's Focus" : "Review Focus"}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {programDay.title}
      </h2>
      <p className="mt-3 text-base font-medium">{programDay.focus}</p>
      {programDay.summary ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          {programDay.summary}
        </p>
      ) : null}

      {!isCurrent ? (
        <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Read-only review:</span>{" "}
          This day is preserved for reference. Keep your active recovery work on
          the currently unlocked day.
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Safety boundary:</span>{" "}
        {programDay.safetyNotes[0] ?? defaultSafetyBoundary}
      </div>

      {programDay.normalSignals.length > 0 ||
      programDay.getHelpSignals.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">
              What can be normal today
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(programDay.normalSignals.length > 0
                ? programDay.normalSignals
                : ["Mild stiffness can be expected during gentle practice."]
              ).map((signal) => (
                <li key={signal}>- {signal}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">
              Stop and contact a clinician
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(programDay.getHelpSignals.length > 0
                ? programDay.getHelpSignals
                : [
                    "Severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move.",
                  ]
              ).map((signal) => (
                <li key={signal}>- {signal}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default async function DayPage({ params }: DayPageProps) {
  const { day: rawDay } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/day/${rawDay}`);
    redirect(`/sign-in?callbackUrl=${callbackUrl}`);
  }

  const requestedDay = parseDayParam(rawDay);

  if (requestedDay === null) {
    redirect("/progress");
  }

  const state = await resolveCurrentProgramForUser(session.user.id);

  if (state.status === "no_purchase" || state.status === "missing_profile") {
    redirect("/onboarding");
  }

  if (state.status === "missing_day_content") {
    redirect("/progress");
  }

  const program = state.program;

  const selectedDay =
    requestedDay === program.currentDay
      ? {
          entry: program.currentProgramDay,
          contentComplete: true,
        }
      : requestedDay < program.currentDay
        ? await loadProgramDayForProgram({
            programId: program.programId,
            dayIndex: requestedDay,
          })
        : null;

  if (requestedDay > program.currentDay) {
    return (
      <main className="container py-8 sm:py-12">
        <section className="mx-auto max-w-3xl space-y-5">
          <section
            data-testid="day-locked-state"
            className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Locked day
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Day {requestedDay} is not unlocked yet
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Your current available plan is Day {program.currentDay}. Keep
              working through the unlocked day first, then this day will become
              available when your progress advances.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={`/day/${program.currentDay}`}>
                  Go to today (Day {program.currentDay})
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/progress">Progress overview</Link>
              </Button>
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (!selectedDay || !selectedDay.contentComplete) {
    console.error("Missing requested program day content", {
      userId: session.user.id,
      programId: program.programId,
      requestedDay,
      currentDay: program.currentDay,
    });

    return (
      <main className="container py-8 sm:py-12">
        <section
          data-testid="day-missing-content-state"
          className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Plan content unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            We could not safely load Day {requestedDay}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            This day&apos;s plan content is missing or incomplete, so we are not
            showing partial recovery guidance. Please use the safe links below
            and contact support if this remains visible.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/progress">Retry progress overview</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to landing page</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const programDay = selectedDay.entry;
  const dayMode = getDayMode({
    requestedDay,
    currentDay: program.currentDay,
    programStatus: program.status,
    programDay,
  });
  const isCurrentDay = dayMode === "current";
  const isCompletedReview = dayMode === "completed-review";

  return (
    <main className="container py-8 sm:py-12">
      <section
        data-testid={isCurrentDay ? "day-current-shell" : "day-review-shell"}
        className="mx-auto max-w-3xl space-y-5"
      >
        <section
          data-testid="day-recovery-header"
          className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isCurrentDay
                  ? "Today's recovery plan"
                  : isCompletedReview
                    ? "Completed review"
                    : "Review mode"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Day {requestedDay} of {program.totalDays}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isCurrentDay
                  ? "Start with the focus below, then complete today's actions when you are ready."
                  : isCompletedReview
                    ? "This completed day is read-only so your saved progress stays intact."
                    : `This read-only review keeps today's active task on Day ${program.currentDay}.`}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">
                {getCompletionLabel(
                  programDay.completionPercent,
                  programDay.completedAt
                )}
              </div>
              <div className="mt-1">Template: {program.templateVersion}</div>
            </div>
          </div>

          <div className="mt-6" aria-label="Program progress">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Overall progress</span>
              <span>{program.currentDay}/{program.totalDays}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.round((program.currentDay / program.totalDays) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Stage
              </div>
              <div className="mt-1 font-medium">
                {formatStage(programDay.stage)}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Estimated time
              </div>
              <div className="mt-1 font-medium">
                {programDay.estimatedMinutes}
                {" minutes"}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Day state
              </div>
              <div className="mt-1 font-medium">
                {isCurrentDay
                  ? "Current task"
                  : isCompletedReview
                    ? "Completed review"
                    : "Read-only review"}
              </div>
            </div>
          </div>
        </section>

        {isCurrentDay ? (
          <>
            <DayContentSection programDay={programDay} mode={dayMode} />

            <DayPlanActions day={requestedDay} exercises={programDay.exercises} />
          </>
        ) : (
          <DayContentSection
            programDay={programDay}
            mode={isCompletedReview ? "completed-review" : "review"}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isCurrentDay ? (
            <Button asChild>
              <Link href={`/day/${program.currentDay}`}>
                Go to today (Day {program.currentDay})
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href="/progress">Progress overview</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
