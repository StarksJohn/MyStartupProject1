import { expect, test, type Page } from "@playwright/test";
import {
  Prisma,
  PrismaClient,
  ProgramStatus,
  PurchaseStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const createdUserIds = new Set<string>();

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

  test("day 14 completion marks program completed", async ({ page }) => {
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

    const response = await page.request.post("/api/program/day/14/complete");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "completed",
      completedDay: 14,
      currentDay: 14,
      completionPercent: 100,
      programStatus: ProgramStatus.COMPLETED,
    });

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
  });
});
