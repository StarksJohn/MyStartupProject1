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
  await page.goto("/sign-in?callbackUrl=%2Fonboarding");
  await page.getByLabel("Email address").fill(email);

  const devLoginButton = page.getByRole("button", {
    name: "Continue as test user",
  });
  await expect(devLoginButton).toBeEnabled();
  await devLoginButton.click();
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

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/day/5");
    await expect(page.getByTestId("day-recovery-header")).toBeInViewport();
    await expect(page.getByTestId("today-focus")).toBeInViewport({
      ratio: 0.2,
    });
  });

  test("future day requests redirect back to current day", async ({ page }) => {
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
    await expect(page).toHaveURL(/\/day\/3$/);
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
      redirectTo: "/onboarding",
    });

    await page.goto("/day/4");
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByTestId("progress-fallback")).toBeVisible();
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
      redirectTo: "/onboarding",
    });

    await page.goto("/day/6");
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
