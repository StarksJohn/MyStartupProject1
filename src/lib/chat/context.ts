import type { Prisma } from "@prisma/client";

import { captureError } from "@/lib/observability/server";
import { prisma } from "@/lib/prisma";
import { resolveCurrentProgramForUser } from "@/lib/program/current-program-service";

import type { ChatCitation, ChatContext } from "./types";

const maxQuestionLength = 800;
const maxCitations = 5;

export type ChatValidationResult =
  | { ok: true; question: string }
  | { ok: false; status: number; error: string; message: string };

function normalizeText(value: string) {
  return value.trim().toLowerCase();
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

function buildExcerpt(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function metadataMatches(metadata: Prisma.JsonValue, searchTerms: string[]) {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const metadataText = JSON.stringify(metadata).toLowerCase();
  return searchTerms.some((term) => term && metadataText.includes(term));
}

export async function parseChatRequest(request: Request): Promise<ChatValidationResult> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      status: 400,
      error: "invalid_json",
      message: "Please send a valid recovery question.",
    };
  }

  const rawQuestion =
    body && typeof body === "object" && "question" in body
      ? (body as { question?: unknown }).question
      : undefined;

  if (typeof rawQuestion !== "string") {
    return {
      ok: false,
      status: 400,
      error: "invalid_question",
      message: "Please send your recovery question as text.",
    };
  }

  const question = rawQuestion.trim();

  if (!question) {
    return {
      ok: false,
      status: 400,
      error: "empty_question",
      message: "Please enter a recovery question before sending.",
    };
  }

  if (question.length > maxQuestionLength) {
    return {
      ok: false,
      status: 400,
      error: "question_too_long",
      message: `Please keep your question under ${maxQuestionLength} characters.`,
    };
  }

  return { ok: true, question };
}

export async function buildChatContext(
  userId: string,
  options: { includeCitations?: boolean } = {}
): Promise<
  | { ok: true; context: ChatContext }
  | { ok: false; status: number; error: string; message: string }
> {
  const state = await resolveCurrentProgramForUser(userId);

  if (state.status === "no_purchase" || state.status === "missing_profile") {
    return {
      ok: false,
      status: 403,
      error: "chat_program_required",
      message: "Chat is available after your paid recovery program is ready.",
    };
  }

  if (state.status === "missing_day_content") {
    return {
      ok: false,
      status: 409,
      error: "chat_day_unavailable",
      message: "Today's recovery content is not available yet. Please retry from Progress.",
    };
  }

  const recoveryProfile = await prisma.recoveryProfile.findUnique({
    where: { userId },
    select: {
      bodyPart: true,
      subType: true,
    },
  });

  if (!recoveryProfile) {
    return {
      ok: false,
      status: 403,
      error: "chat_profile_required",
      message: "Chat needs a recovery profile before it can answer safely.",
    };
  }

  const program = state.program;
  const bodyPart = formatLabel(recoveryProfile.bodyPart) || "Recovery";
  const subType = formatLabel(recoveryProfile.subType) || null;
  const currentProgramDay = program.currentProgramDay;
  const stage = currentProgramDay.stage;
  const title = currentProgramDay.title || `Day ${program.currentDay}`;
  const focus = currentProgramDay.focus || "Today's recovery work";
  const safetyNotes = currentProgramDay.safetyNotes;
  const citations =
    options.includeCitations === false
      ? []
      : await retrieveCitations({
          bodyPart,
          subType,
          stage,
          focus,
          title,
        });

  return {
    ok: true,
    context: {
      userId,
      programId: program.programId,
      currentDay: program.currentDay,
      bodyPart,
      subType,
      dayTitle: title,
      dayFocus: focus,
      dayStage: stage,
      safetyNotes,
      citations,
    },
  };
}

async function retrieveCitations({
  bodyPart,
  subType,
  stage,
  focus,
  title,
}: {
  bodyPart: string;
  subType: string | null;
  stage: string;
  focus: string;
  title: string;
}): Promise<ChatCitation[]> {
  const searchTerms = [...new Set([bodyPart, subType ?? "", stage, focus, title]
    .flatMap((value) => normalizeText(value).split(/\s+/))
    .filter((value) => value.length >= 3))];

  if (searchTerms.length === 0) {
    return [];
  }

  try {
    const keywordChunks = await prisma.knowledgeChunk.findMany({
      take: 25,
      where: {
        keywords: { hasSome: searchTerms },
      },
      orderBy: { createdAt: "desc" },
      select: {
        content: true,
        keywords: true,
        metadataJson: true,
        document: {
          select: {
            title: true,
            slug: true,
            sourceType: true,
          },
        },
      },
    });

    const chunks =
      keywordChunks.length > 0
        ? keywordChunks
        : await prisma.knowledgeChunk.findMany({
            take: 100,
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              keywords: true,
              metadataJson: true,
              document: {
                select: {
                  title: true,
                  slug: true,
                  sourceType: true,
                },
              },
            },
          });

    return chunks
      .filter((chunk) => {
        const content = normalizeText(chunk.content);
        const keywordMatch = chunk.keywords.some((keyword) =>
          searchTerms.includes(normalizeText(keyword))
        );
        const contentMatch = searchTerms.some((term) => content.includes(term));
        const metaMatch = metadataMatches(chunk.metadataJson, searchTerms);
        return keywordMatch || contentMatch || metaMatch;
      })
      .slice(0, maxCitations)
      .map((chunk) => ({
        title: chunk.document.title,
        sourceType: String(chunk.document.sourceType),
        slug: chunk.document.slug,
        excerpt: buildExcerpt(chunk.content),
      }));
  } catch (error) {
    captureError(error, {
      flow: "rag_retrieval",
      operation: "retrieve_citations",
      status: "citations_unavailable",
      severity: "warning",
    });
    console.error("Failed to retrieve chat citations", { error });
    return [];
  }
}

export function buildFallbackCitation(context: ChatContext): ChatCitation {
  return {
    title: `${context.bodyPart} Day ${context.currentDay} recovery plan`,
    sourceType: "PROGRAM_DAY",
    slug: `program-day-${context.currentDay}`,
    excerpt: `${context.dayTitle}: ${context.dayFocus}`,
  };
}

export async function retrieveCitationsForContext(context: ChatContext) {
  return retrieveCitations({
    bodyPart: context.bodyPart,
    subType: context.subType,
    stage: context.dayStage,
    focus: context.dayFocus,
    title: context.dayTitle,
  });
}
