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
    exercises: DayExerciseCard[];
    completedAt: Date | null;
    completionPercent: number;
  };
}

export type ProgramDayEntry = CurrentProgramEntry["currentProgramDay"];

export interface DayExerciseCard {
  slug: string;
  title: string;
  durationLabel: string;
  instructions: string[];
  cautions: string[];
}

export type CurrentProgramState =
  | { status: "ready"; program: CurrentProgramEntry }
  | { status: "missing_program_recovered"; program: CurrentProgramEntry }
  | { status: "payment_pending" }
  | { status: "payment_failed" }
  | { status: "purchase_refunded" }
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
  exercises: DayExerciseCard[];
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
      exercises: [],
    };
  }

  const record = contentJson as Record<string, unknown>;

  return {
    title: readString(record.title),
    focus: readString(record.focus),
    summary: readString(record.summary),
    normalSignals: readStringArray(record.normalSignals),
    getHelpSignals: readStringArray(record.getHelpSignals),
    safetyNotes: readStringArray(record.safetyNotes),
    personalizationFlags: readStringArray(record.personalizationFlags),
    exercises: readExerciseCards(record.exercises),
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readExerciseCards(value: unknown): DayExerciseCard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const slug = readString(record.slug);
    const title = readString(record.title);

    if (!slug || !title) {
      return [];
    }

    const repetitions = readString(record.repetitions);
    const durationSeconds =
      typeof record.durationSeconds === "number" &&
      Number.isInteger(record.durationSeconds) &&
      record.durationSeconds > 0
        ? record.durationSeconds
        : null;
    const durationLabel = [
      repetitions,
      durationSeconds ? `${Math.ceil(durationSeconds / 60)} min` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return [
      {
        slug,
        title,
        durationLabel: durationLabel || "Gentle effort as tolerated",
        instructions: readStringArray(record.instructions),
        cautions: readStringArray(record.contraindications),
      },
    ];
  });
}

interface LoadedActiveProgram {
  entry: CurrentProgramEntry;
  contentComplete: boolean;
}

function buildEmptyProgramDay(dayIndex: number): ProgramDayEntry {
  return {
    dayIndex,
    stage: "",
    estimatedMinutes: 0,
    title: "",
    focus: "",
    summary: "",
    normalSignals: [],
    getHelpSignals: [],
    safetyNotes: [],
    personalizationFlags: [],
    exercises: [],
    completedAt: null,
    completionPercent: 0,
  };
}

function buildProgramDayEntry({
  dayIndex,
  stage,
  estimatedMinutes,
  contentJson,
  completedAt,
  completionPercent,
}: {
  dayIndex: number;
  stage: string;
  estimatedMinutes: number;
  contentJson: Prisma.JsonValue | null;
  completedAt: Date | null;
  completionPercent: number;
}): { entry: ProgramDayEntry; contentComplete: boolean } {
  const summary = readContentSummary(contentJson);
  const contentComplete = summary.title.length > 0 && summary.focus.length > 0;

  return {
    entry: {
      dayIndex,
      stage,
      estimatedMinutes,
      title: summary.title,
      focus: summary.focus,
      summary: summary.summary,
      normalSignals: summary.normalSignals,
      getHelpSignals: summary.getHelpSignals,
      safetyNotes: summary.safetyNotes,
      personalizationFlags: summary.personalizationFlags,
      exercises: summary.exercises,
      completedAt,
      completionPercent,
    },
    contentComplete,
  };
}

export async function loadProgramDayForProgram({
  programId,
  dayIndex,
}: {
  programId: string;
  dayIndex: number;
}): Promise<{ entry: ProgramDayEntry; contentComplete: boolean } | null> {
  const programDay = await prisma.programDay.findUnique({
    where: {
      programId_dayIndex: {
        programId,
        dayIndex,
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

  if (!programDay) {
    return null;
  }

  return buildProgramDayEntry(programDay);
}

async function loadActiveProgramEntry(
  userId: string
): Promise<LoadedActiveProgram | null> {
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
      templateVersion: true,
      status: true,
      currentDay: true,
    },
  });

  if (!program) {
    return null;
  }

  const currentDayIndex =
    program.status === ProgramStatus.COMPLETED
      ? totalProgramDays
      : clampDayIndex(program.currentDay);
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
        currentProgramDay: buildEmptyProgramDay(currentDayIndex),
      },
      contentComplete: false,
    };
  }

  const currentDay = buildProgramDayEntry(currentProgramDay);

  return {
    entry: {
      programId: program.id,
      templateVersion: program.templateVersion,
      status: program.status,
      currentDay: currentDayIndex,
      totalDays: totalProgramDays,
      currentProgramDay: currentDay.entry,
    },
    contentComplete: currentDay.contentComplete,
  };
}

async function findLatestPurchaseWithoutActiveProgram(
  userId: string
): Promise<{ purchaseId: string; status: PurchaseStatus } | null> {
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      OR: [
        { status: { in: [PurchaseStatus.PENDING, PurchaseStatus.FAILED, PurchaseStatus.REFUNDED] } },
        {
          status: PurchaseStatus.PAID,
          OR: [
            { program: { is: null } },
            { program: { is: { status: ProgramStatus.EXPIRED } } },
          ],
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: { id: true, status: true },
  });

  return purchase ? { purchaseId: purchase.id, status: purchase.status } : null;
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
      console.error("Missing current program day content", {
        userId,
        programId: activeProgram.entry.programId,
        currentDay: activeProgram.entry.currentDay,
      });

      return {
        status: "missing_day_content",
        programId: activeProgram.entry.programId,
        currentDay: activeProgram.entry.currentDay,
      };
    }

    return { status: "ready", program: activeProgram.entry };
  }

  const purchaseWithoutActiveProgram =
    await findLatestPurchaseWithoutActiveProgram(userId);

  if (!purchaseWithoutActiveProgram) {
    return { status: "no_purchase" };
  }

  if (purchaseWithoutActiveProgram.status === PurchaseStatus.PENDING) {
    return { status: "payment_pending" };
  }

  if (purchaseWithoutActiveProgram.status === PurchaseStatus.FAILED) {
    return { status: "payment_failed" };
  }

  if (purchaseWithoutActiveProgram.status === PurchaseStatus.REFUNDED) {
    return { status: "purchase_refunded" };
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!recoveryProfile) {
    return {
      status: "missing_profile",
      purchaseId: purchaseWithoutActiveProgram.purchaseId,
    };
  }

  const recoveredProgram = await attemptMissingProgramRecovery(
    userId,
    purchaseWithoutActiveProgram.purchaseId
  );

  if (!recoveredProgram) {
    return {
      status: "missing_profile",
      purchaseId: purchaseWithoutActiveProgram.purchaseId,
    };
  }

  return { status: "missing_program_recovered", program: recoveredProgram };
}
