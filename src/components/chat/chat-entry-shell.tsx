"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { evaluateChatSafety } from "@/lib/chat/safety";

interface ChatCitation {
  title: string;
  sourceType: string;
  slug: string;
  excerpt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatEscalationState {
  message: string;
  matchedTerms: string[];
}

interface ChatQuotaExceededState {
  message: string;
  resetAt: string;
}

interface ChatEntryShellProps {
  bodyPartLabel: string;
  subTypeLabel: string;
  currentDay: number;
  totalDays: number;
  quotaRemaining: number;
  suggestedPrompts: string[];
}

export function ChatEntryShell({
  bodyPartLabel,
  subTypeLabel,
  currentDay,
  totalDays,
  quotaRemaining,
  suggestedPrompts,
}: ChatEntryShellProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [citations, setCitations] = useState<ChatCitation[]>([]);
  const [escalation, setEscalation] = useState<ChatEscalationState | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState<ChatQuotaExceededState | null>(
    quotaRemaining <= 0
      ? {
          message:
            "Today's AI question quota is used up. You can still review today's plan and safety guidance.",
          resetAt: "",
        }
      : null
  );
  const [remainingQuota, setRemainingQuota] = useState(quotaRemaining);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    const question = draft.trim();

    if (!question || isAnswering) {
      return;
    }

    setErrorMessage("");
    setCitations([]);
    setEscalation(null);
    setFallbackNotice("");

    if (quotaExceeded && !evaluateChatSafety(question).escalated) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", content: question },
        { id: crypto.randomUUID(), role: "assistant", content: quotaExceeded.message },
      ]);
      setDraft("");
      return;
    }

    setDraft("");
    setIsAnswering(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: question },
      { id: crypto.randomUUID(), role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "We could not answer right now. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedNormalAnswer = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const event = JSON.parse(line) as
            | { type: "token"; content: string }
            | { type: "citations"; citations: ChatCitation[] }
            | { type: "escalation"; message: string; matchedTerms: string[] }
            | { type: "quota_exceeded"; message: string; quotaRemaining: number; resetAt: string }
            | { type: "provider_fallback"; provider: string; message: string }
            | { type: "error"; message: string }
            | { type: "done" }
            | { type: "status"; message: string }
            | { type: "user"; content: string };

          if (event.type === "token") {
            receivedNormalAnswer = true;
            setMessages((current) => {
              const next = [...current];
              let assistantIndex = -1;

              for (let index = next.length - 1; index >= 0; index -= 1) {
                if (next[index].role === "assistant") {
                  assistantIndex = index;
                  break;
                }
              }

              if (assistantIndex >= 0) {
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  content: `${next[assistantIndex].content}${next[assistantIndex].content ? " " : ""}${event.content}`,
                };
              }

              return next;
            });
          }

          if (event.type === "citations") {
            setCitations(event.citations);
          }

          if (event.type === "escalation") {
            setEscalation({
              message: event.message,
              matchedTerms: event.matchedTerms,
            });
            setMessages((current) => {
              const next = [...current];
              let assistantIndex = -1;

              for (let index = next.length - 1; index >= 0; index -= 1) {
                if (next[index].role === "assistant") {
                  assistantIndex = index;
                  break;
                }
              }

              if (assistantIndex >= 0) {
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  content: event.message,
                };
              }

              return next;
            });
          }

          if (event.type === "quota_exceeded") {
            setQuotaExceeded({
              message: event.message,
              resetAt: event.resetAt,
            });
            setRemainingQuota(event.quotaRemaining);
            setMessages((current) => {
              const next = [...current];
              let assistantIndex = -1;

              for (let index = next.length - 1; index >= 0; index -= 1) {
                if (next[index].role === "assistant") {
                  assistantIndex = index;
                  break;
                }
              }

              if (assistantIndex >= 0) {
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  content: event.message,
                };
              }

              return next;
            });
          }

          if (event.type === "provider_fallback") {
            setFallbackNotice(event.message);
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }

          if (event.type === "done" && receivedNormalAnswer) {
            setRemainingQuota((current) => Math.max(current - 1, 0));
          }
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not answer right now.");
    } finally {
      setIsAnswering(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <section
        data-testid="chat-context-header"
        className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recovery Chat
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask about today&apos;s recovery
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Educational recovery support only. This chat does not diagnose,
          replace clinician instructions, or handle urgent symptoms.
        </p>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Body part
            </div>
            <div className="mt-1 font-medium">
              {bodyPartLabel}
              {subTypeLabel ? ` - ${subTypeLabel}` : ""}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Current day
            </div>
            <div className="mt-1 font-medium">
              Day {currentDay} of {totalDays}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Daily quota
            </div>
            <div className="mt-1 font-medium">
              {remainingQuota} questions left today
            </div>
          </div>
        </div>
      </section>

      <section
        data-testid="chat-suggested-prompts"
        className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Suggested Prompts
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Start with a focused question
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick one to fill the input. You stay in control before anything is
          sent.
        </p>
        <div className="mt-5 grid gap-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              data-testid="chat-suggested-prompt"
              onClick={() => setDraft(prompt)}
              className="rounded-xl border bg-muted/20 p-4 text-left text-sm font-medium transition hover:bg-muted/40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section
        data-testid={messages.length === 0 ? "chat-stream-fresh" : "chat-stream"}
        className="rounded-2xl border border-dashed bg-muted/20 p-5 shadow-xs sm:p-8"
      >
        {messages.length === 0 ? (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">
              No messages yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Ask a focused recovery question. Answers stream here with source
              references when available.
            </p>
          </>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                data-testid={`chat-message-${message.role}`}
                className="rounded-xl border bg-card p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {message.role === "user" ? "You" : "Recovery Coach"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {message.content || "Answering..."}
                </p>
              </article>
            ))}
            {isAnswering ? (
              <p data-testid="chat-answering-state" className="text-sm text-muted-foreground">
                Streaming a grounded recovery answer...
              </p>
            ) : null}
          </div>
        )}

        {escalation ? (
          <div
            role="alert"
            aria-labelledby="chat-escalation-title"
            data-testid="chat-escalation-warning"
            className="mt-5 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm"
          >
            <h3 id="chat-escalation-title" className="font-semibold">
              Warning sign detected
            </h3>
            <p className="mt-2 leading-6">{escalation.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Matched safety signal: {escalation.matchedTerms.join(", ")}
            </p>
          </div>
        ) : null}

        {quotaExceeded ? (
          <div
            role="status"
            data-testid="chat-quota-exceeded"
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <h3 className="font-semibold">Today&apos;s AI quota is used up</h3>
            <p className="mt-2 leading-6">{quotaExceeded.message}</p>
            <p className="mt-2 text-xs">
              Ordinary AI answers are paused, but warning-sign messages can still be checked.
              You can also return to today&apos;s recovery plan or review the safety guidance above.
            </p>
          </div>
        ) : null}

        {fallbackNotice ? (
          <div
            role="status"
            data-testid="chat-provider-fallback"
            className="mt-5 rounded-xl border bg-card p-4 text-sm text-muted-foreground"
          >
            {fallbackNotice}
          </div>
        ) : null}

        {citations.length > 0 ? (
          <div data-testid="chat-citations" className="mt-5 rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Sources</h3>
            <div className="mt-3 space-y-3">
              {citations.map((citation) => (
                <div key={`${citation.sourceType}-${citation.slug}`}>
                  <p className="text-sm font-medium">{citation.title}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {citation.sourceType}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{citation.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            data-testid="chat-error-state"
            className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            {errorMessage}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <label
          htmlFor="chat-input"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Input Area
        </label>
        <textarea
          id="chat-input"
          data-testid="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="Type a focused recovery question..."
          className="mt-3 w-full rounded-xl border bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Educational support only. This chat does not diagnose or replace
          clinician instructions.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            disabled={!draft.trim() || isAnswering}
            data-testid="chat-send"
            onClick={handleSubmit}
          >
            {isAnswering ? "Answering..." : "Send"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/day/${currentDay}`}>Back to today</Link>
          </Button>
        </div>
      </section>
    </section>
  );
}
