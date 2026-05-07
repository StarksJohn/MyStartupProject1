import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/session";
import { completeProgramDayForUser } from "@/lib/program/day-completion-service";

export const dynamic = "force-dynamic";

interface CompleteDayRouteProps {
  params: Promise<{ day: string }>;
}

function parseDayParam(rawDay: string) {
  if (!/^\d+$/.test(rawDay)) {
    return null;
  }

  const parsed = Number.parseInt(rawDay, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function statusCodeForResult(status: string) {
  switch (status) {
    case "invalid_day":
      return 400;
    case "not_current_day":
      return 409;
    case "missing_program":
    case "missing_day_content":
      return 404;
    default:
      return 200;
  }
}

export async function POST(_request: Request, { params }: CompleteDayRouteProps) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        status: "unauthenticated",
        message: "Please sign in before completing a recovery day.",
      },
      { status: 401 }
    );
  }

  const { day: rawDay } = await params;
  const requestedDay = parseDayParam(rawDay);

  if (requestedDay === null) {
    return NextResponse.json(
      {
        status: "invalid_day",
        message: "The requested day is outside the supported 14-day program.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await completeProgramDayForUser({
      userId: session.user.id,
      requestedDay,
    });

    return NextResponse.json(result, {
      status: statusCodeForResult(result.status),
    });
  } catch (error) {
    console.error("Failed to complete program day", {
      userId: session.user.id,
      requestedDay,
      error,
    });

    return NextResponse.json(
      {
        status: "completion_unavailable",
        message: "We could not complete this day right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
