import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgramStatus } from "@prisma/client";

import { CompletionShareAction } from "@/components/completion/completion-share-action";
import { ReportDownloadAction } from "@/components/completion/report-download-action";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

export const dynamic = "force-dynamic";

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CompletionPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fcompletion");
  }

  const state = await resolveCurrentProgramForUser(session.user.id);

  if (state.status === "no_purchase" || state.status === "missing_profile") {
    redirect("/onboarding");
  }

  if (state.status === "missing_day_content") {
    console.error("Missing completion page program content", {
      userId: session.user.id,
      programId: state.programId,
      currentDay: state.currentDay,
    });
    redirect("/progress");
  }

  const program = state.program;

  if (program.status !== ProgramStatus.COMPLETED) {
    redirect(`/day/${program.currentDay}`);
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      bodyPart: true,
      subType: true,
    },
  });
  const bodyPartLabel = formatLabel(recoveryProfile?.bodyPart) || "Recovery";
  const subTypeLabel = formatLabel(recoveryProfile?.subType);

  return (
    <main className="container py-8 sm:py-12">
      <section data-testid="completion-page" className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Program Complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your 14-day recovery companion is complete
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            You finished the guided 14-day companion. This is a progress milestone
            and educational summary, not medical clearance or a diagnosis.
          </p>
        </section>

        <section
          data-testid="completion-summary"
          className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completion Summary
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            14 of 14 days finished
          </h2>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="mt-1 font-medium">Completed</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Plan
              </div>
              <div className="mt-1 font-medium">
                Day {program.currentDay} of {program.totalDays}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Focus Area
              </div>
              <div className="mt-1 font-medium">
                {bodyPartLabel}
                {subTypeLabel ? ` - ${subTypeLabel}` : ""}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Your saved Day 14 review remains available if you want to revisit the
            final day&apos;s focus, normal signals, and safety boundaries.
          </p>
        </section>

        <section
          data-testid="completion-next-steps"
          className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next Steps
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Keep it lightweight and clinician-aligned
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>- Download your non-diagnostic summary for personal reference.</li>
            <li>- Share the public product link without exposing your recovery details.</li>
            <li>- Review Day 14 if you want to revisit the final guidance.</li>
            <li>- Keep following any clinician-approved routines you were given.</li>
            <li>- Use Chat only for non-urgent educational questions.</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ReportDownloadAction />
            <CompletionShareAction />
            <Button asChild>
              <Link href="/day/14">Review Day 14</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/chat">Ask a non-urgent question</Link>
            </Button>
          </div>
        </section>

        <section
          data-testid="completion-safety-boundary"
          className="rounded-2xl border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground shadow-xs sm:p-8"
        >
          <h2 className="text-base font-semibold text-foreground">Safety boundary</h2>
          <p className="mt-2">
            This product is educational support only. It does not diagnose,
            treat, provide medical clearance, or replace your clinician&apos;s
            instructions. Contact a clinician promptly for severe pain, numbness,
            color change, fever, pus, sudden swelling, inability to move, or
            symptoms that are rapidly worsening.
          </p>
        </section>
      </section>
    </main>
  );
}
