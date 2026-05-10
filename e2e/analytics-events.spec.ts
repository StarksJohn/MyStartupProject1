import { expect, type Page, test } from "@playwright/test";
import { PrismaClient, ProgramStatus, PurchaseStatus, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

function uniqueId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createDevUserId(email: string) {
  return `dev-${Buffer.from(email).toString("base64url").slice(0, 24)}`;
}

async function installPlausibleMock(page: Page) {
  await page.addInitScript(() => {
    window.__analyticsProvider = "plausible";
    window.plausible = (name, options) => {
      const previous = JSON.parse(
        window.localStorage.getItem("__analyticsEvents") ?? "[]"
      ) as Array<{ name: string; props?: Record<string, string | number | boolean> }>;
      const next = [...previous, { name, props: options?.props ?? {} }];

      window.localStorage.setItem("__analyticsEvents", JSON.stringify(next));
    };
  });
}

async function getAnalyticsEvents(page: Page) {
  return page.evaluate(() => {
    return JSON.parse(
      window.localStorage.getItem("__analyticsEvents") ?? "[]"
    ) as AnalyticsEvent[];
  });
}

async function saveRecoveryProfile(page: Page) {
  const summaryHeading = page.getByRole("heading", {
    name: "Personalized Summary",
  });

  if (await summaryHeading.isVisible().catch(() => false)) {
    return;
  }

  await page
    .getByRole("button", { name: "Save Recovery Profile" })
    .click({ timeout: 5000 })
    .catch(() => undefined);
  await expect(summaryHeading).toBeVisible({ timeout: 30000 });
}

async function seedDevUser(email: string) {
  const userId = createDevUserId(email);

  await prisma.user.upsert({
    where: { email },
    update: { id: userId, emailVerified: new Date() },
    create: {
      id: userId,
      email,
      emailVerified: new Date(),
    },
  });

  return userId;
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
}

async function seedRecoveryProfile(userId: string) {
  return prisma.recoveryProfile.upsert({
    where: { userId },
    update: {
      bodyPart: "finger",
      subType: "proximal phalanx stiffness",
      castRemovedAt: new Date(),
      hasHardware: "no",
      referredToPt: "not_sure",
      painLevel: 3,
      dominantHandAffected: true,
      jobType: "desk",
      notes: "Typing is the main daily challenge.",
    },
    create: {
      userId,
      bodyPart: "finger",
      subType: "proximal phalanx stiffness",
      castRemovedAt: new Date(),
      hasHardware: "no",
      referredToPt: "not_sure",
      painLevel: 3,
      dominantHandAffected: true,
      jobType: "desk",
      notes: "Typing is the main daily challenge.",
    },
  });
}

async function seedPaidProgram({
  userId,
  currentDay,
  status,
  checkoutSessionId,
}: {
  userId: string;
  currentDay: number;
  status: ProgramStatus;
  checkoutSessionId?: string;
}) {
  const profile = await seedRecoveryProfile(userId);
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      stripeCheckoutSessionId: checkoutSessionId ?? uniqueId("cs_analytics"),
      stripePaymentIntentId: uniqueId("pi_analytics"),
      amount: 1499,
      currency: "usd",
      status: PurchaseStatus.PAID,
      paidAt: new Date(),
    },
  });
  const program = await prisma.program.create({
    data: {
      userId,
      recoveryProfileId: profile.id,
      purchaseId: purchase.id,
      templateVersion: "finger-v1",
      startDate: new Date(),
      endDate: new Date(),
      currentDay,
      status,
      generatedSummaryJson: { source: "analytics-events-test" },
    },
  });
  const baseContent: Prisma.InputJsonValue = {
    title: "Day 1: Begin gentle motion",
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

      return {
        programId: program.id,
        dayIndex,
        stage: "early_mobility",
        contentJson:
          dayIndex === currentDay || dayIndex === 14
            ? baseContent
            : {
                title: `Day ${dayIndex} placeholder`,
                focus: "Placeholder focus",
                summary: "Placeholder summary",
                exerciseSlugs: [],
                faqSlugs: [],
              },
        estimatedMinutes: 12,
        completedAt: status === ProgramStatus.COMPLETED && dayIndex === 14 ? new Date() : null,
        completionPercent: status === ProgramStatus.COMPLETED && dayIndex === 14 ? 100 : 0,
      };
    }),
  });

  return program.id;
}

function expectNoPrivateAnalyticsData(events: AnalyticsEvent[]) {
  const serialized = JSON.stringify(events);
  const forbidden = [
    "email",
    "userId",
    "programId",
    "purchaseId",
    "checkoutSessionId",
    "stripe",
    "payment",
    "bodyPart",
    "subType",
    "painLevel",
    "proximal",
    "phalanx",
    "Typing",
    "question",
    "answer",
    "contentJson",
    "provider",
    "model",
    "quotaKey",
    "session_id",
    "dev_mock",
    "recovery-summary-report",
  ];

  for (const value of forbidden) {
    expect(serialized).not.toContain(value);
  }
}

test.describe("product analytics events", () => {
  test.describe.configure({ mode: "serial" });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("analytics stays disabled without a provider flag", async ({ page }) => {
    await page.addInitScript(() => {
      window.plausible = () => {
        throw new Error("disabled analytics should not call provider");
      };
    });

    await page.goto("/");
    await expect(page.getByTestId("landing-hero")).toBeVisible();
    await page.getByRole("link", { name: "See how the 14-day plan works" }).click();
    await expect(page).toHaveURL(/#how-it-works$/);
  });

  test("landing events use the approved vocabulary and safe properties", async ({
    page,
  }) => {
    await installPlausibleMock(page);

    await page.goto("/");
    await expect(page.getByTestId("landing-hero")).toBeVisible();
    await page.getByRole("link", { name: "See how the 14-day plan works" }).click();
    await expect(page).toHaveURL(/#how-it-works$/);

    const events = await getAnalyticsEvents(page);
    expect(events).toEqual(
      expect.arrayContaining([
        { name: "landing_view", props: { surface: "landing" } },
        {
          name: "cta_click",
          props: { surface: "landing", cta_id: "hero_secondary" },
        },
      ])
    );
    expectNoPrivateAnalyticsData(events);
  });

  test("onboarding and checkout analytics exclude profile and payment data", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Auth + checkout analytics coverage only runs once."
    );
    await installPlausibleMock(page);

    const email = `${Date.now()}-analytics-checkout@example.com`;
    await seedDevUser(email);
    await signInAs(page, email);
    await page.route("**/api/onboarding/recovery-profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/onboarding");
    await page.locator("#clinicianEvaluated-yes").check();
    await page.locator("#immobilizationStatus-removed_or_near_removal").check();
    await page.locator("#injuryArea-finger_or_metacarpal").check();
    await page.locator("#hasRedFlags-no").check();
    await page.getByRole("button", { name: "Check eligibility" }).click();
    await page.getByRole("button", { name: "Continue to Recovery Profile" }).click();

    await page
      .getByLabel("Subtype or short injury description")
      .fill("proximal phalanx stiffness");
    await page.getByLabel("Cast or splint removal date").fill("2026-05-10");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByLabel("Current pain level, 0 to 10")).toBeVisible();
    await page.locator('input[name="hasHardware"][value="no"]').check();
    await page.locator('input[name="referredToPt"][value="not_sure"]').check();
    await page.getByLabel("Current pain level, 0 to 10").fill("3");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const summaryHeading = page.getByRole("heading", {
      name: "Personalized Summary",
    });

    if (!(await summaryHeading.isVisible().catch(() => false))) {
      await expect(page.getByLabel("Work or daily-use category")).toBeVisible();
      await page.getByLabel("Work or daily-use category").selectOption("desk");
      await page
        .getByLabel("Optional notes for plan mapping")
        .fill("Typing is the main daily challenge.");
      await saveRecoveryProfile(page);
    }
    const checkoutSessionId = uniqueId("cs_analytics_checkout");
    await seedPaidProgram({
      userId: createDevUserId(email),
      currentDay: 1,
      status: ProgramStatus.ACTIVE,
      checkoutSessionId,
    });
    await page.route("**/api/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: `/onboarding/checkout/success?session_id=${checkoutSessionId}`,
        }),
      });
    });
    await page.getByRole("button", { name: "Unlock my 14-day plan" }).click();
    await expect(page).toHaveURL(/\/onboarding\/checkout\/success\?session_id=cs_analytics_checkout/, {
      timeout: 60000,
    });
    await expect(
      page.getByRole("heading", { name: "Your 14-day plan is ready" })
    ).toBeVisible({ timeout: 60000 });
    await expect
      .poll(async () => (await getAnalyticsEvents(page)).some((event) => event.name === "paid"))
      .toBe(true);

    const events = await getAnalyticsEvents(page);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          name: "quiz_start",
          props: { surface: "onboarding", step: "eligibility" },
        },
        {
          name: "quiz_submit",
          props: { surface: "onboarding", result: "eligible" },
        },
        {
          name: "checkout_start",
          props: { surface: "personalized_summary" },
        },
        {
          name: "paid",
          props: {
            surface: "checkout_success",
            source: "checkout_success",
            plan_ready: true,
          },
        },
      ])
    );
    expectNoPrivateAnalyticsData(events);
  });

  test("paid usage analytics cover day, chat, report, and share without private payloads", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    test.skip(
      test.info().project.name !== "Desktop Chrome",
      "Paid usage analytics coverage only runs once."
    );
    await installPlausibleMock(page);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => undefined,
      });
    });

    const email = `${Date.now()}-analytics-paid@example.com`;
    const userId = await seedDevUser(email);
    const programId = await seedPaidProgram({
      userId,
      currentDay: 1,
      status: ProgramStatus.ACTIVE,
    });
    await signInAs(page, email);
    await page.route("**/api/program/day/1/complete", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          message: "Day marked complete. Your program progress has been updated.",
          completedDay: 1,
          currentDay: 2,
          totalDays: 14,
          completionPercent: 100,
          programStatus: "ACTIVE",
        }),
      });
    });

    await page.goto("/day/1");
    await page.getByRole("button", { name: "Mark day complete" }).click();
    const confirmButton = page.getByRole("button", { name: "Complete day anyway" });

    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await expect
      .poll(async () =>
        (await getAnalyticsEvents(page)).some((event) => event.name === "day_completed")
      )
      .toBe(true);

    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/x-ndjson; charset=utf-8",
        body: [
          JSON.stringify({ type: "user", content: "redacted in test" }),
          JSON.stringify({ type: "status", message: "Checking safety signals..." }),
          JSON.stringify({
            type: "escalation",
            message: "Contact a clinician promptly for urgent warning signs.",
            matchedTerms: ["redacted"],
          }),
          JSON.stringify({ type: "done" }),
          "",
        ].join("\n"),
      });
    });
    await page.goto("/chat");
    await page.getByTestId("chat-input").fill("My finger is blue and numb.");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-escalation-warning")).toBeVisible();

    await prisma.program.update({
      where: { id: programId },
      data: { status: ProgramStatus.COMPLETED, currentDay: 14 },
    });
    await prisma.programDay.update({
      where: { programId_dayIndex: { programId, dayIndex: 14 } },
      data: { completedAt: new Date(), completionPercent: 100 },
    });

    await page.goto("/completion");
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("completion-report-download").click();
    await downloadPromise;

    await page.getByTestId("completion-share-action").click();
    await expect(page.getByTestId("completion-share-feedback")).toContainText(
      "Share link ready"
    );

    const events = await getAnalyticsEvents(page);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          name: "day_completed",
          props: { surface: "day", day: 1, program_completed: false },
        },
        { name: "chat_sent", props: { surface: "chat" } },
        { name: "chat_escalated", props: { surface: "chat" } },
        {
          name: "completion_report_view",
          props: { surface: "completion" },
        },
        {
          name: "share_click",
          props: {
            surface: "completion",
            method: "native",
            outcome: "success",
          },
        },
      ])
    );
    expectNoPrivateAnalyticsData(events);
  });
});
