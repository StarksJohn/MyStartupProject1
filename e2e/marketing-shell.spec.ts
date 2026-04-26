/**
 * Marketing shell smoke E2E.
 *
 * Purpose: prove the public landing page renders on both mobile and desktop,
 * keeps the expected global chrome, and exposes the Story 1.2 landing value
 * narrative without regressing legal/404 routes.
 */
import { expect, test } from "@playwright/test";

test.describe("marketing shell", () => {
  test("home page renders hero, header, footer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /critical 2 weeks after cast removal/i
    );

    await expect(page.getByTestId("marketing-header")).toBeVisible();
    await expect(page.getByTestId("marketing-footer")).toBeVisible();
    await expect(page.getByTestId("landing-pain-points")).toBeVisible();
    await expect(page.getByTestId("landing-how-it-works")).toBeVisible();
    await expect(page.getByTestId("landing-what-you-get")).toBeVisible();
    await expect(page.getByTestId("landing-safety")).toBeVisible();
    await expect(page.getByTestId("landing-faq")).toBeVisible();
    await expect(page.getByTestId("landing-footer-cta")).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Cast removal should feel like progress, not guesswork.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "A simple path from anxiety search to daily action.",
      })
    ).toBeVisible();
    await expect(
      page.getByText("Daily exercise cards with clear reps")
    ).toBeVisible();

    const sectionOrder = await page.evaluate(() => {
      const painPoints = document
        .querySelector('[data-testid="landing-pain-points"]')
        ?.getBoundingClientRect().top;
      const howItWorks = document
        .querySelector('[data-testid="landing-how-it-works"]')
        ?.getBoundingClientRect().top;
      const whatYouGet = document
        .querySelector('[data-testid="landing-what-you-get"]')
        ?.getBoundingClientRect().top;
      const safety = document
        .querySelector('[data-testid="landing-safety"]')
        ?.getBoundingClientRect().top;
      const faq = document
        .querySelector('[data-testid="landing-faq"]')
        ?.getBoundingClientRect().top;
      const footerCta = document
        .querySelector('[data-testid="landing-footer-cta"]')
        ?.getBoundingClientRect().top;

      return { painPoints, howItWorks, whatYouGet, safety, faq, footerCta };
    });

    expect(sectionOrder.painPoints).toBeDefined();
    expect(sectionOrder.howItWorks).toBeDefined();
    expect(sectionOrder.whatYouGet).toBeDefined();
    expect(sectionOrder.safety).toBeDefined();
    expect(sectionOrder.faq).toBeDefined();
    expect(sectionOrder.footerCta).toBeDefined();
    expect(sectionOrder.painPoints ?? 0).toBeLessThan(
      sectionOrder.howItWorks ?? 0
    );
    expect(sectionOrder.howItWorks ?? 0).toBeLessThan(
      sectionOrder.whatYouGet ?? 0
    );
    expect(sectionOrder.whatYouGet ?? 0).toBeLessThan(sectionOrder.safety ?? 0);
    expect(sectionOrder.safety ?? 0).toBeLessThan(sectionOrder.faq ?? 0);
    expect(sectionOrder.faq ?? 0).toBeLessThan(sectionOrder.footerCta ?? 0);

    await expect(page).toHaveTitle(/Fracture Recovery Companion/i);
  });

  test("header exposes get-started CTA and primary nav", async ({ page }) => {
    await page.goto("/");

    const header = page.getByTestId("marketing-header");
    await expect(
      header.getByRole("link", { name: /how it works/i })
    ).toBeVisible();

    const headerCta = header.getByRole("link", {
      name: "Start my 2-minute quiz",
    });
    await expect(headerCta).toBeVisible();
    await expect(headerCta).toHaveAttribute("href", "/onboarding");

    const hero = page.getByTestId("landing-hero");
    const heroCta = hero.getByRole("link", {
      name: "Start my 2-minute quiz",
    });
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute("href", "/onboarding");
    await expect(
      hero.getByRole("link", { name: "See how the 14-day plan works" })
    ).toHaveAttribute("href", "#how-it-works");

    await header.getByRole("link", { name: /how it works/i }).click();
    await expect(page.getByTestId("landing-how-it-works")).toBeInViewport();

    const anchorPosition = await page.evaluate(() => {
      const headerEl = document.querySelector('[data-testid="marketing-header"]');
      const targetEl = document.querySelector('[data-testid="landing-how-it-works"]');
      const headerBottom = headerEl?.getBoundingClientRect().bottom ?? 0;
      const targetTop = targetEl?.getBoundingClientRect().top ?? 0;

      return { headerBottom, targetTop };
    });

    expect(anchorPosition.targetTop).toBeGreaterThanOrEqual(
      anchorPosition.headerBottom
    );
  });

  test("landing safety, FAQ, and footer CTA reduce trust objections", async ({
    page,
  }) => {
    await page.goto("/");

    const safety = page.getByTestId("landing-safety");
    await expect(safety).toContainText(/not a medical device/i);
    await expect(safety).toContainText(/not for diagnosis/i);
    await expect(safety).toContainText(/does not replace your doctor/i);
    await expect(safety).toContainText(/severe pain/i);
    await expect(safety.getByRole("link", { name: /medical disclaimer/i })).toHaveAttribute(
      "href",
      "/legal/disclaimer"
    );

    const faq = page.getByTestId("landing-faq");
    const forQuestion = faq.getByRole("button", { name: "Who is this for?" });
    const notForQuestion = faq.getByRole("button", {
      name: "Who is this not for?",
    });
    const costQuestion = faq.getByRole("button", {
      name: "How much does it cost?",
    });
    const refundQuestion = faq.getByRole("button", {
      name: "What if it is not right for me?",
    });

    await expect(forQuestion).toHaveAttribute("aria-expanded", "false");
    await expect(notForQuestion).toBeVisible();
    await expect(costQuestion).toBeVisible();
    await expect(refundQuestion).toBeVisible();

    await forQuestion.click();
    await expect(forQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(
      faq.getByText(/adults recovering from finger or metacarpal fractures/i)
    ).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(notForQuestion).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(notForQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(faq.getByText(/not for emergencies/i)).toBeVisible();

    await costQuestion.focus();
    await page.keyboard.press("Enter");
    await expect(costQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(faq.getByText(/one-time \$14\.99 purchase/i)).toBeVisible();
    await page.keyboard.press("Space");
    await expect(costQuestion).toHaveAttribute("aria-expanded", "false");

    await refundQuestion.click();
    await expect(refundQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(faq.getByText(/not a fit/i)).toBeVisible();
    await expect(
      faq.getByRole("link", { name: /read the refund policy/i })
    ).toHaveAttribute("href", "/legal/refund");

    const footerCta = page.getByTestId("landing-footer-cta");
    await expect(footerCta).toContainText(/14-day companion/i);
    await expect(footerCta).toContainText(/one-time \$14\.99/i);
    await expect(footerCta).toContainText(/not a medical device/i);
    await expect(
      footerCta.getByRole("link", { name: "Start my 2-minute quiz" })
    ).toHaveAttribute("href", "/onboarding");
  });

  test("mobile landing has no horizontal overflow", async ({ page }) => {
    await page.goto("/");

    const widths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth);
    expect(widths.bodyScrollWidth).toBeLessThanOrEqual(widths.innerWidth);
  });

  test("public trust article renders SEO content and onboarding CTA", async ({
    page,
  }) => {
    await page.goto("/blog/finger-stiff-after-cast-removal");

    const article = page.getByTestId("blog-article");

    await expect(page).toHaveTitle(/Finger Still Stiff After Cast Removal/i);
    await expect(article.getByRole("heading", { level: 1 })).toContainText(
      /Finger Still Stiff After Cast Removal/i
    );
    await expect(
      article.getByText(/moment often arrives with very little day-by-day guidance/i)
    ).toBeVisible();
    await expect(article.getByText(/not a diagnosis or treatment plan/i)).toBeVisible();
    await expect(article.getByText(/if pain is severe, numbness appears/i)).toBeVisible();
    await expect(
      article.getByRole("link", { name: /medical disclaimer/i })
    ).toHaveAttribute("href", "/legal/disclaimer");
    await expect(
      article.getByRole("link", { name: "Start my 2-minute quiz" })
    ).toHaveAttribute("href", "/onboarding");
  });

  test("unknown blog slug renders not-found page", async ({ page }) => {
    const res = await page.goto("/blog/unknown-recovery-topic");

    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /couldn/i
    );
  });

  test("footer links resolve all 4 legal placeholder pages", async ({ page }) => {
    const legalPaths = [
      { path: "/legal/privacy", testId: "legal-privacy", title: /Privacy Policy/i },
      { path: "/legal/terms", testId: "legal-terms", title: /Terms of Service/i },
      { path: "/legal/refund", testId: "legal-refund", title: /Refund Policy/i },
      { path: "/legal/disclaimer", testId: "legal-disclaimer", title: /Medical Disclaimer/i },
    ];

    for (const { path, testId, title } of legalPaths) {
      await page.goto(path);
      await expect(page.getByTestId(testId)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
      await expect(page.getByTestId("marketing-footer")).toBeVisible();
    }
  });

  test("unknown route renders not-found page", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /couldn/i
    );
  });
});
