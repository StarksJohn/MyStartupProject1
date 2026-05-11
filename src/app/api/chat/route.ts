import { ChatMessageRole, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildChatContext,
  buildFallbackCitation,
  parseChatRequest,
  retrieveCitationsForContext,
} from "@/lib/chat/context";
import { generateChatAnswer } from "@/lib/chat/provider";
import { consumeChatQuota, getChatQuotaState } from "@/lib/chat/quota";
import { evaluateChatSafety } from "@/lib/chat/safety";
import { createChatStream } from "@/lib/chat/stream";
import type { ChatStreamEvent } from "@/lib/chat/types";
import { getAuthSession } from "@/lib/auth/session";
import { captureError } from "@/lib/observability/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

function splitAnswer(answer: string) {
  return answer.match(/.{1,80}(\s|$)/g)?.map((part) => part.trim()).filter(Boolean) ?? [answer];
}

function readProviderTestMode(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const mode = request.headers.get("x-chat-provider-test-mode");

  if (mode === "mock" || mode === "error" || mode === "primary_error" || mode === "all_error") {
    return mode;
  }

  return null;
}

async function getOrCreateActiveConversation({
  userId,
  programId,
}: {
  userId: string;
  programId: string;
}) {
  return (
    (await prisma.chatConversation.findFirst({
      where: {
        userId,
        programId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    })) ??
    (await prisma.chatConversation.create({
      data: {
        userId,
        programId,
      },
    }))
  );
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return jsonError("unauthenticated", "Please sign in before using recovery chat.", 401);
  }

  const parsed = await parseChatRequest(request);

  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.message, parsed.status);
  }

  const contextResult = await buildChatContext(session.user.id, {
    includeCitations: false,
  });

  if (!contextResult.ok) {
    return jsonError(contextResult.error, contextResult.message, contextResult.status);
  }

  const context = contextResult.context;
  const safetyResult = evaluateChatSafety(parsed.question);

  if (safetyResult.escalated) {
    const events: ChatStreamEvent[] = [
      { type: "user", content: parsed.question },
      { type: "status", message: "Checking safety signals..." },
      {
        type: "escalation",
        message: safetyResult.message,
        matchedTerms: safetyResult.matchedTerms,
      },
      { type: "done" },
    ];

    return new Response(
      createChatStream({
        events,
        beforeDone: async () => {
          const conversation = await getOrCreateActiveConversation({
            userId: context.userId,
            programId: context.programId,
          });

          await prisma.$transaction([
            prisma.chatMessage.create({
              data: {
                conversationId: conversation.id,
                role: ChatMessageRole.USER,
                content: parsed.question,
                escalated: false,
              },
            }),
            prisma.chatMessage.create({
              data: {
                conversationId: conversation.id,
                role: ChatMessageRole.ASSISTANT,
                content: safetyResult.message,
                provider: "local-safety",
                model: "deterministic-danger-keywords",
                escalated: true,
              },
            }),
          ]);
        },
      }),
      {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      }
    );
  }

  const quotaState = await getChatQuotaState(context.userId);

  if (quotaState.remaining <= 0) {
    const events: ChatStreamEvent[] = [
      { type: "user", content: parsed.question },
      {
        type: "quota_exceeded",
        message:
          "Today's AI question quota is used up. You can still review today's plan and safety guidance.",
        quotaRemaining: 0,
        resetAt: quotaState.resetAt,
      },
      { type: "done" },
    ];

    return new Response(createChatStream({ events }), {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const retrievedCitations = await retrieveCitationsForContext(context);
  const citations =
    retrievedCitations.length > 0 ? retrievedCitations : [buildFallbackCitation(context)];

  let answerResult: Awaited<ReturnType<typeof generateChatAnswer>>;

  try {
    answerResult = await generateChatAnswer({
      question: parsed.question,
      context,
      citations,
      testMode: readProviderTestMode(request),
    });
  } catch (error) {
    captureError(error, {
      flow: "chat",
      operation: "generate_answer",
      route: "/api/chat",
      status: "chat_generation_failed",
    });
    console.error("Failed to generate chat answer", {
      userId: session.user.id,
      programId: context.programId,
      providerError: error instanceof Error ? error.message : "unknown",
    });

    return jsonError(
      "chat_generation_failed",
      "We could not answer right now. Please retry in a moment.",
      502
    );
  }

  const events: ChatStreamEvent[] = [
    { type: "user", content: parsed.question },
    { type: "status", message: "Grounding your answer in today's recovery context..." },
    ...(answerResult.usedFallback
      ? [
          {
            type: "provider_fallback" as const,
            provider: answerResult.provider,
            message: "We used a backup AI provider to complete this answer.",
          },
        ]
      : []),
    ...splitAnswer(answerResult.answer).map((content) => ({ type: "token" as const, content })),
    { type: "citations", citations },
    { type: "done" },
  ];

  return new Response(
    createChatStream({
      events,
      beforeDone: async () => {
        const conversation = await getOrCreateActiveConversation({
          userId: context.userId,
          programId: context.programId,
        });

        await prisma.$transaction([
          prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: ChatMessageRole.USER,
              content: parsed.question,
              escalated: false,
            },
          }),
          prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: ChatMessageRole.ASSISTANT,
              content: answerResult.answer,
              citationsJson: citations as unknown as Prisma.InputJsonValue,
              provider: answerResult.provider,
              model: answerResult.model,
              escalated: false,
            },
          }),
        ]);

        try {
          await consumeChatQuota(context.userId);
        } catch (error) {
          captureError(error, {
            flow: "chat_quota",
            operation: "consume_quota",
            route: "/api/chat",
            status: "quota_consume_failed",
            severity: "warning",
          });
          console.error("Failed to consume chat quota", {
            userId: context.userId,
            quotaKey: quotaState.key,
            error,
          });
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    }
  );
}
