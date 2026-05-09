import { ProgramStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

export const completionReportFilename = "recovery-summary-report.html";

export type CompletionReportResult =
  | {
      status: "ready";
      filename: typeof completionReportFilename;
      contentType: "text/html; charset=utf-8";
      html: string;
      programId: string;
    }
  | {
      status: "not_completed" | "missing_content" | "unavailable";
      message: string;
      programId?: string;
    };

const safetyBoundary =
  "This summary is educational support only. It is not a diagnosis, treatment plan, prognosis, or medical clearance, and it does not replace your clinician's guidance.";

const dangerSignalGuidance =
  "Contact a clinician promptly for severe pain, numbness, color change, fever, pus, sudden swelling, inability to move, or symptoms that are rapidly worsening.";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return value.toISOString().slice(0, 10);
}

function renderRow(label: string, value: string) {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function renderParagraph(value: string) {
  return `<p>${escapeHtml(value)}</p>`;
}

export async function buildCompletionReportForUser(
  userId: string
): Promise<CompletionReportResult> {
  const state = await resolveCurrentProgramForUser(userId);

  if (state.status === "missing_day_content") {
    return {
      status: "missing_content",
      programId: state.programId,
      message:
        "The completed program content is not ready for a safe downloadable summary.",
    };
  }

  if (state.status !== "ready" || state.program.status !== ProgramStatus.COMPLETED) {
    return {
      status: "not_completed",
      message: "A completed paid recovery program is required before downloading a report.",
    };
  }

  const { program } = state;
  const day14 = program.currentProgramDay;

  if (day14.dayIndex !== program.totalDays || !day14.title || !day14.focus) {
    return {
      status: "missing_content",
      programId: program.programId,
      message:
        "The final day content is not ready for a safe downloadable summary.",
    };
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId },
    select: {
      bodyPart: true,
      subType: true,
    },
  });
  const focusArea =
    [formatLabel(recoveryProfile?.bodyPart), formatLabel(recoveryProfile?.subType)]
      .filter(Boolean)
      .join(" - ") || "Recovery";
  const completedAt = formatDate(day14.completedAt);
  const generatedAt = new Date().toISOString().slice(0, 10);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>14-day recovery companion summary</title>
  <style>
    body { color: #111827; font-family: Arial, sans-serif; line-height: 1.6; margin: 32px; max-width: 760px; }
    h1, h2 { line-height: 1.25; }
    .notice { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
    table { border-collapse: collapse; margin: 16px 0; width: 100%; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
    th { width: 36%; }
  </style>
</head>
<body>
  <h1>14-day recovery companion summary</h1>
  <p>This downloadable summary is for your personal reference.</p>

  <section class="notice">
    ${renderParagraph(safetyBoundary)}
    ${renderParagraph(dangerSignalGuidance)}
  </section>

  <h2>Completion summary</h2>
  <table>
    <tbody>
      ${renderRow("Status", "Completed")}
      ${renderRow("Progress", `${program.currentDay} of ${program.totalDays} days`)}
      ${renderRow("Focus area", focusArea)}
      ${renderRow("Template version", program.templateVersion)}
      ${renderRow("Completion date", completedAt)}
      ${renderRow("Report generated", generatedAt)}
    </tbody>
  </table>

  <h2>Final day review</h2>
  <table>
    <tbody>
      ${renderRow("Day", `Day ${day14.dayIndex}`)}
      ${renderRow("Title", day14.title)}
      ${renderRow("Focus", day14.focus)}
      ${day14.summary ? renderRow("Summary", day14.summary) : ""}
    </tbody>
  </table>

  <h2>Safety reminder</h2>
  ${renderParagraph(
    day14.safetyNotes[0] ??
      "Keep following clinician-approved guidance and stop if symptoms worsen."
  )}
  ${renderParagraph(dangerSignalGuidance)}
</body>
</html>`;

  return {
    status: "ready",
    filename: completionReportFilename,
    contentType: "text/html; charset=utf-8",
    html,
    programId: program.programId,
  };
}
