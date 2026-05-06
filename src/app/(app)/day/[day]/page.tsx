import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

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

  if (requestedDay > program.currentDay) {
    redirect(`/day/${program.currentDay}`);
  }

  const programDay = program.currentProgramDay;
  const isCurrentDay = requestedDay === program.currentDay;

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
                {isCurrentDay ? "Today's recovery plan" : "Review mode"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Day {requestedDay} of {program.totalDays}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isCurrentDay
                  ? "Start with the focus below before moving into the detailed actions in the next stories."
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

          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
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
                {isCurrentDay ? "Current task" : "Read-only review"}
              </div>
            </div>
          </div>
        </section>

        {isCurrentDay ? (
          <>
            <section
              data-testid="today-focus"
              className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Today&apos;s Focus
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

              <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Safety boundary:
                </span>{" "}
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
                        : ["Severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move."]
                      ).map((signal) => (
                        <li key={signal}>- {signal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
              Exercise cards, completion controls, and AI questions arrive in
              the next Epic 4 stories. This page currently focuses on today&apos;s
              orientation and safety framing.
            </section>
          </>
        ) : (
          <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Day {requestedDay} review
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Past-day detail view is read-only for now. The active day is Day{" "}
              {program.currentDay}, and full review behavior is delivered in a
              later story.
            </p>
          </section>
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
