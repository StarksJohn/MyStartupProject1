"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
  refundHref?: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Who is this for?",
    answer:
      "Adults recovering from finger or metacarpal fractures around cast removal, after they have already received clinician care and were told movement can begin.",
  },
  {
    question: "Who is this not for?",
    answer:
      "This is not for emergencies, worsening symptoms, unassessed injuries, complex cases that need direct clinician guidance, or anyone who was told not to move yet.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Fracture Recovery Companion is a one-time $14.99 purchase for the 14-day companion. No subscription.",
  },
  {
    question: "What if it is not right for me?",
    answer:
      "If billing is pending, failed, or the product is not a fit, review the refund policy for the safe support path. The MVP uses a one-time purchase and refunds revoke paid access.",
    refundHref: "/legal/refund",
  },
] as const;

export function LandingFaq() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-3">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openQuestion === item.question;
        const answerId = `landing-faq-${item.question
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;

        return (
          <div key={item.question} className="rounded-xl border bg-card">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() =>
                setOpenQuestion(isOpen ? null : item.question)
              }
            >
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "text-lg leading-none text-muted-foreground transition-transform",
                  isOpen ? "rotate-45" : "rotate-0"
                )}
              >
                +
              </span>
            </button>
            <div
              id={answerId}
              hidden={!isOpen}
              className="border-t px-5 py-4 text-sm text-muted-foreground"
            >
              {item.answer}
              {item.refundHref ? (
                <Link
                  href={item.refundHref}
                  className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Read the refund policy
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
