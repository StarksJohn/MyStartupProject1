import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

export const dynamic = "force-dynamic";

export default async function ProgressEntryPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fprogress");
  }

  const state = await resolveCurrentProgramForUser(session.user.id);

  if (state.status === "ready" || state.status === "missing_program_recovered") {
    redirect(`/day/${state.program.currentDay}`);
  }

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
          We could not find an active 14-day plan
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {state.status === "no_purchase"
            ? "It looks like you have not unlocked the 14-day companion yet. Start with the eligibility quiz to see if it fits."
            : state.status === "missing_profile"
              ? "Your purchase is on file, but we need to finish your recovery profile before generating the plan."
              : "Your plan content is being prepared. If this message stays after a moment, please return to onboarding."}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/onboarding">Back to onboarding</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to landing page</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
