export interface ChatSafetyEscalation {
  escalated: true;
  matchedTerms: string[];
  message: string;
}

export type ChatSafetyResult = ChatSafetyEscalation | { escalated: false };

const dangerTerms = [
  "severe pain",
  "purple",
  "blue",
  "numb",
  "fever",
  "pus",
  "cannot move",
  "sudden swelling",
] as const;

const dangerPatterns: Record<(typeof dangerTerms)[number], RegExp> = {
  "severe pain": /\bsevere\s+pain\b/,
  purple: /\bpurple\b/,
  blue: /\bblue\b/,
  numb: /\bnumb(ness)?\b/,
  fever: /\bfever\b/,
  pus: /\bpus\b/,
  "cannot move": /\bcannot\s+move\b/,
  "sudden swelling": /\bsudden\s+swelling\b/,
};

const negatedDangerPatterns: Record<(typeof dangerTerms)[number], RegExp[]> = {
  "severe pain": [/\bno\s+severe\s+pain\b/, /\bnot\s+severe\s+pain\b/],
  purple: [/\bno\s+purple\b/, /\bnot\s+purple\b/],
  blue: [/\bno\s+blue\b/, /\bnot\s+blue\b/],
  numb: [/\bno\s+numb(ness)?\b/, /\bnot\s+numb(ness)?\b/],
  fever: [/\bno\s+fever\b/, /\bnot\s+fever\b/],
  pus: [/\bno\s+pus\b/, /\bnot\s+pus\b/],
  "cannot move": [/\bcan\s+move\b/],
  "sudden swelling": [/\bno\s+sudden\s+swelling\b/, /\bnot\s+sudden\s+swelling\b/],
};

export const escalatedSafetyMessage =
  "This may be a warning sign. Please contact your clinician now or seek urgent medical help if symptoms are severe, rapidly worsening, or you feel unsafe. I cannot diagnose this or guide exercises for these symptoms.";

function normalizeForSafety(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function isNegatedTerm(normalizedQuestion: string, term: string) {
  return negatedDangerPatterns[term as (typeof dangerTerms)[number]].some((pattern) =>
    pattern.test(normalizedQuestion)
  );
}

export function evaluateChatSafety(question: string): ChatSafetyResult {
  const normalizedQuestion = normalizeForSafety(question);
  const matchedTerms = dangerTerms.filter((term) => {
    if (!dangerPatterns[term].test(normalizedQuestion)) {
      return false;
    }

    return !isNegatedTerm(normalizedQuestion, term);
  });

  if (matchedTerms.length === 0) {
    return { escalated: false };
  }

  return {
    escalated: true,
    matchedTerms: [...matchedTerms],
    message: escalatedSafetyMessage,
  };
}
