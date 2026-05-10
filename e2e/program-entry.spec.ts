import { expect, test, type Page } from "@playwright/test";
import {
  Prisma,
  ChatMessageRole,
  PrismaClient,
  KnowledgeSourceType,
  ProgramStatus,
  PurchaseStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const createdUserIds = new Set<string>();
const createdKnowledgeDocumentIds = new Set<string>();

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDevUserId(email: string) {
  return `dev-${Buffer.from(email).toString("base64url").slice(0, 24)}`;
}

interface SeededProgramOptions {
  withProfile?: boolean;
  withProgram?: boolean;
  currentDay?: number;
  programStatus?: ProgramStatus;
  programDayContent?: Prisma.InputJsonValue | null;
}

async function seedDevUser(email: string) {
  const userId = createDevUserId(email);
  createdUserIds.add(userId);

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });

  return userId;
}

async function seedRecoveryProfile(userId: string) {
  await prisma.recoveryProfile.upsert({
    where: { userId },
    create: {
      userId,
      bodyPart: "finger",
      subType: "proximal phalanx stiffness",
      castRemovedAt: new Date(),
      hasHardware: "no",
      referredToPt: "not_sure",
      painLevel: 3,
      dominantHandAffected: false,
      jobType: "desk",
      riskFlagsJson: {},
    },
    update: {
      bodyPart: "finger",
      subType: "proximal phalanx stiffness",
      castRemovedAt: new Date(),
      hasHardware: "no",
      referredToPt: "not_sure",
      painLevel: 3,
      dominantHandAffected: false,
      jobType: "desk",
      riskFlagsJson: {},
    },
  });
}

async function seedKnowledgeChunk() {
  const slug = `finger-stiffness-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const document = await prisma.knowledgeDocument.create({
    data: {
      sourceType: KnowledgeSourceType.NHS,
      title: "NHS hand therapy finger stiffness guide",
      slug,
      version: "test",
    },
  });

  await prisma.knowledgeChunk.create({
    data: {
      documentId: document.id,
      chunkIndex: 0,
      content:
        "Finger stiffness after immobilisation can be common. Gentle movement should stay comfortable and should not replace clinician instructions.",
      keywords: ["finger", "stiffness", "early_mobility"],
      metadataJson: { bodyPart: "finger", phase: "early_mobility" },
    },
  });

  createdKnowledgeDocumentIds.add(document.id);
  return document.id;
}

function parseNdjsonEvents(payload: string) {
  return payload
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as { type: string; [key: string]: unknown });
}

async function seedDailyChatQuotaUsage({
  userId,
  programId,
  count,
}: {
  userId: string;
  programId: string;
  count: number;
}) {
  const conversation = await prisma.chatConversation.create({
    data: {
      userId,
      programId,
    },
  });

  await prisma.chatMessage.createMany({
    data: Array.from({ length: count }, (_, index) => ({
      conversationId: conversation.id,
      role: ChatMessageRole.ASSISTANT,
      content: `Seeded quota usage ${index + 1}`,
      provider: "mock",
      model: "deterministic-recovery-coach",
      escalated: false,
    })),
  });
}

async function seedPaidPurchaseAndProgram(
  userId: string,
  options: SeededProgramOptions
) {
  if (options.withProfile !== false) {
    await seedRecoveryProfile(userId);
  }

  const checkoutSessionId = uniqueId("cs_program_entry");
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId: uniqueId("pi_program_entry"),
      amount: 1499,
      currency: "usd",
      status: PurchaseStatus.PAID,
      paidAt: new Date(),
    },
  });

  if (!options.withProgram) {
    return { purchaseId: purchase.id, programId: null };
  }

  const recoveryProfile = await prisma.recoveryProfile.findUniqueOrThrow({
    where: { userId },
    select: { id: true },
  });

  const program = await prisma.program.create({
    data: {
      userId,
      recoveryProfileId: recoveryProfile.id,
      purchaseId: purchase.id,
      templateVersion: "finger-v1",
      startDate: new Date(),
      endDate: new Date(),
      currentDay: options.currentDay ?? 1,
      status: options.programStatus ?? ProgramStatus.ACTIVE,
      generatedSummaryJson: {
        source: "program-entry-test",
      },
    },
  });

  const baseContent: Prisma.InputJsonValue = options.programDayContent ?? {
    title: `Day ${options.currentDay ?? 1}: Begin gentle motion`,
    focus: "Gentle finger flexion warm-up",
    summary: "Short, low-load motion to start the day.",
    normalSignals: ["Mild stiffness during gentle motion"],
    getHelpSignals: ["Severe pain", "Numbness"],
    safetyNotes: [
      "Stop and contact a clinician for severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move.",
    ],
    exerciseSlugs: ["gentle-finger-bends"],
    faqSlugs: ["finger-swelling-after-cast"],
  };

  await prisma.programDay.createMany({
    data: Array.from({ length: 14 }, (_, index) => {
      const dayIndex = index + 1;
      const isCurrent = dayIndex === (options.currentDay ?? 1);

      return {
        programId: program.id,
        dayIndex,
        stage: "early_mobility",
        contentJson: isCurrent
          ? baseContent
          : {
              title: `Day ${dayIndex} placeholder`,
              focus: "Placeholder focus",
              summary: "Placeholder summary",
              exerciseSlugs: [],
              faqSlugs: [],
            },
        estimatedMinutes: 12,
      };
    }),
  });

  return { purchaseId: purchase.id, programId: program.id };
}

async function signInAs(page: Page, email: string) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.status()).toBe(200);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const loginResponse = await page.request.post("/api/auth/callback/dev-login", {
    form: {
      csrfToken,
      email,
      callbackUrl: "/onboarding",
      json: "true",
    },
  });
  expect(loginResponse.status()).toBe(200);

  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding$/);
}

test.describe("program entry", () => {
  test.describe.configure({ mode: "serial" });

  test.afterAll(async () => {
    if (createdUserIds.size > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: [...createdUserIds] } },
      });
    }

    if (createdKnowledgeDocumentIds.size > 0) {
      await prisma.knowledgeDocument.deleteMany({
        where: { id: { in: [...createdKnowledgeDocumentIds] } },
      });
    }

    await prisma.$disconnect();
  });

  test("GET /api/program/current returns 401 for unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get("/api/program/current");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "unauthenticated",
    });
  });

  test("unauthenticated users opening completion redirect to sign in", async ({
    page,
  }) => {
    await page.goto("/completion");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fcompletion$/);
  });

  test("POST /api/program/day/[day]/complete returns 401 for unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.post("/api/program/day/1/complete");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      status: "unauthenticated",
    });
  });

  test("GET /api/program/current returns no_purchase for authenticated users without purchase", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-no-purchase-${Date.now()}@example.com`;
    await seedDevUser(email);
    await signInAs(page, email);

    const response = await page.request.get("/api/program/current");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "no_purchase",
      redirectTo: "/onboarding",
    });
  });

  test("authenticated users without purchase cannot open chat shell", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat shell coverage only runs once."
    );

    const email = `dev-chat-no-purchase-${Date.now()}@example.com`;
    await seedDevUser(email);
    await signInAs(page, email);

    await page.goto("/chat");
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByTestId("chat-context-header")).toHaveCount(0);
  });

  test("paid users can open chat shell and fill suggested prompt only", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat shell coverage only runs once."
    );

    const email = `dev-chat-shell-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await signInAs(page, email);
    let chatApiRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/chat")) {
        chatApiRequests += 1;
      }
    });

    await page.goto("/chat");
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId("chat-context-header")).toBeVisible();
    await expect(page.getByText("Finger - Proximal Phalanx Stiffness")).toBeVisible();
    await expect(page.getByText("Day 5 of 14")).toBeVisible();
    await expect(page.getByText("20 questions left today")).toBeVisible();
    await expect(page.getByTestId("chat-context-header")).toContainText(
      "does not diagnose"
    );

    const prompts = page.getByTestId("chat-suggested-prompt");
    const promptCount = await prompts.count();
    expect(promptCount).toBeGreaterThanOrEqual(3);
    expect(promptCount).toBeLessThanOrEqual(5);
    await expect(
      prompts.filter({ hasText: "finger stiffness expected for Day 5" })
    ).toBeVisible();
    await expect(page.getByTestId("chat-stream-fresh")).toBeVisible();
    await expect(page.getByTestId("chat-input")).toBeVisible();
    await expect(page.getByTestId("chat-send")).toBeDisabled();

    const firstPrompt = prompts.first();
    const promptText = (await firstPrompt.textContent()) ?? "";
    await firstPrompt.click();
    await expect(page.getByTestId("chat-input")).toHaveValue(promptText);
    await expect(page.getByTestId("chat-send")).toBeEnabled();
    await expect(page).toHaveURL(/\/chat$/);
    expect(chatApiRequests).toBe(0);
  });

  test("POST /api/chat rejects invalid requests before persistence", async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat API coverage only runs once."
    );

    const unauthenticated = await page.request.post("/api/chat", {
      data: { question: "Can I move my finger?" },
    });
    expect(unauthenticated.status()).toBe(401);

    const noPurchaseEmail = `dev-chat-api-no-purchase-${Date.now()}@example.com`;
    await seedDevUser(noPurchaseEmail);
    await signInAs(page, noPurchaseEmail);
    const noPurchase = await page.request.post("/api/chat", {
      data: { question: "Can I move my finger?" },
    });
    expect(noPurchase.status()).toBe(403);

    const paidEmail = `dev-chat-api-validation-${Date.now()}@example.com`;
    const userId = await seedDevUser(paidEmail);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await signInAs(page, paidEmail);
    const invalid = await page.request.post("/api/chat", {
      data: { question: "   " },
    });
    expect(invalid.status()).toBe(400);

    const malformed = await page.request.post("/api/chat", {
      data: { question: { text: "Can I move my finger?" } },
    });
    expect(malformed.status()).toBe(400);

    const conversations = await prisma.chatConversation.count({
      where: { userId },
    });
    expect(conversations).toBe(0);
  });

  test("paid users can stream a grounded chat answer with citations", async ({ page }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat streaming coverage only runs once."
    );

    const email = `dev-chat-stream-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedKnowledgeChunk();
    await signInAs(page, email);

    await page.goto("/chat");
    await page.getByTestId("chat-input").fill("Is finger stiffness expected today?");
    await page.getByTestId("chat-send").click();

    await expect(page.getByTestId("chat-answering-state")).toBeVisible();
    await expect(page.getByTestId("chat-message-user")).toContainText(
      "Is finger stiffness expected today?"
    );
    await expect(page.getByTestId("chat-message-assistant")).toContainText(
      "educational and non-diagnostic",
      { timeout: 60_000 }
    );
    await expect(page.getByTestId("chat-citations")).toContainText(
      "NHS hand therapy finger stiffness guide",
      { timeout: 60_000 }
    );
    await expect(page.getByTestId("chat-send")).toBeDisabled();

    const conversation = await prisma.chatConversation.findFirstOrThrow({
      where: {
        userId,
        programId: programId ?? "",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[0].role).toBe("USER");
    expect(conversation.messages[1].role).toBe("ASSISTANT");
    expect(conversation.messages[1].citationsJson).toBeTruthy();
    expect(conversation.messages[1].provider).toBe("mock");
    expect(conversation.messages[1].escalated).toBe(false);
    await expect(page.getByText("19 questions left today")).toBeVisible();
  });

  test("daily chat quota blocks ordinary chat without creating messages", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat quota coverage only runs once."
    );

    const email = `${Date.now()}-quota-exhausted@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedDailyChatQuotaUsage({
      userId,
      programId: programId ?? "",
      count: 20,
    });
    await signInAs(page, email);

    let chatApiRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/chat")) {
        chatApiRequests += 1;
      }
    });

    await page.goto("/chat");
    await expect(page.getByText("0 questions left today")).toBeVisible();
    await expect(page.getByTestId("chat-quota-exceeded")).toContainText(
      "Today's AI quota is used up"
    );
    await expect(page.getByTestId("chat-input")).toBeEnabled();
    await page.getByTestId("chat-input").fill("Is finger stiffness expected today?");
    await expect(page.getByTestId("chat-send")).toBeEnabled();
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-message-assistant")).toContainText(
      "Today's AI question quota is used up"
    );
    expect(chatApiRequests).toBe(0);

    const response = await page.request.post("/api/chat", {
      data: { question: "Is finger stiffness expected today?" },
    });
    expect(response.status()).toBe(200);
    const events = parseNdjsonEvents(await response.text());
    expect(events.some((event) => event.type === "quota_exceeded")).toBe(true);

    const messageCount = await prisma.chatMessage.count({
      where: {
        conversation: {
          userId,
          programId: programId ?? "",
        },
      },
    });
    expect(messageCount).toBe(20);
  });

  test("danger escalation still returns after quota is exhausted", async ({ page }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat quota safety coverage only runs once."
    );

    const email = `${Date.now()}-quota-danger@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedDailyChatQuotaUsage({
      userId,
      programId: programId ?? "",
      count: 20,
    });
    await signInAs(page, email);

    const response = await page.request.post("/api/chat", {
      data: { question: "My finger is blue and numb." },
    });
    expect(response.status()).toBe(200);
    const events = parseNdjsonEvents(await response.text());
    expect(events.some((event) => event.type === "escalation")).toBe(true);
    expect(events.some((event) => event.type === "quota_exceeded")).toBe(false);

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversation: {
          userId,
          programId: programId ?? "",
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(messages).toHaveLength(22);
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.provider).toBe("local-safety");
    expect(lastMessage.escalated).toBe(true);

    const normalAssistantCount = await prisma.chatMessage.count({
      where: {
        role: ChatMessageRole.ASSISTANT,
        escalated: false,
        conversation: {
          userId,
          programId: programId ?? "",
        },
      },
    });
    expect(normalAssistantCount).toBe(20);
  });

  test("primary provider failure falls back and persists fallback metadata", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat fallback coverage only runs once."
    );

    const email = `${Date.now()}-provider-fallback@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedKnowledgeChunk();
    await signInAs(page, email);

    const response = await page.request.post("/api/chat", {
      headers: { "x-chat-provider-test-mode": "primary_error" },
      data: { question: "Is finger stiffness expected today?" },
    });
    expect(response.status()).toBe(200);
    const events = parseNdjsonEvents(await response.text());
    expect(events.some((event) => event.type === "provider_fallback")).toBe(true);
    expect(events.some((event) => event.type === "token")).toBe(true);

    const conversation = await prisma.chatConversation.findFirstOrThrow({
      where: {
        userId,
        programId: programId ?? "",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[1].provider).toBe("groq");
    expect(conversation.messages[1].model).toBe("deterministic-groq-fallback");
    expect(conversation.messages[1].escalated).toBe(false);
  });

  test("full provider failure is retryable and does not persist assistant answer", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat provider failure coverage only runs once."
    );

    const email = `${Date.now()}-provider-failure@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await signInAs(page, email);

    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: "chat_generation_failed",
          message: "We could not answer right now. Please retry in a moment.",
        }),
      });
    });
    await page.goto("/chat");
    await page.getByTestId("chat-input").fill("Is finger stiffness expected today?");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-error-state")).toContainText(
      "Please retry in a moment",
      { timeout: 30_000 }
    );
    await page.unroute("**/api/chat");

    const response = await page.request.post("/api/chat", {
      headers: { "x-chat-provider-test-mode": "all_error" },
      data: { question: "Is finger stiffness expected today?" },
    });
    expect(response.status()).toBe(502);

    const conversations = await prisma.chatConversation.count({
      where: { userId },
    });
    expect(conversations).toBe(0);
  });

  test("danger chat input shows accessible escalation and persists escalated message", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat safety coverage only runs once."
    );

    const email = `dev-chat-danger-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedKnowledgeChunk();
    await signInAs(page, email);

    await page.goto("/chat");
    await page.getByTestId("chat-input").fill("My finger is blue and numb.");
    await page.getByTestId("chat-send").click();

    const warning = page.getByTestId("chat-escalation-warning");
    await expect(warning).toBeVisible({ timeout: 60_000 });
    await expect(warning).toHaveAttribute("role", "alert");
    await expect(warning).toContainText("Warning sign detected");
    await expect(warning).toContainText("Please contact your clinician");
    await expect(warning).toContainText("blue");
    await expect(warning).toContainText("numb");
    await expect(page.getByTestId("chat-message-assistant")).toContainText(
      "I cannot diagnose this or guide exercises",
      { timeout: 60_000 }
    );
    await expect(page.getByTestId("chat-message-assistant")).not.toContainText(
      "educational and non-diagnostic"
    );
    await expect(page.getByTestId("chat-citations")).toHaveCount(0);

    const conversation = await prisma.chatConversation.findFirstOrThrow({
      where: {
        userId,
        programId: programId ?? "",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[0].role).toBe("USER");
    expect(conversation.messages[0].escalated).toBe(false);
    expect(conversation.messages[1].role).toBe("ASSISTANT");
    expect(conversation.messages[1].provider).toBe("local-safety");
    expect(conversation.messages[1].escalated).toBe(true);
  });

  test("negated danger terms keep the normal chat path", async ({ page }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + chat safety coverage only runs once."
    );

    const email = `dev-chat-negated-danger-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await seedKnowledgeChunk();
    await signInAs(page, email);

    await page.goto("/chat");
    await page
      .getByTestId("chat-input")
      .fill("I have no numbness, no severe pain, and can push gently. Is stiffness expected?");
    await page.getByTestId("chat-send").click();

    await expect(page.getByTestId("chat-escalation-warning")).toHaveCount(0);
    await expect(page.getByTestId("chat-message-assistant")).toContainText(
      "educational and non-diagnostic",
      { timeout: 60_000 }
    );
    await expect(page.getByTestId("chat-citations")).toContainText(
      "NHS hand therapy finger stiffness guide",
      { timeout: 60_000 }
    );

    const conversation = await prisma.chatConversation.findFirstOrThrow({
      where: {
        userId,
        programId: programId ?? "",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[1].role).toBe("ASSISTANT");
    expect(conversation.messages[1].provider).toBe("mock");
    expect(conversation.messages[1].escalated).toBe(false);
  });

  test("paid active program with currentDay > 1 resolves and routes to that day", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-paid-day5-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
      programDayContent: {
        title: "Day 5: Build active range",
        focus: "Active flexion practice",
        summary: "Add a controlled active range block.",
        normalSignals: ["Light fatigue after careful practice"],
        getHelpSignals: ["Severe pain", "Sudden swelling"],
        safetyNotes: [
          "Stop and contact a clinician for severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move.",
        ],
        exerciseSlugs: ["gentle-finger-bends"],
        exercises: [
          {
            slug: "gentle-finger-bends",
            title: "Gentle finger bends",
            instructions: [
              "Rest your forearm on a table with your hand relaxed.",
              "Slowly bend the affected finger only as far as comfortable.",
            ],
            contraindications: [
              "Stop if pain becomes severe, the finger changes color, or numbness appears.",
              "Follow any limits your clinician gave after cast or splint removal.",
            ],
            durationSeconds: 60,
            repetitions: "5-8 gentle bends",
          },
          {
            slug: "tendon-glide-light",
            title: "Light tendon glide sequence",
            instructions: [
              "Move from a straight hand to a gentle hook shape.",
              "Keep the motion slow and avoid gripping hard.",
            ],
            contraindications: ["Do not continue through sharp pain."],
            durationSeconds: 90,
            repetitions: "3-5 slow rounds",
          },
        ],
        faqSlugs: ["finger-swelling-after-cast"],
      },
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.status).toBe("ready");
    expect(body.program.currentDay).toBe(5);
    expect(body.program.totalDays).toBe(14);
    expect(body.program.templateVersion).toBe("finger-v1");
    expect(body.program.currentProgramDay.dayIndex).toBe(5);
    expect(body.program.currentProgramDay.title).toContain("Day 5");
    expect(body.program.currentProgramDay.normalSignals).toEqual([
      "Light fatigue after careful practice",
    ]);
    expect(body.program.currentProgramDay.getHelpSignals).toEqual([
      "Severe pain",
      "Sudden swelling",
    ]);
    expect(body.program.currentProgramDay.safetyNotes[0]).toContain(
      "Stop and contact a clinician"
    );
    expect(body.program.currentProgramDay.exercises).toMatchObject([
      {
        slug: "gentle-finger-bends",
        title: "Gentle finger bends",
        durationLabel: "5-8 gentle bends · 1 min",
      },
      {
        slug: "tendon-glide-light",
        title: "Light tendon glide sequence",
        durationLabel: "3-5 slow rounds · 2 min",
      },
    ]);

    await page.goto("/progress");
    await expect(page).toHaveURL(/\/day\/5$/);
    await expect(
      page.getByRole("heading", { name: "Day 5 of 14" })
    ).toBeVisible();
    await expect(page.getByTestId("day-recovery-header")).toBeVisible();
    await expect(page.getByText("Overall progress")).toBeVisible();
    await expect(page.getByText("5/14")).toBeVisible();
    await expect(page.getByText("Early Mobility")).toBeVisible();
    await expect(page.getByText("12 minutes")).toBeVisible();
    await expect(page.getByTestId("today-focus")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Day 5: Build active range" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ask AI about today" })
    ).toBeVisible();
    await expect(
      page.getByText("Active flexion practice")
    ).toBeVisible();
    await expect(page.getByText("Add a controlled active range block.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Stop and contact a clinician" })
    ).toBeVisible();
    await expect(page.getByTestId("exercise-cards")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Gentle finger bends" })
    ).toBeVisible();
    await expect(page.getByText("5-8 gentle bends · 1 min")).toBeVisible();
    await expect(
      page.getByText("Rest your forearm on a table with your hand relaxed.")
    ).toBeVisible();
    await expect(
      page.getByText("Stop if pain becomes severe", { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText("Follow any limits your clinician gave", { exact: false })
    ).toBeVisible();

    const gentleBendsToggle = page.getByLabel(
      "Mark Gentle finger bends complete"
    );
    const tendonGlideToggle = page.getByLabel(
      "Mark Light tendon glide sequence complete"
    );
    await expect(gentleBendsToggle).not.toBeChecked();
    await expect(page.getByText("0% complete")).toBeVisible();
    await expect(page.getByText("0 of 2 exercises complete")).toBeVisible();

    await gentleBendsToggle.check();
    await expect(page.getByText("50% complete")).toBeVisible();
    await expect(page.getByText("1 of 2 exercises complete")).toBeVisible();

    await tendonGlideToggle.check();
    await expect(page.getByText("100% complete")).toBeVisible();
    await expect(page.getByText("2 of 2 exercises complete")).toBeVisible();

    await gentleBendsToggle.uncheck();
    await expect(page.getByText("50% complete")).toBeVisible();
    await expect(page.getByText("1 of 2 exercises complete")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/day/5");
    await expect(page.getByTestId("day-recovery-header")).toBeInViewport();
    await expect(page.getByTestId("today-focus")).toBeInViewport({
      ratio: 0.2,
    });
    await expect(
      page.getByRole("heading", { name: "Gentle finger bends" })
    ).toBeVisible();
    await expect(
      page.getByLabel("Mark Gentle finger bends complete")
    ).toBeVisible();

    await page.getByRole("link", { name: "Ask AI about today" }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId("chat-context-header")).toBeVisible();
  });

  test("empty or malformed exercise rows show a safe exercise fallback", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-empty-exercises-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 8,
      programDayContent: {
        title: "Day 8: Keep motion gentle",
        focus: "Short comfort-first practice",
        summary: "Exercises are not ready, but the day shell should render.",
        normalSignals: ["Mild stiffness"],
        getHelpSignals: ["Severe pain"],
        safetyNotes: ["Stop if symptoms worsen."],
        exercises: [
          null,
          {
            slug: "   ",
            title: "Missing slug should be skipped",
          },
          {
            slug: "missing-title",
            title: "   ",
          },
        ],
        exerciseSlugs: ["missing-title"],
        faqSlugs: ["finger-swelling-after-cast"],
      },
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.status).toBe("ready");
    expect(body.program.currentProgramDay.exercises).toEqual([]);

    await page.goto("/day/8");
    await expect(page.getByTestId("today-focus")).toBeVisible();
    await expect(page.getByTestId("exercise-cards-empty")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Exercise details are being prepared",
      })
    ).toBeVisible();
  });

  test("current day completion advances progress and is idempotent", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-complete-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 2,
      programDayContent: {
        title: "Day 2: Complete safely",
        focus: "Practice then close the day",
        summary: "Completion should advance the active day.",
        normalSignals: ["Mild stiffness"],
        getHelpSignals: ["Severe pain"],
        safetyNotes: ["Stop if symptoms worsen."],
        exerciseSlugs: ["gentle-finger-bends"],
        faqSlugs: ["finger-swelling-after-cast"],
      },
    });
    await signInAs(page, email);

    const response = await page.request.post("/api/program/day/2/complete");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "completed",
      completedDay: 2,
      currentDay: 3,
      completionPercent: 100,
      programStatus: ProgramStatus.ACTIVE,
    });

    const completedDay = await prisma.programDay.findUniqueOrThrow({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 2,
        },
      },
    });
    expect(completedDay.completedAt).not.toBeNull();
    expect(completedDay.completionPercent).toBe(100);

    const advancedProgram = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(advancedProgram.currentDay).toBe(3);
    expect(advancedProgram.status).toBe(ProgramStatus.ACTIVE);

    const retryResponse = await page.request.post("/api/program/day/2/complete");
    expect(retryResponse.status()).toBe(200);
    await expect(retryResponse.json()).resolves.toMatchObject({
      status: "already_completed",
      completedDay: 2,
      currentDay: 3,
    });

    const afterRetryProgram = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(afterRetryProgram.currentDay).toBe(3);
  });

  test("day completion rejects future day without mutation", async ({ page }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-complete-future-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 3,
    });
    await signInAs(page, email);

    const response = await page.request.post("/api/program/day/4/complete");
    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      status: "not_current_day",
    });

    const program = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(program.currentDay).toBe(3);

    const futureDay = await prisma.programDay.findUniqueOrThrow({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 4,
        },
      },
    });
    expect(futureDay.completedAt).toBeNull();
    expect(futureDay.completionPercent).toBe(0);
  });

  test("active users cannot open false completion state", async ({ page }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + completion routing coverage only runs once."
    );

    const email = `${Date.now()}-active-completion-guard@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await signInAs(page, email);

    await page.goto("/completion");
    await expect(page).toHaveURL(/\/day\/5$/);
    await expect(page.getByTestId("completion-page")).toHaveCount(0);
  });

  test("completed users can revisit completion with report and share actions", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + completion routing coverage only runs once."
    );

    const email = `${Date.now()}-completion-revisit@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
      programStatus: ProgramStatus.COMPLETED,
    });
    await prisma.programDay.updateMany({
      where: {
        program: { userId },
        dayIndex: 14,
      },
      data: {
        completedAt: new Date(),
        completionPercent: 100,
      },
    });
    await signInAs(page, email);

    await page.goto("/completion");
    await expect(page.getByTestId("completion-page")).toBeVisible();
    await expect(page.getByTestId("completion-summary")).toContainText(
      "14 of 14 days finished"
    );
    await expect(page.getByTestId("completion-summary")).toContainText(
      "Day 14 of 14"
    );
    await expect(page.getByTestId("completion-summary")).toContainText("Finger");
    await expect(page.getByTestId("completion-next-steps")).toContainText(
      "Review Day 14"
    );
    await expect(page.getByTestId("completion-report-download")).toBeVisible();
    await expect(page.getByTestId("completion-share-action")).toBeVisible();
    await expect(page.getByTestId("completion-safety-boundary")).toContainText(
      "does not diagnose"
    );
    await expect(page.getByRole("link", { name: /Download report/i })).toHaveCount(
      0
    );
    await expect(page.getByRole("link", { name: /Share/i })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Progress overview" })
    ).toHaveCount(0);

    await page.goto("/progress");
    await expect(page).toHaveURL(/\/completion$/);
  });

  test("completed users can download a safe summary report", async ({ page }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + report download coverage only runs once."
    );

    const email = `${Date.now()}-report-download@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
      programStatus: ProgramStatus.COMPLETED,
    });
    await prisma.programDay.updateMany({
      where: {
        program: { userId },
        dayIndex: 14,
      },
      data: {
        completedAt: new Date(),
        completionPercent: 100,
      },
    });
    await signInAs(page, email);

    const response = await page.request.get("/api/program/report");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(response.headers()["content-disposition"]).toContain(
      'attachment; filename="recovery-summary-report.html"'
    );
    expect(response.headers()["cache-control"]).toContain("no-store");

    const body = await response.text();
    expect(body).toContain("14-day recovery companion summary");
    expect(body).toContain("Completed");
    expect(body).toContain("14 of 14 days");
    expect(body).toContain("Finger - Proximal Phalanx Stiffness");
    expect(body).toContain("not a diagnosis");
    expect(body).toContain("not a diagnosis, treatment plan, prognosis, or medical clearance");
    expect(body).toContain("Contact a clinician promptly");
    expect(body).not.toContain("stripeCheckoutSessionId");
    expect(body).not.toContain("paymentIntent");
    expect(body).not.toContain("contentJson");
    expect(body).not.toContain("provider");
    expect(body).not.toContain("quota");
    expect(body).not.toContain("Share");
    expect(body).not.toContain("Copy link");
    expect(body).not.toContain("completion_report_view");
  });

  test("report download rejects unauthenticated and active users safely", async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + report access coverage only runs once."
    );

    const unauthenticated = await request.get("/api/program/report");
    expect(unauthenticated.status()).toBe(401);
    expect(await unauthenticated.text()).not.toContain(
      "14-day recovery companion summary"
    );

    const email = `${Date.now()}-report-active-guard@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 5,
    });
    await signInAs(page, email);

    const activeResponse = await page.request.get("/api/program/report");
    expect(activeResponse.status()).toBe(403);
    const activeBody = await activeResponse.json();
    expect(activeBody).toMatchObject({
      status: "not_completed",
    });
    expect(JSON.stringify(activeBody)).not.toContain(
      "14-day recovery companion summary"
    );
  });

  test("report download fails safely when final content is malformed", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + report missing content coverage only runs once."
    );

    const email = `${Date.now()}-report-missing-content@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
      programStatus: ProgramStatus.COMPLETED,
      programDayContent: {
        title: "   ",
        focus: "   ",
        summary: "Malformed final content should not be emitted.",
      },
    });
    await signInAs(page, email);

    const response = await page.request.get("/api/program/report");
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({
      status: "missing_content",
    });
    expect(JSON.stringify(body)).not.toContain(
      "Malformed final content should not be emitted"
    );
  });

  test("completion report CTA shows recoverable error on failed download", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + report failure UI coverage only runs once."
    );

    const email = `${Date.now()}-report-ui-error@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
      programStatus: ProgramStatus.COMPLETED,
    });
    await signInAs(page, email);

    await page.route("**/api/program/report", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: "unavailable" }),
      });
    });

    await page.goto("/completion");
    await page.getByTestId("completion-report-download").click();
    await expect(page.getByTestId("completion-report-error")).toContainText(
      "Please try again"
    );
  });

  test("completed users can share only the public product link", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + share coverage only runs once."
    );

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (payload: ShareData) => {
          (window as Window & { __sharePayload?: ShareData }).__sharePayload =
            payload;
        },
      });
    });

    const email = `${Date.now()}-completion-share@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
      programStatus: ProgramStatus.COMPLETED,
    });
    await signInAs(page, email);

    await page.goto("/completion");
    await expect(page.getByTestId("completion-share-action")).toBeVisible();
    await page.getByTestId("completion-share-action").click();
    await expect(page.getByTestId("completion-share-feedback")).toContainText(
      "Share link ready"
    );

    const payload = await page.evaluate(
      () => (window as Window & { __sharePayload?: ShareData }).__sharePayload
    );
    expect(payload).toMatchObject({
      title: "Fracture Recovery Companion",
      text: "I finished a 14-day recovery companion. It is educational support, not medical advice.",
      url: `${new URL(page.url()).origin}/`,
    });
    const serializedPayload = JSON.stringify(payload);
    expect(serializedPayload).not.toContain("Finger");
    expect(serializedPayload).not.toContain("Proximal");
    expect(serializedPayload).not.toContain("recovery-summary-report");
    expect(serializedPayload).not.toContain("contentJson");
    expect(serializedPayload).not.toContain("stripe");
    expect(serializedPayload).not.toContain("chat");
    expect(serializedPayload).not.toContain("referral");
    expect(serializedPayload).not.toContain("share_click");
  });

  test("completed users can copy the public link when native sharing is unavailable", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + share fallback coverage only runs once."
    );

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as Window & { __copiedShareUrl?: string }).__copiedShareUrl =
              value;
          },
        },
      });
    });

    const email = `${Date.now()}-completion-copy-share@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
      programStatus: ProgramStatus.COMPLETED,
    });
    await signInAs(page, email);

    await page.goto("/completion");
    await page.getByTestId("completion-share-action").click();
    await expect(page.getByTestId("completion-share-feedback")).toContainText(
      "Product link copied"
    );

    const copiedUrl = await page.evaluate(
      () => (window as Window & { __copiedShareUrl?: string }).__copiedShareUrl
    );
    expect(copiedUrl).toBe(`${new URL(page.url()).origin}/`);
  });

  test("completion sharing shows recoverable feedback when share and copy fail", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + share failure coverage only runs once."
    );

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          throw new Error("native share unavailable");
        },
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("clipboard unavailable");
          },
        },
      });
    });

    const email = `${Date.now()}-completion-share-failure@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
      programStatus: ProgramStatus.COMPLETED,
    });
    await signInAs(page, email);

    await page.goto("/completion");
    await page.getByTestId("completion-share-action").click();
    await expect(page.getByTestId("completion-share-feedback")).toContainText(
      "copy the product link instead"
    );
    await expect(page.getByTestId("completion-share-feedback")).toContainText(
      `${new URL(page.url()).origin}/`
    );
    await expect(page.getByTestId("completion-report-download")).toBeVisible();
    await expect(page.getByRole("link", { name: "Review Day 14" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ask a non-urgent question" })
    ).toBeVisible();
  });

  test("day 14 completion marks program completed and routes to completion", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-complete-day14-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 14,
    });
    await signInAs(page, email);

    await page.goto("/day/14");
    await page.getByRole("button", { name: "Mark day complete" }).click();
    await expect(page).toHaveURL(/\/completion$/, { timeout: 90_000 });
    await expect(page.getByTestId("completion-page")).toBeVisible();
    await expect(page.getByTestId("completion-summary")).toContainText(
      "14 of 14 days finished"
    );

    const program = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(program.currentDay).toBe(14);
    expect(program.status).toBe(ProgramStatus.COMPLETED);

    const day14 = await prisma.programDay.findUniqueOrThrow({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 14,
        },
      },
    });
    expect(day14.completedAt).not.toBeNull();
    expect(day14.completionPercent).toBe(100);

    const currentResponse = await page.request.get("/api/program/current");
    expect(currentResponse.status()).toBe(200);
    await expect(currentResponse.json()).resolves.toMatchObject({
      status: "ready",
      program: {
        status: ProgramStatus.COMPLETED,
        currentDay: 14,
        currentProgramDay: {
          dayIndex: 14,
          completionPercent: 100,
        },
      },
    });

    const afterCurrentLookupProgram = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(afterCurrentLookupProgram.status).toBe(ProgramStatus.COMPLETED);
    expect(afterCurrentLookupProgram.currentDay).toBe(14);

    await page.goto("/day/14");
    await expect(page.getByTestId("day-review-shell")).toBeVisible();
    await expect(page.getByTestId("day-review-state")).toBeVisible();
    await expect(
      page.getByText("This completed day is read-only")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark day complete" })
    ).toHaveCount(0);
  });

  test("partial exercise day completion requires confirmation before mutation", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-partial-complete-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 9,
      programDayContent: {
        title: "Day 9: Partial completion confirmation",
        focus: "Check confirmation behavior",
        summary: "The user can cancel before server mutation.",
        normalSignals: ["Mild stiffness"],
        getHelpSignals: ["Severe pain"],
        safetyNotes: ["Stop if symptoms worsen."],
        exerciseSlugs: ["gentle-finger-bends", "tendon-glide-light"],
        exercises: [
          {
            slug: "gentle-finger-bends",
            title: "Gentle finger bends",
            instructions: ["Bend gently."],
            contraindications: ["Stop for severe pain."],
            durationSeconds: 60,
            repetitions: "5 bends",
          },
          {
            slug: "tendon-glide-light",
            title: "Light tendon glide sequence",
            instructions: ["Move slowly."],
            contraindications: ["Do not force motion."],
            durationSeconds: 60,
            repetitions: "3 rounds",
          },
        ],
        faqSlugs: ["finger-swelling-after-cast"],
      },
    });
    await signInAs(page, email);
    await page.goto("/day/9");

    await page.getByLabel("Mark Gentle finger bends complete").check();
    await page.getByRole("button", { name: "Mark day complete" }).click();
    await expect(page.getByTestId("day-completion-confirmation")).toBeVisible();

    await page.getByRole("button", { name: "Keep working" }).click();
    await expect(page.getByTestId("day-completion-confirmation")).toBeHidden();

    const unchangedDay = await prisma.programDay.findUniqueOrThrow({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 9,
        },
      },
    });
    expect(unchangedDay.completedAt).toBeNull();
    expect(unchangedDay.completionPercent).toBe(0);

    await page.getByRole("button", { name: "Mark day complete" }).click();
    await page.getByRole("button", { name: "Complete day anyway" }).click();
    await expect(page.getByTestId("day-completion-feedback")).toContainText(
      "Day marked complete"
    );

    const completedDay = await prisma.programDay.findUniqueOrThrow({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 9,
        },
      },
    });
    expect(completedDay.completedAt).not.toBeNull();
    expect(completedDay.completionPercent).toBe(100);

    const program = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
    });
    expect(program.currentDay).toBe(10);
  });

  test("future day requests show a locked state without active controls", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-future-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 3,
    });
    await signInAs(page, email);

    await page.goto("/day/10");
    await expect(page).toHaveURL(/\/day\/10$/);
    await expect(page.getByTestId("day-locked-state")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Day 10 is not unlocked yet" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go to today (Day 3)" })
    ).toBeVisible();
    await expect(page.getByTestId("exercise-cards")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark day complete" })
    ).toHaveCount(0);
  });

  test("past completed day renders read-only review content", async ({ page }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-review-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 4,
    });
    await prisma.programDay.update({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 2,
        },
      },
      data: {
        completedAt: new Date(),
        completionPercent: 100,
      },
    });
    await signInAs(page, email);

    await page.goto("/day/2");
    await expect(page.getByTestId("day-review-shell")).toBeVisible();
    await expect(page.getByTestId("day-review-state")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Day 2 placeholder" })
    ).toBeVisible();
    await expect(page.getByText("Read-only review:")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go to today (Day 4)" })
    ).toBeVisible();
    await expect(page.getByTestId("exercise-cards")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark day complete" })
    ).toHaveCount(0);
  });

  test("invalid day param falls back safely without exposing /day/abc", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-invalid-day-${Date.now()}@example.com`;
    await seedDevUser(email);
    await signInAs(page, email);

    await page.goto("/day/abc");
    await expect(page).not.toHaveURL(/\/day\/abc/);
    await expect(page).toHaveURL(/\/(progress|onboarding)$/);
  });

  test("missing current day row returns missing_day_content safely", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-missing-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 4,
    });
    await prisma.programDay.delete({
      where: {
        programId_dayIndex: {
          programId: programId ?? "",
          dayIndex: 4,
        },
      },
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    await expect(apiResponse.json()).resolves.toMatchObject({
      status: "missing_day_content",
      currentDay: 4,
      redirectTo: "/progress",
    });

    await page.goto("/day/4");
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByTestId("progress-fallback")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your plan content needs support" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retry today's plan" })
    ).toBeVisible();
  });

  test("malformed current day content falls back safely", async ({ page }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-malformed-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 6,
      programDayContent: {
        focus: "Focus exists but required title is missing",
        summary: "This malformed content should not render as advice.",
      },
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    await expect(apiResponse.json()).resolves.toMatchObject({
      status: "missing_day_content",
      currentDay: 6,
      redirectTo: "/progress",
    });

    await page.goto("/day/6");
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByTestId("progress-fallback")).toBeVisible();
    await expect(
      page.getByText("today's content is missing or incomplete")
    ).toBeVisible();
  });

  test("blank current day title and focus falls back safely", async ({ page }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-blank-day-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 7,
      programDayContent: {
        title: "   ",
        focus: "   ",
        summary: "Whitespace title and focus should not count as content.",
        normalSignals: ["   ", "Mild stiffness"],
        getHelpSignals: ["   "],
        safetyNotes: ["   "],
      },
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    await expect(apiResponse.json()).resolves.toMatchObject({
      status: "missing_day_content",
      currentDay: 7,
      redirectTo: "/progress",
    });

    await page.goto("/day/7");
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByTestId("progress-fallback")).toBeVisible();
  });

  test("paid purchase without program auto-recovers when profile exists", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-recover-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: false,
      withProfile: true,
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.status).toBe("missing_program_recovered");
    expect(body.program.templateVersion).toBe("finger-v1");
    expect(body.program.currentDay).toBe(1);

    const program = await prisma.program.findFirst({
      where: { userId, status: ProgramStatus.ACTIVE },
      include: { days: true },
    });
    expect(program?.days).toHaveLength(14);
    expect(program?.templateVersion).toBe("finger-v1");
  });

  test("paid purchase with inactive program restores active program", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-inactive-program-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    const { programId } = await seedPaidPurchaseAndProgram(userId, {
      withProgram: true,
      currentDay: 2,
      programStatus: ProgramStatus.EXPIRED,
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.status).toBe("missing_program_recovered");
    expect(body.program.currentDay).toBe(2);

    const restoredProgram = await prisma.program.findUniqueOrThrow({
      where: { id: programId ?? "" },
      include: { days: true },
    });
    expect(restoredProgram.status).toBe(ProgramStatus.ACTIVE);
    expect(restoredProgram.days).toHaveLength(14);
  });

  test("paid purchase without profile returns safe missing_profile fallback", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + API coverage only runs once."
    );

    const email = `dev-no-profile-${Date.now()}@example.com`;
    const userId = await seedDevUser(email);
    await seedPaidPurchaseAndProgram(userId, {
      withProgram: false,
      withProfile: false,
    });
    await signInAs(page, email);

    const apiResponse = await page.request.get("/api/program/current");
    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.json();
    expect(body.status).toBe("missing_profile");
    expect(body.redirectTo).toBe("/onboarding");

    await page.goto("/progress");
    await expect(page.getByTestId("progress-fallback")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to onboarding" })
    ).toBeVisible();
  });

  test("unauthenticated /progress and /day/[day] redirect to sign-in", async ({
    page,
  }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fprogress/);

    await page.goto("/day/2");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fday%2F2/);

    await page.goto("/chat");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fchat/);
  });
});
