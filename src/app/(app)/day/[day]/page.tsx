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
    <main className="container py-10 sm:py-14">
      <section
        data-testid={isCurrentDay ? "current-day-placeholder" : "past-day-placeholder"}
        className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Day {requestedDay} of {program.totalDays}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isCurrentDay
            ? programDay.title || `Day ${requestedDay}`
            : `Day ${requestedDay} recap is coming soon`}
        </h1>

        {isCurrentDay ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {programDay.summary ||
                "Your full Day experience launches in the next story. For now, this is the entry point that knows where you are in the plan."}
            </p>
            <div className="mt-6 grid gap-4 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-medium text-foreground">Stage:</span>{" "}
                {programDay.stage}
              </div>
              <div>
                <span className="font-medium text-foreground">Focus:</span>{" "}
                {programDay.focus || "—"}
              </div>
              <div>
                <span className="font-medium text-foreground">Estimated minutes:</span>{" "}
                {programDay.estimatedMinutes}
              </div>
              <div>
                <span className="font-medium text-foreground">Template:</span>{" "}
                {program.templateVersion}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            We will surface past-day recaps and exercises in a later story. For
            now, the active day is Day {program.currentDay}.
          </p>
        )}

        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          This is a minimal placeholder. The full recovery day surface (videos,
          exercises, FAQs, completion) is delivered in upcoming stories.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
