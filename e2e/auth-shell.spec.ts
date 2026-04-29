import { expect, test } from "@playwright/test";

async function signInForOnboarding(page: import("@playwright/test").Page) {
  const email = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  await page.goto("/sign-in?callbackUrl=%2Fonboarding");
  await page.getByLabel("Email address").fill(email);
  await expect(page.getByLabel("Email address")).toHaveValue(email);

  const devLoginButton = page.getByRole("button", {
    name: "Continue as test user",
  });
  await expect(devLoginButton).toBeEnabled();
  await devLoginButton.click();
  await expect(page).toHaveURL(/\/onboarding$/);
}

async function checkEligibilityOption(
  page: import("@playwright/test").Page,
  name: string,
  value: string
) {
  const option = page.locator(`#${name}-${value}`);
  await option.check();
  await expect(option).toBeChecked();
}

async function waitForEligibilityGate(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("button", { name: "Check eligibility" })
  ).toBeEnabled();
}

async function submitEligibleGate(page: import("@playwright/test").Page) {
  await checkEligibilityOption(page, "clinicianEvaluated", "yes");
  await checkEligibilityOption(
    page,
    "immobilizationStatus",
    "removed_or_near_removal"
  );
  await checkEligibilityOption(page, "injuryArea", "finger_or_metacarpal");
  await checkEligibilityOption(page, "hasRedFlags", "no");
  await page.getByRole("button", { name: "Check eligibility" }).click();
}

async function continueToRecoveryProfile(page: import("@playwright/test").Page) {
  await submitEligibleGate(page);
  await page
    .getByRole("button", { name: "Continue to Recovery Profile" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recovery Profile" })
  ).toBeVisible();
}

async function saveRecoveryProfile(page: import("@playwright/test").Page) {
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

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

test.describe("auth identity shell", () => {
  test.describe.configure({ mode: "serial" });

  test("sign-in page renders passwordless Magic Link form", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByRole("heading", { name: /sign in with a secure magic link/i })
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send magic link" })
    ).toBeVisible();
    await expect(page.getByText(/no password required/i)).toBeVisible();
  });

  test("onboarding redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fonboarding/);
    await expect(
      page.getByRole("heading", { name: /sign in with a secure magic link/i })
    ).toBeVisible();
  });

  test("checkout success redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/onboarding/checkout/success");

    await expect(page).toHaveURL(
      /\/sign-in\?callbackUrl=%2Fonboarding%2Fcheckout%2Fsuccess/
    );
    await expect(
      page.getByRole("heading", { name: /sign in with a secure magic link/i })
    ).toBeVisible();
  });

  test("checkout cancelled redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/onboarding/checkout/cancelled");

    await expect(page).toHaveURL(
      /\/sign-in\?callbackUrl=%2Fonboarding%2Fcheckout%2Fcancelled/
    );
    await expect(
      page.getByRole("heading", { name: /sign in with a secure magic link/i })
    ).toBeVisible();
  });

  test("development login opens the eligibility gate", async ({
    page,
  }) => {
    await signInForOnboarding(page);

    await expect(
      page.getByRole("heading", { name: /eligibility & safety gate/i })
    ).toBeVisible();
    await expect(page.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(
      page.getByText(/educational support, not diagnosis or treatment/i)
    ).toBeVisible();
    await expect(
      page.getByText(/identity ready for onboarding/i)
    ).not.toBeVisible();
  });

  test("eligible answers show continuation state", async ({ page }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await submitEligibleGate(page);

    await expect(
      page.getByRole("heading", {
        name: /you look within the first version's scope/i,
      })
    ).toBeVisible();
    await expect(
      page.getByText(/recovery profile step is next/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to Recovery Profile" })
    ).toBeVisible();
  });

  test("eligible users can reach Recovery Profile step", async ({ page }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await continueToRecoveryProfile(page);

    await expect(page.getByText(/step 2 of 3/i)).toBeVisible();
    await expect(page.getByText(/profile part 1 of 3/i)).toBeVisible();
    await expect(page.getByLabel("Subtype or short injury description")).toBeVisible();
  });

  test("empty eligibility submit shows required answer validation", async ({
    page,
  }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await page.getByRole("button", { name: "Check eligibility" }).click();

    await expect(
      page.getByText("Choose whether a clinician has evaluated this injury.")
    ).toBeVisible();
    await expect(
      page.getByText("Choose your current cast or immobilization status.")
    ).toBeVisible();
    await expect(
      page.getByText(
        "Choose whether your injury is within the first version's scope."
      )
    ).toBeVisible();
    await expect(
      page.getByText("Choose whether urgent warning signs are present.")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /you look within the first version's scope/i,
      })
    ).not.toBeVisible();
  });

  test("changing answers after submit clears stale outcome", async ({ page }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await checkEligibilityOption(page, "clinicianEvaluated", "yes");
    await checkEligibilityOption(
      page,
      "immobilizationStatus",
      "removed_or_near_removal"
    );
    await checkEligibilityOption(page, "injuryArea", "finger_or_metacarpal");
    await checkEligibilityOption(page, "hasRedFlags", "no");
    await page.getByRole("button", { name: "Check eligibility" }).click();

    await expect(
      page.getByRole("heading", {
        name: /you look within the first version's scope/i,
      })
    ).toBeVisible();

    await checkEligibilityOption(page, "hasRedFlags", "yes");

    await expect(
      page.getByRole("heading", {
        name: /you look within the first version's scope/i,
      })
    ).not.toBeVisible();
  });

  test("out-of-scope answers stop before profile capture", async ({ page }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await checkEligibilityOption(page, "clinicianEvaluated", "no");
    await checkEligibilityOption(
      page,
      "immobilizationStatus",
      "removed_or_near_removal"
    );
    await checkEligibilityOption(page, "injuryArea", "finger_or_metacarpal");
    await checkEligibilityOption(page, "hasRedFlags", "no");
    await page.getByRole("button", { name: "Check eligibility" }).click();

    await expect(
      page.getByRole("heading", {
        name: /this first version is not designed for your situation/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to landing page" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Read the medical disclaimer" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to Recovery Profile" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recovery Profile" })
    ).not.toBeVisible();
  });

  test("red-flag answers show clinician-attention state", async ({ page }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);

    await checkEligibilityOption(page, "clinicianEvaluated", "yes");
    await checkEligibilityOption(
      page,
      "immobilizationStatus",
      "removed_or_near_removal"
    );
    await checkEligibilityOption(page, "injuryArea", "finger_or_metacarpal");
    await checkEligibilityOption(page, "hasRedFlags", "yes");
    await page.getByRole("button", { name: "Check eligibility" }).click();

    await expect(
      page.getByRole("heading", {
        name: /this product cannot guide urgent or unusual symptoms/i,
      })
    ).toBeVisible();
    await expect(
      page.getByText(/contact a clinician or seek urgent care/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to Recovery Profile" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recovery Profile" })
    ).not.toBeVisible();
  });

  test("recovery profile validation blocks incomplete submission", async ({
    page,
  }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);
    await continueToRecoveryProfile(page);

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(
      page.getByText("Describe the subtype in at least 2 characters.")
    ).toBeVisible();
    await expect(page.getByText("Enter a valid cast removal date.")).toBeVisible();
    await expect(page.getByText(/profile part 1 of 3/i)).toBeVisible();
  });

  test("valid recovery profile submission reaches personalized summary", async ({
    page,
  }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);
    await continueToRecoveryProfile(page);

    await page
      .getByLabel("Subtype or short injury description")
      .fill("proximal phalanx stiffness");
    await page
      .getByLabel("Cast or splint removal date")
      .fill(getLocalDateInputValue());
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await page.getByLabel("Current pain level, 0 to 10").fill("3");
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await page.getByLabel("Work or daily-use category").selectOption("desk");
    await page
      .getByLabel("Optional notes for plan mapping")
      .fill("Typing is the main daily challenge.");
    await saveRecoveryProfile(page);

    await expect(
      page.getByRole("heading", { name: "Personalized Summary" })
    ).toBeVisible();
    await expect(
      page.getByText(/you are in day \d+ of the critical 2-week window/i)
    ).toBeVisible();
    await expect(page.getByText("$14.99 one-time")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /unlock my 14-day plan/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recovery Profile saved" })
    ).not.toBeVisible();
  });

  test("checkout CTA uses dev fallback and reaches success page", async ({
    page,
  }) => {
    await signInForOnboarding(page);
    await waitForEligibilityGate(page);
    await continueToRecoveryProfile(page);

    await page
      .getByLabel("Subtype or short injury description")
      .fill("proximal phalanx stiffness");
    await page
      .getByLabel("Cast or splint removal date")
      .fill(getLocalDateInputValue());
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await page.getByLabel("Current pain level, 0 to 10").fill("3");
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await page.getByLabel("Work or daily-use category").selectOption("desk");
    await saveRecoveryProfile(page);

    const checkoutButton = page.getByRole("button", {
      name: "Unlock my 14-day plan",
    });
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    await expect(page).toHaveURL(
      /\/onboarding\/checkout\/success\?session_id=dev_mock/
    );
    await expect(
      page.getByRole("heading", { name: "We are confirming your payment" })
    ).toBeVisible();
    await expect(
      page.getByText(/personalized plan will be unlocked shortly/i)
    ).toBeVisible();
    await expect(page.getByText(/Day 1 program is shown yet/i)).toBeVisible();
  });

  test("authenticated users see checkout cancelled recovery paths", async ({
    page,
  }) => {
    await signInForOnboarding(page);

    await page.goto("/onboarding/checkout/cancelled");

    await expect(
      page.getByRole("heading", { name: "No payment was completed" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to onboarding" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Read the refund policy" })
    ).toBeVisible();
  });
});
