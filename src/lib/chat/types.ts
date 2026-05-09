export interface ChatCitation {
  title: string;
  sourceType: string;
  slug: string;
  excerpt: string;
}

export type ChatStreamEvent =
  | { type: "user"; content: string }
  | { type: "status"; message: string }
  | { type: "token"; content: string }
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "escalation"; message: string; matchedTerms: string[] }
  | { type: "quota_exceeded"; message: string; quotaRemaining: number; resetAt: string }
  | { type: "provider_fallback"; provider: string; message: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface ChatContext {
  userId: string;
  programId: string;
  currentDay: number;
  bodyPart: string;
  subType: string | null;
  dayTitle: string;
  dayFocus: string;
  dayStage: string;
  safetyNotes: string[];
  citations: ChatCitation[];
}
