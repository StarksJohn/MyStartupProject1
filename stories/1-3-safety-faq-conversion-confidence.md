# Story 1.3: Safety, FAQ, and Conversion Confidence

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a cautious prospective user,
I want to understand safety boundaries, eligibility, pricing, and refund concerns before I click pay,
so that I can trust the product without feeling tricked.

## Acceptance Criteria

1. **AC1 - Lower landing sections follow the approved trust order**
   **Given** a user reviews the landing page
   **When** they scroll below `What You Get`
   **Then** they see `Safety / Disclaimer`, `FAQ`, and `Footer CTA` in that order
   **And** each section reinforces trust without introducing a new route, checkout flow, or onboarding implementation.

2. **AC2 - Safety / Disclaimer is explicit and actionable**
   **Given** a cautious user reads the safety section
   **When** they review the copy
   **Then** it clearly states the product is informational, not a medical device, not for diagnosis, and not a replacement for a clinician
   **And** it names danger signs such as severe pain, numbness, discoloration, fever, or symptoms that feel urgent
   **And** it links to `/legal/disclaimer` for the full medical disclaimer.

3. **AC3 - FAQ handles primary conversion objections**
   **Given** a user reaches the FAQ section
   **When** they inspect the available questions
   **Then** they can find answers for `Who is this for?`, `Who is this not for?`, `How much does it cost?`, and `What if it is not right for me?`
   **And** answers mention the target finger/metacarpal cast-removal window, one-time `$14.99` pricing, no subscription, and refund/support expectations without overpromising medical results.

4. **AC4 - FAQ interaction is accessible by pointer and keyboard**
   **Given** a user interacts with the FAQ
   **When** they use mouse, touch, Tab, Enter, or Space
   **Then** FAQ answers can be opened and closed predictably
   **And** the implementation exposes correct accessible names and expanded/collapsed state for assistive technology.

5. **AC5 - Footer CTA closes the landing conversion path**
   **Given** a user has read the safety and FAQ sections
   **When** they reach the final CTA
   **Then** the page repeats one primary `Start my 2-minute quiz` CTA pointing to `/onboarding`
   **And** it includes short trust-supporting copy that summarizes the 14-day plan, safety boundary, and one-time payment.

6. **AC6 - Existing shell and Story 1.2 regressions remain protected**
   **Given** the Story 1.1 marketing shell and Story 1.2 landing sections are already complete
   **When** Story 1.3 is implemented
   **Then** header, footer, legal pages, 404 behavior, current hero/CTA assertions, section order checks, and mobile no-horizontal-overflow E2E coverage continue to pass
   **And** no analytics, Stripe checkout, onboarding form, eligibility gate, blog/SEO content, or AI safety runtime behavior is implemented in this story.

## Tasks / Subtasks

- [x] **T1 - Expand Safety / Disclaimer section** (AC: 1, 2, 6)
  - [x] 1.1 Keep the existing `data-testid="landing-safety"` section directly after `landing-what-you-get`.
  - [x] 1.2 Replace the current short disclaimer block with a stronger trust section that covers: informational only, not a medical device, not diagnosis, not treatment replacement.
  - [x] 1.3 Include danger-sign copy for severe pain, numbness, discoloration, fever, or urgent symptoms.
  - [x] 1.4 Add an accessible link to `/legal/disclaimer`.

- [x] **T2 - Add FAQ section below Safety** (AC: 1, 3, 4, 6)
  - [x] 2.1 Add `data-testid="landing-faq"` after `landing-safety`.
  - [x] 2.2 Include exactly four initial FAQ items: `Who is this for?`, `Who is this not for?`, `How much does it cost?`, `What if it is not right for me?`.
  - [x] 2.3 Keep copy short, English-only, and aligned with the overseas B2C cast-removal audience.
  - [x] 2.4 Implement accessible open/close behavior via native `<details>/<summary>` or a small focused client component with `button`, `aria-expanded`, and `aria-controls`.

- [x] **T3 - Add Footer CTA section before the global footer** (AC: 1, 5, 6)
  - [x] 3.1 Add `data-testid="landing-footer-cta"` after `landing-faq` and before the route-level `MarketingFooter`.
  - [x] 3.2 Use primary CTA text exactly `Start my 2-minute quiz` and link to `/onboarding`.
  - [x] 3.3 Include concise confidence copy: 14-day plan, one-time `$14.99`, and medical-boundary reminder.
  - [x] 3.4 Do not add secondary CTAs that compete with the primary CTA.

- [x] **T4 - Preserve current architecture and scope boundaries** (AC: 6)
  - [x] 4.1 Keep `/` in `src/app/(marketing)/page.tsx`; do not create a new landing route.
  - [x] 4.2 Reuse `Button` and Tailwind utility patterns already present in the project.
  - [x] 4.3 Do not add new dependencies or shadcn components for this story.
  - [x] 4.4 Keep legal route pages unchanged unless an E2E regression proves a direct fix is needed.

- [x] **T5 - Update Playwright coverage for Story 1.3** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1 Update `e2e/marketing-shell.spec.ts`; do not create a second E2E file unless it becomes too large.
  - [x] 5.2 Assert section order: `landing-safety` before `landing-faq` before `landing-footer-cta`.
  - [x] 5.3 Assert representative safety copy and the `/legal/disclaimer` link.
  - [x] 5.4 Assert the four FAQ questions and at least one answer after keyboard or pointer interaction.
  - [x] 5.5 Assert the Footer CTA text and `href="/onboarding"`.
  - [x] 5.6 Preserve Story 1.2 assertions and mobile no-horizontal-overflow coverage.
  - [x] 5.7 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` after implementation.

### Review Findings

- [x] [Review][Patch] Refund FAQ mentioned the refund policy but did not provide a reachable `/legal/refund` link — fixed with a direct `Read the refund policy` link. [`src/components/marketing/landing-faq.tsx`]
- [x] [Review][Patch] E2E only opened the pricing FAQ and did not protect the target-user, not-for, refund/support answer copy or pointer/Tab interaction paths — fixed with expanded FAQ assertions and interaction coverage. [`e2e/marketing-shell.spec.ts`]

## Dev Notes

### Product and UX Intent

- Story 1.3 completes the lower-conversion half of the approved Landing structure: `Safety / Disclaimer`, `FAQ`, and `Footer CTA`.
- The user mindset is cautious: they understand the value after Story 1.2, but need confidence that the product is safe, honest about eligibility, clear about price, and not a medical substitute.
- Keep the tone calm and direct. The page should reduce anxiety and objections, not sound like aggressive sales copy.
- Primary CTA remains fixed: `Start my 2-minute quiz`.
- The product remains an English-only website for overseas users.
- Medical boundary must remain explicit: education and companion only, not diagnosis, not treatment replacement.
- Source: `epics.md` Story 1.3, `UX设计规格说明.md` §5.3-§5.7, `技术架构详细设计.md` §7.1 and §7.5, `产品Brief.md` §1, §5, §6, §8.

### Current Real Code Baseline

- `src/app/(marketing)/page.tsx` is the real landing implementation to extend.
- Current section order is:
  - `landing-hero`
  - `landing-pain-points`
  - `landing-how-it-works` with `id="how-it-works"` and `scroll-mt-20`
  - `landing-what-you-get`
  - `landing-safety`
- `landing-safety` currently exists as a short disclaimer block. Story 1.3 should expand it in place, not create a duplicate safety section.
- `src/components/marketing/marketing-header.tsx` already has the fixed primary CTA `Start my 2-minute quiz` pointing to `/onboarding`.
- `src/components/marketing/marketing-footer.tsx` already renders legal links and should remain the global footer. The new Footer CTA is a landing-page section before the global footer, not a replacement for `MarketingFooter`.
- `src/app/(marketing)/legal/disclaimer/page.tsx` already contains baseline full-disclaimer copy and `data-testid="legal-disclaimer"`.
- `src/app/(marketing)/legal/refund/page.tsx` is still placeholder-level. Do not make strong refund promises beyond the project-approved support/refund expectation.
- `e2e/marketing-shell.spec.ts` currently has Story 1.2 assertions for hero value, CTA hrefs, section order, anchor offset, legal routes, 404, and mobile no-horizontal-overflow.

### Required Implementation Pattern

- Extend `src/app/(marketing)/page.tsx`; do not create a new landing page or route group.
- Keep `LandingPage` as a Server Component if using native `<details>/<summary>` for FAQ.
- If enforcing "single FAQ item open at a time", create a small focused client component such as `src/components/marketing/landing-faq.tsx`; do not add a generic accordion abstraction unless it is truly needed.
- If a client FAQ component is created:
  - Put `"use client"` only in that component.
  - Keep FAQ state local.
  - Use semantic `button` controls with `aria-expanded` and `aria-controls`.
  - Export one component with internal static FAQ items or accept typed item props from the page.
- Reuse `Button` from `src/components/ui/button.tsx` for the Footer CTA.
- Reuse existing Tailwind 4 utility classes and the `.container` helper from `src/app/globals.css`.
- Do not add Radix Accordion, new shadcn components, analytics packages, form libraries, payment code, or content loaders in this story.

### Content Guardrails

- FAQ content should answer these objections:
  - `Who is this for?`: adults recovering from finger or metacarpal fractures around cast removal, after receiving clinician care.
  - `Who is this not for?`: emergencies, worsening symptoms, unassessed injuries, complex cases that need direct clinician guidance, or anyone told not to move yet.
  - `How much does it cost?`: one-time `$14.99` purchase for the 14-day companion; no subscription.
  - `What if it is not right for me?`: point users to refund/support expectations and `/legal/refund` without inventing finalized Stripe/refund workflow details.
- Safety copy must include:
  - `not a medical device`,
  - `not for diagnosis`,
  - `does not replace your doctor or physical therapist`,
  - danger signs that should trigger contacting a clinician or urgent care.
- Avoid claims such as `doctor-approved`, `guaranteed recovery`, `cure`, `treatment plan`, `clinically proven`, or `FDA compliant`.
- Do not imply the quiz determines medical eligibility with certainty. Epic 2 owns the actual Eligibility & Safety Gate.

### Testing Requirements

- Update `e2e/marketing-shell.spec.ts` with targeted assertions for Story 1.3.
- Preserve existing tests:
  - hero heading includes `critical 2 weeks after cast removal`,
  - header and hero CTA point to `/onboarding`,
  - `#how-it-works` anchor is not hidden under the sticky header,
  - `landing-pain-points`, `landing-how-it-works`, `landing-what-you-get`, and `landing-safety` remain visible,
  - legal routes and 404 continue to work,
  - mobile no-horizontal-overflow remains covered.
- Add or update landing assertions for:
  - section order from `landing-safety` to `landing-faq` to `landing-footer-cta`,
  - safety copy and `/legal/disclaimer` link,
  - all four FAQ questions,
  - FAQ open/close via pointer and preferably keyboard,
  - Footer CTA text and `href="/onboarding"`.
- Run after implementation:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e`

### Scope Exclusions

- No `/onboarding` implementation.
- No Eligibility & Safety Gate form logic; Story 2.2 owns it.
- No Stripe checkout, payment intent, webhook, refund automation, or Magic Link.
- No analytics events (`faq_expand`, `unsupported_warning_view`, `cta_click`); Epic 7 owns tracking.
- No public SEO blog or public FAQ article route; Story 1.4 owns public trust content and SEO entry pages.
- No AI danger-escalation runtime behavior; Story 5.3 owns Chat safety guardrails.
- No edits to Prisma schema or API routes.

### Project Structure Notes

- Files expected to change:
  - `src/app/(marketing)/page.tsx`
  - `e2e/marketing-shell.spec.ts`
- Optional file if a controlled FAQ is preferred:
  - `src/components/marketing/landing-faq.tsx`
- Files expected to remain unchanged unless regression requires otherwise:
  - `src/components/marketing/marketing-header.tsx`
  - `src/components/marketing/marketing-footer.tsx`
  - `src/app/(marketing)/legal/**/page.tsx`
  - `src/components/ui/button.tsx`
  - `playwright.config.ts`
  - `prisma/schema.prisma`

### Previous Story Intelligence

- Story 1.2 is authoritative as `done` in `stories/sprint-status.yaml`.
- Story 1.2 established the current landing content arrays inside `src/app/(marketing)/page.tsx` and kept the page as a Server Component.
- Story 1.2 code review found that anchor targets can be hidden by the sticky header; the fix was `scroll-mt-20` plus E2E viewport assertion. Preserve this pattern for any new in-page anchors.
- Story 1.2 E2E now checks section order and mobile overflow. Add Story 1.3 checks to the same spec instead of weakening existing assertions.
- The Playwright mobile project intentionally uses `devices["Pixel 5"]` plus `browserName: "chromium"` to avoid WebKit downloads. Do not switch it back to an iPhone/WebKit preset.
- Recent git commit titles are not descriptive (`1`), so rely on story files and actual code rather than commit messages for implementation context.

### References

- `epics.md` §Requirements Inventory, §UX Design Requirements, Epic 1 Story 1.3.
- `UX设计规格说明.md` §5.3-§5.7 Landing page sections, FAQ interaction, low-trust recovery, and story split.
- `技术架构详细设计.md` §6 Code Structure, §7.1 Public Routes, §7.5 Landing Page.
- `产品Brief.md` §1 Executive Summary, §5 Product Scope, §6 MVP, §8 Risk and Mitigation.
- `项目主档案.md` current phase and Story 1.2 completion record.
- `stories/1-2-landing-hero-core-value.md` previous story intelligence and review fixes.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- `pnpm test:e2e` failed after adding Story 1.3 assertions, as expected, because the old page lacked `landing-faq`, `landing-footer-cta`, and the stronger safety copy.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e` passed: 12 tests across Desktop Chrome and Mobile Chrome.
- Lightweight code-review follow-up passed after patch fixes: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` all passed.

### Completion Notes List

- Expanded `landing-safety` with explicit medical boundaries, danger-sign guidance, and a link to `/legal/disclaimer`.
- Added an accessible FAQ client component with four conversion-objection questions, keyboard/pointer open-close behavior, `aria-expanded`, and `aria-controls`.
- Added a landing `landing-footer-cta` section with the fixed `Start my 2-minute quiz` CTA pointing to `/onboarding`.
- Preserved Story 1.1 / Story 1.2 shell behavior, section order, legal routes, 404 route, and mobile no-horizontal-overflow coverage.
- Added Story 1.3 E2E assertions and verified red-green behavior.
- Resolved review findings by linking refund FAQ to `/legal/refund` and expanding E2E coverage for all FAQ answer copy plus click, Tab, Enter, and Space interactions.

### File List

- `src/app/(marketing)/page.tsx`
- `src/components/marketing/landing-faq.tsx`
- `e2e/marketing-shell.spec.ts`
- `stories/1-3-safety-faq-conversion-confidence.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
