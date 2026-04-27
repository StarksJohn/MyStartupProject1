import { redirect } from "next/navigation";

import { EligibilityGate } from "@/components/onboarding/eligibility-gate";
import { getAuthSession } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fonboarding");
  }

  return <EligibilityGate userEmail={session.user.email} />;
}
