import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/session";
import {
  buildCompletionReportForUser,
  completionReportFilename,
} from "@/lib/program/completion-report-service";

export const dynamic = "force-dynamic";

function statusCodeForReport(status: string) {
  switch (status) {
    case "not_completed":
      return 403;
    case "missing_content":
      return 409;
    default:
      return 500;
  }
}

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        status: "unauthenticated",
        message: "Please sign in before downloading your recovery summary.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const report = await buildCompletionReportForUser(session.user.id);

    if (report.status !== "ready") {
      console.error("Completion report unavailable", {
        userId: session.user.id,
        programId: report.programId,
        status: report.status,
      });

      return NextResponse.json(
        {
          status: report.status,
          message: report.message,
        },
        {
          status: statusCodeForReport(report.status),
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return new Response(report.html, {
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${completionReportFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate completion report", {
      userId: session.user.id,
      error,
    });

    return NextResponse.json(
      {
        status: "unavailable",
        message: "We could not generate your recovery summary right now. Please try again.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
