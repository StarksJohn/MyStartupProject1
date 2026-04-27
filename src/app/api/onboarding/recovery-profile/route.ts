import { NextResponse, type NextRequest } from "next/server";

import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  recoveryProfileSchema,
  toRecoveryProfileSaveInput,
} from "@/lib/onboarding/recovery-profile";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recoveryProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recovery profile", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const profile = toRecoveryProfileSaveInput(parsed.data);

  if (session.user.email) {
    await prisma.user.upsert({
      where: { id: session.user.id },
      create: {
        id: session.user.id,
        email: session.user.email,
      },
      update: {
        email: session.user.email,
      },
    });
  }

  await prisma.recoveryProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bodyPart: profile.bodyPart,
      subType: profile.subType,
      castRemovedAt: new Date(profile.castRemovedAt),
      hasHardware: profile.hasHardware,
      referredToPt: profile.referredToPt,
      painLevel: profile.painLevel,
      dominantHandAffected: profile.dominantHandAffected,
      jobType: profile.jobType,
      notes: profile.notes,
      riskFlagsJson: {},
    },
    update: {
      bodyPart: profile.bodyPart,
      subType: profile.subType,
      castRemovedAt: new Date(profile.castRemovedAt),
      hasHardware: profile.hasHardware,
      referredToPt: profile.referredToPt,
      painLevel: profile.painLevel,
      dominantHandAffected: profile.dominantHandAffected,
      jobType: profile.jobType,
      notes: profile.notes,
      riskFlagsJson: {},
    },
  });

  return NextResponse.json({ status: "saved" });
}
