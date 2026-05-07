import { Prisma, ProgramStatus, PurchaseStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const totalProgramDays = 14;

export type CompleteProgramDayResult =
  | {
      status: "completed" | "already_completed";
      completedDay: number;
      currentDay: number;
      totalDays: typeof totalProgramDays;
      programStatus: ProgramStatus;
      completionPercent: 100;
      message: string;
    }
  | {
      status: "invalid_day" | "missing_program" | "missing_day_content" | "not_current_day";
      message: string;
    };

function parseCompletableDay(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= totalProgramDays;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProgramDayContentComplete(contentJson: Prisma.JsonValue) {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) {
    return false;
  }

  const record = contentJson as Record<string, unknown>;
  return readString(record.title).length > 0 && readString(record.focus).length > 0;
}

function successPayload({
  status,
  completedDay,
  currentDay,
  programStatus,
}: {
  status: "completed" | "already_completed";
  completedDay: number;
  currentDay: number;
  programStatus: ProgramStatus;
}): CompleteProgramDayResult {
  return {
    status,
    completedDay,
    currentDay,
    totalDays: totalProgramDays,
    programStatus,
    completionPercent: 100,
    message:
      status === "completed"
        ? "Day marked complete. Your program progress has been updated."
        : "This day was already complete. Your program progress is unchanged.",
  };
}

export async function completeProgramDayForUser({
  userId,
  requestedDay,
}: {
  userId: string;
  requestedDay: number;
}): Promise<CompleteProgramDayResult> {
  if (!parseCompletableDay(requestedDay)) {
    return {
      status: "invalid_day",
      message: "The requested day is outside the supported 14-day program.",
    };
  }

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
      status: true,
    },
  });

  if (!program) {
    return {
      status: "missing_program",
      message: "No active paid recovery program is available for this account.",
    };
  }

  const programDay = await prisma.programDay.findUnique({
    where: {
      programId_dayIndex: {
        programId: program.id,
        dayIndex: requestedDay,
      },
    },
    select: {
      dayIndex: true,
      contentJson: true,
      completedAt: true,
    },
  });

  if (!programDay || !isProgramDayContentComplete(programDay.contentJson)) {
    return {
      status: "missing_day_content",
      message: "This day's recovery content is not ready to complete.",
    };
  }

  if (programDay.completedAt && requestedDay <= program.currentDay) {
    return successPayload({
      status: "already_completed",
      completedDay: requestedDay,
      currentDay: program.currentDay,
      programStatus:
        program.status === ProgramStatus.COMPLETED
          ? ProgramStatus.COMPLETED
          : ProgramStatus.ACTIVE,
    });
  }

  if (program.status !== ProgramStatus.ACTIVE || requestedDay !== program.currentDay) {
    return {
      status: "not_current_day",
      message: "Only the current active day can be completed.",
    };
  }

  const completedAt = new Date();
  const nextCurrentDay =
    requestedDay >= totalProgramDays ? totalProgramDays : requestedDay + 1;
  const nextProgramStatus =
    requestedDay >= totalProgramDays ? ProgramStatus.COMPLETED : ProgramStatus.ACTIVE;

  await prisma.$transaction([
    prisma.programDay.update({
      where: {
        programId_dayIndex: {
          programId: program.id,
          dayIndex: requestedDay,
        },
      },
      data: {
        completedAt,
        completionPercent: 100,
      },
    }),
    prisma.program.update({
      where: { id: program.id },
      data: {
        currentDay: nextCurrentDay,
        status: nextProgramStatus,
      },
    }),
  ]);

  return successPayload({
    status: "completed",
    completedDay: requestedDay,
    currentDay: nextCurrentDay,
    programStatus: nextProgramStatus,
  });
}
