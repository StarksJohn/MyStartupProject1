"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/client";

const shareTitle = "Fracture Recovery Companion";
const shareText =
  "I finished a 14-day recovery companion. It is educational support, not medical advice.";

type ShareFeedback =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; url?: string };

function getPublicShareUrl() {
  return `${window.location.origin}/`;
}

async function copyPublicUrl(url: string) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(url);
  return true;
}

export function CompletionShareAction() {
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback | null>(null);

  async function handleShare() {
    const url = getPublicShareUrl();
    setIsSharing(true);
    setFeedback(null);

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        trackEvent("share_click", {
          surface: "completion",
          method: "native",
          outcome: "success",
        });
        setFeedback({ kind: "success", message: "Share link ready." });
        return;
      }

      const copied = await copyPublicUrl(url);
      trackEvent("share_click", {
        surface: "completion",
        method: copied ? "clipboard" : "manual",
        outcome: copied ? "success" : "failure",
      });
      setFeedback(
        copied
          ? { kind: "success", message: "Product link copied." }
          : {
              kind: "error",
              message: "We could not copy automatically. You can copy the product link instead.",
              url,
            }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        trackEvent("share_click", {
          surface: "completion",
          method: "native",
          outcome: "cancelled",
        });
        return;
      }

      try {
        await copyPublicUrl(url);
        trackEvent("share_click", {
          surface: "completion",
          method: "clipboard",
          outcome: "fallback",
        });
        setFeedback({ kind: "success", message: "Product link copied." });
      } catch {
        trackEvent("share_click", {
          surface: "completion",
          method: "manual",
          outcome: "failure",
        });
        setFeedback({
          kind: "error",
          message: "We could not open sharing. You can copy the product link instead.",
          url,
        });
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={() => void handleShare()}
        disabled={isSharing}
        data-testid="completion-share-action"
      >
        {isSharing ? "Preparing share..." : "Share product link"}
      </Button>

      {feedback ? (
        <p
          data-testid="completion-share-feedback"
          role={feedback.kind === "error" ? "alert" : "status"}
          className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground"
        >
          {feedback.message}
          {feedback.kind === "error" && feedback.url ? (
            <>
              {" "}
              <span className="font-medium text-foreground">{feedback.url}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
