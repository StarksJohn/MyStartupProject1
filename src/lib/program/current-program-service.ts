import { Prisma, ProgramStatus, PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  prepareTemplateFirstProgramForUser,
  provisionProgramForPaidPurchase,
} from "@/lib/program/provisioning-service";

const totalProgramDays = 14;

export interface CurrentProgramEntry {
  programId: string;
  templateVersion: string;
  status: ProgramStatus;
  currentDay: number;
  totalDays: number;
  currentProgramDay: {
    dayIndex: number;
    stage: string;
    estimatedMinutes: number;
    title: string;
    focus: string;
    summary: string;
    normalSignals: string[];
    getHelpSignals: string[];
    safetyNotes: string[];
    personalizationFlags: string[];
    completedAt: Date | null;
    completionPercent: number;
  };
}

export type CurrentProgramState =
  | { status: "ready"; program: CurrentProgramEntry }
  | { status: "missing_program_recovered"; program: CurrentProgramEntry }
  | { status: "no_purchase" }
  | { status: "missing_profile"; purchaseId: string }
  | {
      status: "missing_day_content";
      programId: string;
      currentDay: number;
    };

interface ContentSummary {
  title: string;
  focus: string;
  summary: string;
  normalSignals: string[];
  getHelpSignals: string[];
  safetyNotes: string[];
  personalizationFlags: string[];
}

function clampDayIndex(dayIndex: number) {
  return Math.min(Math.max(dayIndex, 1), totalProgramDays);
}

function readContentSummary(contentJson: Prisma.JsonValue | null): ContentSummary {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) {
    return {
      title: "",
      focus: "",
      summary: "",
      normalSignals: [],
      getHelpSignals: [],
      safetyNotes: [],
      personalizationFlags: [],
    };
  }

  const record = contentJson as Record<string, unknown>;

  return {
    title: typeof record.title === "string" ? record.title : "",
    focus: typeof record.focus === "string" ? record.focus : "",
    summary: typeof record.summary === "string" ? record.summary : "",
    normalSignals: readStringArray(record.normalSignals),
    getHelpSignals: readStringArray(record.getHelpSignals),
    safetyNotes: readStringArray(record.safetyNotes),
    personalizationFlags: readStringArray(record.personalizationFlags),
  };
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

interface LoadedActiveProgram {
  entry: CurrentProgramEntry;
  contentComplete: boolean;
}

async function loadActiveProgramEntry(
  userId: string
): Promise<LoadedActiveProgram | null> {
  const program = await prisma.program.findFirst({
    where: {
      userId,
      status: ProgramStatus.ACTIVE,
      purchase: {
        status: PurchaseStatus.PAID,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      templateVersion: true,
      status: true,
      currentDay: true,
    },
  });

  if (!program) {
    return null;
  }

  const currentDayIndex = clampDayIndex(program.currentDay);
  const currentProgramDay = await prisma.programDay.findUnique({
    where: {
      programId_dayIndex: {
        programId: program.id,
        dayIndex: currentDayIndex,
      },
    },
    select: {
      dayIndex: true,
      stage: true,
      estimatedMinutes: true,
      contentJson: true,
      completedAt: true,
      completionPercent: true,
    },
  });

  if (!currentProgramDay) {
    return {
      entry: {
        programId: program.id,
        templateVersion: program.templateVersion,
        status: program.status,
        currentDay: currentDayIndex,
        totalDays: totalProgramDays,
        currentProgramDay: {
          dayIndex: currentDayIndex,
          stage: "",
          estimatedMinutes: 0,
          title: "",
          focus: "",
          summary: "",
          normalSignals: [],
          getHelpSignals: [],
          safetyNotes: [],
          personalizationFlags: [],
          completedAt: null,
          completionPercent: 0,
        },
      },
      contentComplete: false,
    };
  }

  const summary = readContentSummary(currentProgramDay.contentJson);
  const contentComplete = summary.title.length > 0 && summary.focus.length > 0;

  return {
    entry: {
      programId: program.id,
      templateVersion: program.templateVersion,
      status: program.status,
      currentDay: currentDayIndex,
      totalDays: totalProgramDays,
      currentProgramDay: {
        dayIndex: currentProgramDay.dayIndex,
        stage: currentProgramDay.stage,
        estimatedMinutes: currentProgramDay.estimatedMinutes,
        title: summary.title,
        focus: summary.focus,
        summary: summary.summary,
        normalSignals: summary.normalSignals,
        getHelpSignals: summary.getHelpSignals,
        safetyNotes: summary.safetyNotes,
        personalizationFlags: summary.personalizationFlags,
        completedAt: currentProgramDay.completedAt,
        completionPercent: currentProgramDay.completionPercent,
      },
    },
    contentComplete,
  };
}

async function findLatestPaidPurchaseWithoutActiveProgram(
  userId: string
): Promise<{ purchaseId: string } | null> {
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      status: PurchaseStatus.PAID,
      OR: [
        { program: { is: null } },
        { program: { is: { status: { not: ProgramStatus.ACTIVE } } } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: { id: true },
  });

  return purchase ? { purchaseId: purchase.id } : null;
}

async function attemptMissingProgramRecovery(
  userId: string,
  purchaseId: string
): Promise<CurrentProgramEntry | null> {
  const preparedProgram = await prepareTemplateFirstProgramForUser(userId);

  if (!preparedProgram) {
    return null;
  }

  await prisma.$transaction(
    async (tx) => {
      await provisionProgramForPaidPurchase(tx, {
        userId,
        purchaseId,
        preparedProgram,
      });
    },
    { timeout: 30000 }
  );

  const reloaded = await loadActiveProgramEntry(userId);
  return reloaded?.entry ?? null;
}

export async function resolveCurrentProgramForUser(
  userId: string
): Promise<CurrentProgramState> {
  const activeProgram = await loadActiveProgramEntry(userId);

  if (activeProgram) {
    if (!activeProgram.contentComplete) {
      return {
        status: "missing_day_content",
        programId: activeProgram.entry.programId,
        currentDay: activeProgram.entry.currentDay,
      };
    }

    return { status: "ready", program: activeProgram.entry };
  }

  const paidPurchaseWithoutProgram =
    await findLatestPaidPurchaseWithoutActiveProgram(userId);

  if (!paidPurchaseWithoutProgram) {
    return { status: "no_purchase" };
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!recoveryProfile) {
    return {
      status: "missing_profile",
      purchaseId: paidPurchaseWithoutProgram.purchaseId,
    };
  }

  const recoveredProgram = await attemptMissingProgramRecovery(
    userId,
    paidPurchaseWithoutProgram.purchaseId
  );

  if (!recoveredProgram) {
    return {
      status: "missing_profile",
      purchaseId: paidPurchaseWithoutProgram.purchaseId,
    };
  }

  return { status: "missing_program_recovered", program: recoveredProgram };
}
