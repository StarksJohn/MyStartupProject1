import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgramStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import {
  resolveCurrentProgramForUser,
  type CurrentProgramState,
} from "@/lib/program/current-program-service";

export const dynamic = "force-dynamic";

type ProgressFallbackState = Exclude<
  CurrentProgramState,
  | { status: "ready" }
  | { status: "missing_program_recovered" }
>;

function getFallbackContent(state: ProgressFallbackState) {
  if (state.status === "no_purchase") {
    return {
      title: "We could not find an active 14-day plan",
      description:
        "It looks like you have not unlocked the 14-day companion yet. Start with the eligibility quiz to see if it fits.",
      primaryHref: "/onboarding",
      primaryLabel: "Back to onboarding",
    };
  }

  if (state.status === "missing_profile") {
    return {
      title: "Finish your recovery profile",
      description:
        "Your purchase is on file, but we need to finish your recovery profile before generating the plan.",
      primaryHref: "/onboarding",
      primaryLabel: "Back to onboarding",
    };
  }

  return {
    title: "Your plan content needs support",
    description:
      "We found your 14-day plan, but today's content is missing or incomplete. We are not showing partial recovery guidance. Please retry in a moment and contact support if this stays visible.",
    primaryHref: `/day/${state.currentDay}`,
    primaryLabel: "Retry today's plan",
  };
}

export default async function ProgressEntryPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fprogress");
  }

  const state = await resolveCurrentProgramForUser(session.user.id);

  if (state.status === "ready" || state.status === "missing_program_recovered") {
    if (state.program.status === ProgramStatus.COMPLETED) {
      redirect("/completion");
    }

    redirect(`/day/${state.program.currentDay}`);
  }

  const fallback = getFallbackContent(state);

  return (
    <main className="container py-10 sm:py-14">
      <section
        data-testid="progress-fallback"
        className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Progress entry
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {fallback.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {fallback.description}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={fallback.primaryHref}>{fallback.primaryLabel}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to landing page</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
