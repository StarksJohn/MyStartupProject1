import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/session";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const state = await resolveCurrentProgramForUser(session.user.id);

    if (state.status === "ready" || state.status === "missing_program_recovered") {
      return NextResponse.json({
        status: state.status,
        program: state.program,
      });
    }

    if (state.status === "missing_profile") {
      return NextResponse.json(
        {
          status: state.status,
          redirectTo: "/onboarding",
        },
        { status: 200 }
      );
    }

    if (state.status === "missing_day_content") {
      return NextResponse.json(
        {
          status: state.status,
          programId: state.programId,
          currentDay: state.currentDay,
          redirectTo: "/progress",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "no_purchase",
        redirectTo: "/onboarding",
      },
      { status: 200 }
    );
  } catch (error) {
    const { captureError } = await import("@/lib/observability/server");
    captureError(error, {
      flow: "auth_session",
      operation: "resolve_current_program",
      route: "/api/program/current",
      status: "current_program_unavailable",
    });
    console.error("Failed to resolve current program", {
      userId: session.user.id,
      error,
    });

    return NextResponse.json(
      { error: "current_program_unavailable" },
      { status: 500 }
    );
  }
}
