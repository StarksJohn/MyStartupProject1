import { redirect } from "next/navigation";

import { ChatEntryShell } from "@/components/chat/chat-entry-shell";
import { getAuthSession } from "@/lib/auth/session";
import { getChatQuotaState } from "@/lib/chat/quota";
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

function buildSuggestedPrompts(currentDay: number, bodyPartLabel: string) {
  const bodyPart = bodyPartLabel ? bodyPartLabel.toLowerCase() : "recovery";

  return [
    `Is this level of ${bodyPart} stiffness expected for Day ${currentDay}?`,
    "What symptoms today would mean I should contact a clinician?",
    "How should I think about swelling after today's exercises?",
    "Can I keep going if the movement feels tight but not painful?",
    "What should I avoid during today's recovery work?",
  ];
}

export default async function ChatPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fchat");
  }

  const state = await resolveCurrentProgramForUser(session.user.id);

  if (state.status === "no_purchase" || state.status === "missing_profile") {
    redirect("/onboarding");
  }

  if (state.status === "missing_day_content") {
    redirect("/progress");
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      bodyPart: true,
      subType: true,
    },
  });

  if (!recoveryProfile) {
    redirect("/onboarding");
  }

  const program = state.program;
  const bodyPartLabel = formatLabel(recoveryProfile.bodyPart);
  const subTypeLabel = formatLabel(recoveryProfile.subType);
  const quotaState = await getChatQuotaState(session.user.id);

  return (
    <main className="container py-8 sm:py-12">
      <ChatEntryShell
        bodyPartLabel={bodyPartLabel}
        subTypeLabel={subTypeLabel}
        currentDay={program.currentDay}
        totalDays={program.totalDays}
        quotaRemaining={quotaState.remaining}
        suggestedPrompts={buildSuggestedPrompts(program.currentDay, bodyPartLabel)}
      />
    </main>
  );
}
