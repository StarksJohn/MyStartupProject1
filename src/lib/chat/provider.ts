import type { ChatCitation, ChatContext } from "./types";

const primaryProviderName = "gemini";
const primaryModelName = "gemini-1.5-flash";
const fallbackProviderName = "groq";
const fallbackModelName = "llama-3.1-8b-instant";

type ChatProviderTestMode = "mock" | "error" | "primary_error" | "all_error";

export interface ChatAnswerResult {
  answer: string;
  provider: string;
  model: string;
  usedFallback: boolean;
}

function buildCitationSentence(citations: ChatCitation[]) {
  if (citations.length === 0) {
    return "I could not find a matching external source in the current recovery library, so use this as general educational guidance only.";
  }

  return `I grounded this in ${citations
    .slice(0, 2)
    .map((citation) => citation.title)
    .join(" and ")}.`;
}

function buildRecoveryPrompt({
  question,
  context,
  citations,
}: {
  question: string;
  context: ChatContext;
  citations: ChatCitation[];
}) {
  return [
    "You are not a doctor.",
    "Do not diagnose.",
    "Do not override physician instructions.",
    "If symptoms suggest danger, instruct user to contact a clinician immediately.",
    `Recovery context: ${context.bodyPart}${context.subType ? ` - ${context.subType}` : ""}, Day ${context.currentDay}, stage ${context.dayStage}.`,
    `Today's focus: ${context.dayFocus}.`,
    `Trusted sources: ${citations.map((citation) => `${citation.title}: ${citation.excerpt}`).join("\n")}`,
    `User question: ${question}`,
  ].join("\n");
}

function generateDeterministicAnswer({
  question,
  context,
  citations,
}: {
  question: string;
  context: ChatContext;
  citations: ChatCitation[];
}) {
  const safetyNote =
    context.safetyNotes[0] ??
    "Stop and contact a clinician if symptoms feel severe, rapidly worse, or unusual for you.";

  return [
    `For Day ${context.currentDay}, your focus is ${context.dayFocus.toLowerCase()}.`,
    `For your question, "${question}", keep this educational and non-diagnostic: compare how you feel with the plan guidance, stay within comfortable movement, and do not override clinician instructions.`,
    safetyNote,
    buildCitationSentence(citations),
  ].join(" ");
}

async function generateGeminiAnswer(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${primaryModelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!answer) {
    throw new Error("Gemini response did not include answer text");
  }

  return answer;
}

async function generateGroqAnswer(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: fallbackModelName,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("Groq response did not include answer text");
  }

  return answer;
}

export async function generateChatAnswer({
  question,
  context,
  citations,
  testMode,
}: {
  question: string;
  context: ChatContext;
  citations: ChatCitation[];
  testMode?: ChatProviderTestMode | null;
}): Promise<ChatAnswerResult> {
  const resolvedTestMode =
    process.env.CHAT_PROVIDER_TEST_MODE === "error"
      ? "error"
      : process.env.CHAT_PROVIDER_TEST_MODE === "mock"
        ? "mock"
        : testMode;
  const deterministicAnswer = generateDeterministicAnswer({ question, context, citations });
  const shouldUseDeterministicAnswer =
    process.env.NODE_ENV !== "production" || resolvedTestMode === "mock";

  if (resolvedTestMode === "error" || resolvedTestMode === "all_error") {
    throw new Error("Forced chat provider failure");
  }

  if (shouldUseDeterministicAnswer && resolvedTestMode !== "primary_error") {
    return {
      provider: "mock",
      model: "deterministic-recovery-coach",
      answer: deterministicAnswer,
      usedFallback: false,
    };
  }

  const prompt = buildRecoveryPrompt({ question, context, citations });

  try {
    if (resolvedTestMode === "primary_error") {
      throw new Error("Forced primary provider failure");
    }

    const answer = await generateGeminiAnswer(prompt);

    return {
      answer,
      provider: primaryProviderName,
      model: primaryModelName,
      usedFallback: false,
    };
  } catch (primaryError) {
    console.error("Primary chat provider failed; trying fallback", {
      provider: primaryProviderName,
      error: primaryError,
    });
  }

  if (shouldUseDeterministicAnswer) {
    return {
      provider: fallbackProviderName,
      model: "deterministic-groq-fallback",
      answer: deterministicAnswer,
      usedFallback: true,
    };
  }

  const answer = await generateGroqAnswer(prompt);

  return {
    answer,
    provider: fallbackProviderName,
    model: fallbackModelName,
    usedFallback: true,
  };
}
