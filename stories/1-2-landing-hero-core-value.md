# Story 1.2: Landing Hero and Core Value Narrative

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a target user in the cast-removal window,
I want to immediately understand what this product is and why it is relevant now,
so that I can decide within seconds whether to start the quiz.

## Acceptance Criteria

1. **AC1 - Hero communicates the critical two-week value proposition**
   **Given** a user opens `/`
   **When** the hero section loads on mobile or desktop
   **Then** the hero clearly states that the product helps during the critical two weeks after cast removal
   **And** it explains the product as a structured 14-day recovery companion, not a generic wellness blog.

2. **AC2 - Primary CTA is consistent and quiz-oriented**
   **Given** a user views the hero
   **When** they inspect the primary CTA
   **Then** the CTA text is exactly `Start my 2-minute quiz`
   **And** header and hero CTAs use the same primary CTA language
   **And** the CTA points toward the future onboarding entry (`/onboarding`) without implementing the onboarding flow in this story.

3. **AC3 - Secondary CTA scrolls to the 14-day plan explanation**
   **Given** a user is not ready to start immediately
   **When** they click the secondary CTA
   **Then** it scrolls to the How It Works section
   **And** the secondary CTA text is `See how the 14-day plan works`.

4. **AC4 - Core marketing sections render in the approved order**
   **Given** a user scrolls below the hero
   **When** they view the core landing sections
   **Then** they see `Pain Points`, `How It Works`, and `What You Get` in that order
   **And** each section reinforces anxiety relief and action clarity rather than generic wellness messaging.

5. **AC5 - Landing remains mobile-first and regression-safe**
   **Given** the Story 1.1 marketing shell is already complete
   **When** Story 1.2 changes are implemented
   **Then** existing header, footer, legal pages, Sentry wiring, providers, and `not-found` behavior continue to pass smoke tests
   **And** the landing page has no horizontal overflow on the configured Mobile Chrome viewport.

6. **AC6 - Scope boundaries are preserved**
   **Given** later Epic 1 stories still exist
   **When** Story 1.2 is implemented
   **Then** FAQ, expanded Safety & Disclaimer content, Footer CTA, SEO blog content, analytics events, and unsupported warning state are not implemented here
   **And** those items remain reserved for Story 1.3 / 1.4 / Epic 7 as documented.

## Tasks / Subtasks

- [x] **T1 - Replace placeholder hero with production value narrative** (AC: 1, 2, 3, 5)
  - [x] 1.1 Update `src/app/(marketing)/page.tsx` hero copy to explicitly mention the critical two weeks after cast removal.
  - [x] 1.2 Use a product-focused headline, e.g. `Your day-by-day recovery companion for the critical 2 weeks after cast removal.`
  - [x] 1.3 Use supporting copy that includes daily exercises, AI answers, and one-time payment positioning without overpromising medical outcomes.
  - [x] 1.4 Change the primary hero CTA text to exactly `Start my 2-minute quiz`.
  - [x] 1.5 Change the secondary hero CTA text to exactly `See how the 14-day plan works` and link it to `#how-it-works`.
  - [x] 1.6 Keep the existing compliance badge or equivalent text visible above the fold: `Informational companion - not a medical device`.

- [x] **T2 - Align header CTA with the landing conversion path** (AC: 2, 5)
  - [x] 2.1 Update `src/components/marketing/marketing-header.tsx` so the primary CTA text is `Start my 2-minute quiz`.
  - [x] 2.2 Keep the secondary nav link to `#how-it-works`.
  - [x] 2.3 Do not add auth-aware logic or user session branching; Story 2.1 owns identity/session entry.

- [x] **T3 - Add Pain Points section** (AC: 4, 5)
  - [x] 3.1 Add a `data-testid="landing-pain-points"` section after the hero and before How It Works.
  - [x] 3.2 Include exactly three user anxiety points from the approved UX: short doctor follow-up, fragmented search results, fear of moving wrong or slowing recovery.
  - [x] 3.3 Write copy in English for the target overseas user; avoid vague wellness language.

- [x] **T4 - Refine How It Works section** (AC: 3, 4, 5)
  - [x] 4.1 Keep `id="how-it-works"` and `data-testid="landing-how-it-works"` so existing anchor behavior and E2E selectors remain stable.
  - [x] 4.2 Update the three steps to the approved sequence: `2-minute quiz`, `One-time payment`, `Daily plan + AI answers`.
  - [x] 4.3 Mention one-time payment in the section, but do not implement Stripe or checkout behavior in this story.

- [x] **T5 - Add What You Get section** (AC: 4, 5)
  - [x] 5.1 Add `data-testid="landing-what-you-get"` after How It Works.
  - [x] 5.2 Include the approved benefits: daily exercise cards, timer/progress, AI answers for common concerns, completion summary/share.
  - [x] 5.3 Keep content concise; this is value clarity, not long-form SEO content.

- [x] **T6 - Preserve existing safety/legal shell without expanding it** (AC: 5, 6)
  - [x] 6.1 Keep the current `data-testid="landing-safety"` disclaimer block visible.
  - [x] 6.2 Do not add FAQ accordion, detailed safety matrix, refund confidence copy, or footer CTA in this story.
  - [x] 6.3 Keep legal routes untouched unless a regression is discovered.

- [x] **T7 - Update Playwright smoke coverage for Story 1.2** (AC: 1, 2, 3, 4, 5)
  - [x] 7.1 Update `e2e/marketing-shell.spec.ts` so the landing smoke test asserts the new hero heading/value proposition.
  - [x] 7.2 Assert the primary CTA text `Start my 2-minute quiz` exists in hero and header.
  - [x] 7.3 Assert `landing-pain-points`, `landing-how-it-works`, and `landing-what-you-get` are visible.
  - [x] 7.4 Keep the existing legal routes and 404 tests passing.
  - [x] 7.5 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` after implementation.

### Review Findings

- [x] [Review][Patch] `#how-it-works` anchor lands under the sticky header — fixed with a `scroll-mt-20` offset on the How It Works target and an E2E click/viewport assertion. [`src/app/(marketing)/page.tsx`, `e2e/marketing-shell.spec.ts`]
- [x] [Review][Patch] E2E did not enforce all Story 1.2 layout/content regressions — fixed with section order, representative copy, and mobile no-horizontal-overflow assertions. [`e2e/marketing-shell.spec.ts`]

## Dev Notes

### Product and UX Intent

- The landing page must answer, within the first screen, `what is it`, `who is it for`, and `why now`.
- Approved hero focus: the critical two weeks after cast removal, daily exercises, AI answers, and one-time payment.
- Primary CTA text is fixed: `Start my 2-minute quiz`.
- Secondary CTA text is fixed: `See how the 14-day plan works`.
- The page is for overseas English users; all new user-facing strings should be English.
- Medical boundary must remain explicit: education and companion only, not diagnosis, not treatment replacement.
- Source: `产品Brief.md` §1-§3, `UX设计规格说明.md` §5.1-§5.7, `技术架构详细设计.md` §7.5, `epics.md` Story 1.2.

### Current Real Code Baseline

- `src/app/(marketing)/page.tsx` currently contains:
  - `data-testid="landing-hero"` hero section.
  - Compliance badge: `Informational companion - not a medical device`.
  - Placeholder headline: `Recover from a fracture with calm, daily structure.`
  - Primary CTA currently says `See how it works`.
  - Secondary CTA currently says `Read the medical disclaimer`.
  - Existing `id="how-it-works"` / `data-testid="landing-how-it-works"` section.
  - Existing `data-testid="landing-safety"` disclaimer block.
- `src/components/marketing/marketing-header.tsx` currently has:
  - Wordmark link: `Fracture Recovery`.
  - Secondary nav link: `How it works`.
  - Primary CTA text: `Get started`.
- `playwright.config.ts` currently has two projects:
  - `Desktop Chrome`.
  - `Mobile Chrome` using `devices["Pixel 5"]` and `browserName: "chromium"`.
- Story 1.1 validation passed with `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` (8 passed).

### Required Implementation Pattern

- Extend the existing single `LandingPage` component in `src/app/(marketing)/page.tsx`; do not create a new marketing page, duplicate layout, or new route group.
- Reuse existing `Button` from `src/components/ui/button.tsx`.
- Reuse existing Tailwind CSS 4 utility classes and the `.container` helper from `src/app/globals.css`.
- Keep the page as a Server Component. Do not add `"use client"` unless a later story introduces interactive FAQ/analytics behavior.
- Keep the route tree single-locale English. Do not add `[locale]`, `next-intl`, dictionaries, or locale providers.
- Do not introduce new dependencies for static landing sections.

### CTA Behavior Guidance

- Primary CTA should point to `/onboarding` as the future product entry.
- Do not implement `/onboarding` in this story; Epic 2 owns the eligibility gate and recovery profile flow.
- E2E should verify CTA text and `href`, not click through and require `/onboarding` to exist yet.
- Secondary CTA should remain an in-page anchor to `#how-it-works`.

### Content Guardrails

- Use concrete user anxiety language:
  - doctor follow-up was too short,
  - Google/Reddit answers are fragmented,
  - fear of moving wrong or slowing recovery.
- Avoid claims like `guaranteed recovery`, `doctor-approved`, `diagnosis`, `treatment`, or `cure`.
- Avoid broad wellness phrasing such as `optimize your body`, `unlock your potential`, or generic health-coach copy.
- Keep one primary CTA per screen. The hero can have one primary CTA plus one secondary link-style CTA.

### Testing Requirements

- Update existing `e2e/marketing-shell.spec.ts`; do not create a second E2E file unless the spec becomes too large.
- Preserve current shell tests:
  - header/footer visible,
  - legal routes visible,
  - unknown route returns 404.
- Add or update landing assertions for:
  - hero value proposition contains `critical` and `cast removal` or equivalent exact copy,
  - primary CTA text is `Start my 2-minute quiz`,
  - core sections are visible: `landing-pain-points`, `landing-how-it-works`, `landing-what-you-get`.
- Run after implementation:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e`

### Scope Exclusions

- No FAQ accordion in this story.
- No full Safety/Disclaimer expansion beyond preserving the existing `landing-safety` block.
- No footer CTA section in this story.
- No analytics event implementation (`landing_view`, `hero_cta_click`, etc.); Epic 7 owns tracking, and UX only defines the future event names.
- No Stripe, payment, checkout, Magic Link, onboarding form, eligibility gate, or recovery profile work.
- No blog/SEO article generation or content directory changes.

### Project Structure Notes

- Files expected to change:
  - `src/app/(marketing)/page.tsx`
  - `src/components/marketing/marketing-header.tsx`
  - `e2e/marketing-shell.spec.ts`
- Files expected to remain unchanged unless regression requires otherwise:
  - `src/app/(marketing)/layout.tsx`
  - `src/components/marketing/marketing-footer.tsx`
  - `src/app/(marketing)/legal/**/page.tsx`
  - `src/components/providers/**`
  - `next.config.ts`
  - `prisma/schema.prisma`

### Previous Story Intelligence

- Story 1.1 established the reusable marketing shell and validated it with Playwright.
- The current `stories/1-1-marketing-shell.md` file still shows its original create-story status, but the authoritative tracker is `stories/sprint-status.yaml`, where `1-1-marketing-shell` is `done`.
- A previous Playwright issue was corrected by using `Pixel 5` + `browserName: "chromium"` for the Mobile Chrome project to avoid pulling WebKit for an iPhone preset. Do not revert to `devices["iPhone 12"]`.
- The working tree contains generated install/test logs (`install.log`, `lint.log`, `typecheck.log`, `playwright-install.log`, `dev.log`) from Story 1.1 validation. Do not depend on those logs for implementation and do not edit them as part of Story 1.2 unless the user asks for cleanup.

### References

- `epics.md` §Requirements Inventory, §Epic 1, Story 1.2.
- `UX设计规格说明.md` §5 Page Spec: Landing.
- `技术架构详细设计.md` §5 Logical Layers, §6 Code Structure, §7.1 Public Routes, §7.5 Landing Page.
- `产品Brief.md` §1 Executive Summary, §2 Problem Statement, §3 Proposed Solution.
- `项目主档案.md` 当前阶段与 Story 1.1 验收记录.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- `pnpm test:e2e` after E2E update failed as expected against the old placeholder hero, proving the new assertions covered Story 1.2.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e` passed: 8 tests across Desktop Chrome and Mobile Chrome.

### Completion Notes List

- Replaced the placeholder landing hero with a cast-removal-window value proposition and maintained visible medical boundary copy.
- Aligned hero and header primary CTA text to `Start my 2-minute quiz`, pointing to `/onboarding` without implementing onboarding.
- Added `landing-pain-points`, refined `landing-how-it-works`, and added `landing-what-you-get` using static Server Component content.
- Preserved Story 1.1 shell behavior: header/footer, legal routes, safety block, 404 route, and single-locale routing.
- Updated E2E to assert Story 1.2 hero, CTA, and core sections while keeping legal and 404 regression coverage.

### File List

- `src/app/(marketing)/page.tsx`
- `src/components/marketing/marketing-header.tsx`
- `e2e/marketing-shell.spec.ts`
- `stories/1-2-landing-hero-core-value.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
