import { Prisma, ProgramStatus, PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildTemplateFirstProgram,
  type GeneratedProgramContent,
} from "@/lib/program/program-content";

const devMockCheckoutPrefix = "dev_mock";
const totalProgramDays = 14;

type TransactionClient = Prisma.TransactionClient;

interface ProvisionProgramInput {
  userId: string;
  purchaseId: string;
  preparedProgram?: PreparedTemplateFirstProgram | null;
}

export interface ActiveProgramSummary {
  id: string;
  currentDay: number;
}

export type CheckoutUnlockStatus =
  | "ready"
  | "missing_program_recovered"
  | "payment_pending"
  | "payment_failed"
  | "purchase_refunded"
  | "missing_profile"
  | "missing_program"
  | "unknown_session";

export interface UnlockState {
  status: CheckoutUnlockStatus;
  program: ActiveProgramSummary | null;
  supportReference?: string;
}

export interface PreparedTemplateFirstProgram {
  recoveryProfileId: string;
  generatedProgram: GeneratedProgramContent;
}

function normalizeDateToStartOfDay(date = new Date()) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getProgramDateRange() {
  const startDate = normalizeDateToStartOfDay();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + totalProgramDays - 1);

  return { startDate, endDate };
}

function clampCurrentDay(currentDay: number) {
  return Math.min(Math.max(currentDay, 1), totalProgramDays);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function replaceTemplateProgramDays(
  tx: TransactionClient,
  programId: string,
  generatedProgram: GeneratedProgramContent
) {
  const existingDays = await tx.programDay.findMany({
    where: { programId },
    select: {
      dayIndex: true,
      completedAt: true,
      completionPercent: true,
    },
  });
  const progressByDayIndex = new Map(
    existingDays.map((day) => [
      day.dayIndex,
      {
        completedAt: day.completedAt,
        completionPercent: day.completionPercent,
      },
    ])
  );
  const generatedDayIndexes = generatedProgram.days.map((day) => day.dayIndex);

  for (const day of generatedProgram.days) {
    const previousProgress = progressByDayIndex.get(day.dayIndex);

    await tx.programDay.upsert({
      where: {
        programId_dayIndex: {
          programId,
          dayIndex: day.dayIndex,
        },
      },
      update: {
        stage: day.stage,
        contentJson: day.contentJson,
        estimatedMinutes: day.estimatedMinutes,
      },
      create: {
        programId,
        dayIndex: day.dayIndex,
        stage: day.stage,
        contentJson: day.contentJson,
        estimatedMinutes: day.estimatedMinutes,
        completedAt: previousProgress?.completedAt ?? null,
        completionPercent: previousProgress?.completionPercent ?? 0,
      },
    });
  }

  await tx.programDay.deleteMany({
    where: {
      programId,
      dayIndex: {
        notIn: generatedDayIndexes,
      },
    },
  });
}

export function getDevMockCheckoutSessionId(userId: string) {
  return `${devMockCheckoutPrefix}:${userId}`;
}

export async function getActiveProgramForUser(
  userId: string
): Promise<ActiveProgramSummary | null> {
  const program = await prisma.program.findFirst({
    where: {
      userId,
      status: { in: [ProgramStatus.ACTIVE, ProgramStatus.COMPLETED] },
      purchase: {
        status: PurchaseStatus.PAID,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      currentDay: true,
    },
  });

  return program;
}

function buildSupportReference(checkoutSessionId: string) {
  const trimmed = checkoutSessionId.trim();

  if (trimmed.length <= 14) {
    return trimmed;
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
}

export async function getCheckoutUnlockState({
  userId,
  checkoutSessionId,
}: {
  userId: string;
  checkoutSessionId: string;
}): Promise<UnlockState> {
  const purchase = await prisma.purchase.findUnique({
    where: {
      stripeCheckoutSessionId: checkoutSessionId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      program: {
        select: {
          id: true,
          currentDay: true,
          status: true,
        },
      },
    },
  });

  if (!purchase || purchase.userId !== userId) {
    return { status: "unknown_session", program: null };
  }

  const supportReference = buildSupportReference(checkoutSessionId);

  if (purchase.status === PurchaseStatus.PENDING) {
    return { status: "payment_pending", program: null, supportReference };
  }

  if (purchase.status === PurchaseStatus.FAILED) {
    return { status: "payment_failed", program: null, supportReference };
  }

  if (purchase.status === PurchaseStatus.REFUNDED) {
    return { status: "purchase_refunded", program: null, supportReference };
  }

  if (purchase.status !== PurchaseStatus.PAID) {
    return { status: "unknown_session", program: null };
  }

  if (
    purchase.program &&
    (purchase.program.status === ProgramStatus.ACTIVE ||
      purchase.program.status === ProgramStatus.COMPLETED)
  ) {
    return {
      status: "ready",
      program: {
        id: purchase.program.id,
        currentDay: purchase.program.currentDay,
      },
      supportReference,
    };
  }

  const preparedProgram = await prepareTemplateFirstProgramForUser(userId);

  if (!preparedProgram) {
    return { status: "missing_profile", program: null, supportReference };
  }

  const program = await prisma.$transaction(
    async (tx) =>
      provisionProgramForPaidPurchase(tx, {
        userId,
        purchaseId: purchase.id,
        preparedProgram,
      }),
    { timeout: 30000 }
  );

  return {
    status: program ? "missing_program_recovered" : "missing_program",
    program,
    supportReference,
  };
}

export async function prepareTemplateFirstProgramForUser(
  userId: string
): Promise<PreparedTemplateFirstProgram | null> {
  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      bodyPart: true,
      subType: true,
      castRemovedAt: true,
      hasHardware: true,
      referredToPt: true,
      painLevel: true,
      dominantHandAffected: true,
      jobType: true,
      notes: true,
      riskFlagsJson: true,
    },
  });

  if (!recoveryProfile) {
    return null;
  }

  return {
    recoveryProfileId: recoveryProfile.id,
    generatedProgram: await buildTemplateFirstProgram(recoveryProfile),
  };
}

export async function provisionProgramForPaidPurchase(
  tx: TransactionClient,
  { userId, purchaseId, preparedProgram }: ProvisionProgramInput
): Promise<ActiveProgramSummary | null> {
  const purchase = await tx.purchase.findFirst({
    where: {
      id: purchaseId,
      userId,
      status: PurchaseStatus.PAID,
    },
    select: {
      id: true,
      program: {
        select: {
          id: true,
          currentDay: true,
          status: true,
          templateVersion: true,
        },
      },
    },
  });

  if (!purchase || !preparedProgram) {
    return null;
  }

  const { recoveryProfileId, generatedProgram } = preparedProgram;

  if (purchase.program) {
    const program = await tx.program.update({
      where: {
        id: purchase.program.id,
      },
      data: {
        templateVersion: generatedProgram.templateVersion,
        generatedSummaryJson: generatedProgram.generatedSummaryJson,
        currentDay: clampCurrentDay(purchase.program.currentDay),
        status: ProgramStatus.ACTIVE,
      },
      select: {
        id: true,
        currentDay: true,
      },
    });

    await replaceTemplateProgramDays(tx, program.id, generatedProgram);

    return {
      id: program.id,
      currentDay: program.currentDay,
    };
  }

  const { startDate, endDate } = getProgramDateRange();

  let program: ActiveProgramSummary;

  try {
    program = await tx.program.create({
      data: {
        userId,
        recoveryProfileId,
        purchaseId: purchase.id,
        templateVersion: generatedProgram.templateVersion,
        startDate,
        endDate,
        currentDay: 1,
        status: ProgramStatus.ACTIVE,
        generatedSummaryJson: generatedProgram.generatedSummaryJson,
      },
      select: {
        id: true,
        currentDay: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const existingProgram = await tx.program.findUnique({
      where: {
        purchaseId: purchase.id,
      },
      select: {
        id: true,
        currentDay: true,
      },
    });

    if (!existingProgram) {
      throw error;
    }

    program = existingProgram;
  }

  program = await tx.program.update({
    where: {
      id: program.id,
    },
    data: {
      templateVersion: generatedProgram.templateVersion,
      generatedSummaryJson: generatedProgram.generatedSummaryJson,
      currentDay: clampCurrentDay(program.currentDay),
      status: ProgramStatus.ACTIVE,
    },
    select: {
      id: true,
      currentDay: true,
    },
  });

  await replaceTemplateProgramDays(tx, program.id, generatedProgram);

  return program;
}

export async function provisionDevMockPurchaseAndProgram(
  userId: string
): Promise<UnlockState> {
  if (process.env.NODE_ENV === "production" || process.env.STRIPE_SECRET_KEY) {
    return {
      status: "unknown_session",
      program: null,
    };
  }

  const preparedProgram = await prepareTemplateFirstProgramForUser(userId);

  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return { status: "unknown_session", program: null };
      }

      const purchase = await tx.purchase.upsert({
        where: {
          stripeCheckoutSessionId: getDevMockCheckoutSessionId(userId),
        },
        create: {
          userId,
          stripeCheckoutSessionId: getDevMockCheckoutSessionId(userId),
          amount: 1499,
          currency: "usd",
          status: PurchaseStatus.PAID,
          paidAt: new Date(),
        },
        update: {
          status: PurchaseStatus.PAID,
          paidAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      const program = await provisionProgramForPaidPurchase(tx, {
        userId,
        purchaseId: purchase.id,
        preparedProgram,
      });

      return {
        status: program ? "ready" : "missing_profile",
        program,
        supportReference: "dev_mock",
      };
    },
    { timeout: 30000 }
  );
}
