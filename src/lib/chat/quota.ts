import { ChatMessageRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const DAILY_CHAT_QUOTA_LIMIT = 20;

interface ChatQuotaState {
  limit: number;
  remaining: number;
  used: number;
  resetAt: string;
  key: string;
}

function getUtcDayBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function formatUtcDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getChatQuotaKey(userId: string, now = new Date()) {
  return `chat:${userId}:${formatUtcDateKey(now)}`;
}

function buildQuotaState({
  userId,
  used,
  resetAt,
  now,
}: {
  userId: string;
  used: number;
  resetAt: string;
  now: Date;
}): ChatQuotaState {
  return {
    limit: DAILY_CHAT_QUOTA_LIMIT,
    used,
    remaining: Math.max(DAILY_CHAT_QUOTA_LIMIT - used, 0),
    resetAt,
    key: getChatQuotaKey(userId, now),
  };
}

function isUpstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function shouldUseUpstashQuota() {
  return process.env.NODE_ENV === "production" && isUpstashConfigured();
}

async function upstashCommand<T>(command: unknown[]): Promise<T> {
  const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command]),
  });

  if (!response.ok) {
    throw new Error(`Upstash quota command failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: T; error?: string }>;
  const first = payload[0];

  if (!first || first.error) {
    throw new Error(first?.error ?? "Upstash quota command returned no result");
  }

  return first.result as T;
}

async function getDatabaseQuotaUsed(userId: string, now = new Date()) {
  const { start, end } = getUtcDayBounds(now);
  return prisma.chatMessage.count({
    where: {
      role: ChatMessageRole.ASSISTANT,
      escalated: false,
      createdAt: {
        gte: start,
        lt: end,
      },
      conversation: {
        userId,
      },
    },
  });
}

async function getDatabaseQuotaState(userId: string, now = new Date()): Promise<ChatQuotaState> {
  const { end } = getUtcDayBounds(now);
  const used = await getDatabaseQuotaUsed(userId, now);

  return buildQuotaState({
    userId,
    used,
    resetAt: end.toISOString(),
    now,
  });
}

async function getUpstashQuotaState(userId: string, now = new Date()): Promise<ChatQuotaState> {
  const key = getChatQuotaKey(userId, now);
  const upstashUsed = Number((await upstashCommand<string | number | null>(["GET", key])) ?? 0);
  const databaseUsed = await getDatabaseQuotaUsed(userId, now);
  const used = Math.max(upstashUsed, databaseUsed);
  const { end } = getUtcDayBounds(now);

  return buildQuotaState({
    userId,
    used,
    resetAt: end.toISOString(),
    now,
  });
}

export async function getChatQuotaState(userId: string, now = new Date()) {
  if (shouldUseUpstashQuota()) {
    try {
      return await getUpstashQuotaState(userId, now);
    } catch (error) {
      console.error("Failed to read chat quota from Upstash", { userId, error });
    }
  }

  return getDatabaseQuotaState(userId, now);
}

export async function consumeChatQuota(userId: string, now = new Date()) {
  if (!shouldUseUpstashQuota()) {
    return;
  }

  const key = getChatQuotaKey(userId, now);
  const { end } = getUtcDayBounds(now);
  const expiresInSeconds = Math.max(Math.ceil((end.getTime() - now.getTime()) / 1000), 1);

  await upstashCommand(["INCR", key]);
  await upstashCommand(["EXPIRE", key, expiresInSeconds]);
}
