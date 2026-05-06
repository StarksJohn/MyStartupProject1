# Story 4.1: Day Header and Today's Focus

Status: code-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a recovering user,
I want each day page to immediately tell me where I am and what matters today,
so that I can start without confusion.

## Acceptance Criteria

1. **AC1 - Day page renders the real current-day header from server data**
   **Given** a logged-in paid user has an active `Program` and current `ProgramDay`
   **When** they open `/day/{currentDay}`
   **Then** the page shows `Day X of 14`, the program stage, template version or source label, and a visible progress indicator above the fold
   **And** the data is resolved server-side through Story 3.4 current-program retrieval rather than from client-side assumptions.

2. **AC2 - Today's Focus is sourced from `ProgramDay.contentJson`**
   **Given** the current day content contains `title`, `focus`, `summary`, `normalSignals`, `getHelpSignals`, and `safetyNotes`
   **When** the day page renders
   **Then** the page presents a clear Today's Focus section with the day's title, focus, summary, and educational safety framing
   **And** it does not fabricate recovery advice if required fields are missing.

3. **AC3 - Medical boundary and escalation copy remain visible**
   **Given** the Day page is part of the paid recovery experience
   **When** the header and focus sections render
   **Then** the user can see non-diagnostic language and a "stop/contact a clinician" style safety boundary
   **And** the copy remains educational and does not imply diagnosis, treatment prescription, or clinician replacement.

4. **AC4 - Mobile-first layout preserves task clarity**
   **Given** a user opens `/day/{currentDay}` on a narrow mobile viewport
   **When** the page loads
   **Then** Day number, progress, stage, today's focus, and the main next action area are visible in a clear top-to-bottom order
   **And** the page does not bury the core instructions below secondary metadata.

5. **AC5 - Scope stays limited to header and focus**
   **Given** Story 4.2+ owns exercise cards, completion state, day completion mutation, locked/review polish, chat, and analytics
   **When** Story 4.1 updates the day page
   **Then** it may prepare simple section placeholders only when needed for layout continuity
   **And** it must not implement exercise completion actions, `POST /api/program/day/[day]/complete`, sticky completion behavior, chat UI/API, analytics events, PDF/reporting, subscriptions, refunds, i18n, or native app work.

6. **AC6 - Fallback states remain safe**
   **Given** the current day content is missing or malformed
   **When** the day page tries to render header and focus
   **Then** it shows a safe fallback state with a path back to `/progress` or `/onboarding`
   **And** it does not crash from unexpected `contentJson` shapes.

7. **AC7 - Future and past day routing behavior from Story 3.4 is preserved**
   **Given** a user requests a future day, a past day, or an invalid day
   **When** the route resolves
   **Then** future days still redirect to the current day, invalid days still fall back safely, and past days remain read-only/review-oriented if rendered
   **And** Story 4.1 does not weaken paid-user access control.

8. **AC8 - Focused regression coverage**
   **Given** this story changes the protected day page UI
   **When** implementation is complete
   **Then** tests cover the current-day header/focus render, safe handling of malformed day content, mobile viewport readability for the top sections, and no regression to Story 3.4 entry behavior
   **And** `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/program-entry.spec.ts`, and a focused Day page E2E/API test pass.

## Tasks / Subtasks

- [x] **T1 - Extract typed current-day content helpers** (AC: 2, 6)
  - [x] 1.1 Add a narrow helper in `src/lib/program/` or inside `current-program-service.ts` to parse the subset of `ProgramDay.contentJson` needed by the Day Header + Today's Focus.
  - [x] 1.2 Parse `title`, `focus`, `summary`, `normalSignals`, `getHelpSignals`, `safetyNotes`, and optional `personalizationFlags` defensively without using `any`.
  - [x] 1.3 Treat missing `title` or `focus` as malformed content and keep Story 3.4's `missing_day_content` fallback semantics.
  - [x] 1.4 Do not expose all exercises/FAQs through the Day 4.1 UI unless only showing a count or a later-story placeholder.

- [x] **T2 - Replace the minimal current-day placeholder with real header/focus sections** (AC: 1, 2, 3, 4, 5)
  - [x] 2.1 Update `src/app/(app)/day/[day]/page.tsx` to render a real Day Header for the current day: `Day X of 14`, progress indicator, stage label, estimated minutes, and completion state summary.
  - [x] 2.2 Render a Today's Focus card/section using `contentJson.title`, `focus`, and `summary`.
  - [x] 2.3 Add a compact safety boundary block sourced from safety notes or standard fallback copy.
  - [x] 2.4 Keep layout mobile-first and above-the-fold friendly; avoid large secondary metadata before the focus.
  - [x] 2.5 Keep future exercise cards, completion controls, chat entry, and analytics out of scope.

- [x] **T3 - Preserve protected routing and fallback behavior** (AC: 6, 7)
  - [x] 3.1 Keep unauthenticated redirects, invalid-day fallback, no-purchase/missing-profile fallback, and future-day redirect behavior from Story 3.4.
  - [x] 3.2 Ensure malformed/missing content uses `/progress` fallback or a clear missing-content message instead of throwing.
  - [x] 3.3 Keep past-day rendering read-only and explicitly review-oriented if the existing route still renders past days.
  - [x] 3.4 Avoid changing Stripe, checkout, webhook, provisioning, or session/JWT shape unless a compile issue forces a narrow import/type adjustment.

- [x] **T4 - Add focused E2E coverage** (AC: 8)
  - [x] 4.1 Add or extend a focused Playwright file for Day page rendering; prefer extending `e2e/program-entry.spec.ts` only if the additions stay small and readable.
  - [x] 4.2 Cover current-day header/focus render for a paid user with `currentDay > 1`.
  - [x] 4.3 Cover malformed current-day content falling back safely.
  - [x] 4.4 Cover mobile viewport top-section readability using Playwright's mobile project or an explicit viewport when stable.
  - [x] 4.5 Confirm future-day redirect and unauthenticated redirect still behave as Story 3.4 intended.
  - [x] 4.6 Run `pnpm typecheck`.
  - [x] 4.7 Run `pnpm lint`.
  - [x] 4.8 Run focused `pnpm test:e2e e2e/program-entry.spec.ts`.
  - [x] 4.9 Run the new or updated focused Day page E2E test.

## Dev Notes

### Product and UX Intent

- Epic 4 starts the real value-delivery surface. Story 4.1 should turn Story 3.4's placeholder day route into the top of the real Day Page, without taking over the exercise/completion work from later stories.
- The user should immediately understand:
  - where they are in the 14-day plan,
  - what today is about,
  - how much work today's plan is expected to take,
  - what safety boundary applies before they act.
- UX design freezes the Day Page structure as:
  1. Recovery Header
  2. Today's Focus
  3. Exercise Cards
  4. What's Normal vs Get Help
  5. Quick Questions
  6. Sticky Bottom Action
- This story owns only sections 1 and 2, plus minimal safety framing needed to make the top of the page trustworthy. Exercise cards and sticky completion belong to later stories.

### Current Real Code Baseline

- Story 3.4 added:
  - `src/lib/program/current-program-service.ts`
  - `src/app/api/program/current/route.ts`
  - `src/app/(app)/progress/page.tsx`
  - `src/app/(app)/day/[day]/page.tsx`
  - `e2e/program-entry.spec.ts`
- Current `src/app/(app)/day/[day]/page.tsx` already:
  - uses `getAuthSession()` in a Server Component,
  - redirects unauthenticated users to `/sign-in?callbackUrl=...`,
  - rejects invalid day params by redirecting to `/progress`,
  - redirects no-purchase/missing-profile to `/onboarding`,
  - redirects `missing_day_content` to `/progress`,
  - redirects future days to `/day/{currentDay}`,
  - renders only a minimal placeholder for current/past days.
- Story 3.4 current-program service returns:

```ts
interface CurrentProgramEntry {
  programId: string;
  templateVersion: string;
  status: ProgramStatus;
  currentDay: number;
  totalDays: number;
  currentProgramDay: {
    dayIndex: number;
    stage: string;
    estimatedMinutes: number;
    title: string;
    focus: string;
    summary: string;
    completedAt: Date | null;
    completionPercent: number;
  };
}
```

- Story 4.1 may extend that returned shape narrowly if needed, but should avoid stuffing full exercises/FAQ content into places not used by this story.

### Content Model Anchors

- Story 3.3's `ProgramDay.contentJson` contains display-ready structured content:
  - `title`
  - `focus`
  - `summary`
  - `exerciseSlugs`
  - `exercises`
  - `faqSlugs`
  - `faqs`
  - `normalSignals`
  - `getHelpSignals`
  - `safetyNotes`
  - `personalizationFlags`
- For Story 4.1, use only:
  - `title`, `focus`, `summary`
  - `normalSignals` or `safetyNotes` for compact safety framing
  - `stage`, `estimatedMinutes`, `completionPercent`, and `completedAt` from `ProgramDay`
- Do not render full exercise cards, FAQ lists, video/thumbnail assets, checkbox state, or completion actions in this story.

### Route and UX Guardrails

- `redirect()` is valid in Server Components and throws internally. Keep redirect calls outside `try/catch`.
- Keep `/progress` as the entry route that resolves to `/day/{currentDay}`.
- Keep `/day/[day]` protected and server-rendered for this story.
- Invalid day parameters should continue to be handled safely. Do not add client-only parsing as the source of truth.
- Future days must not unlock content ahead of `Program.currentDay`.
- Past days may remain a read-only shell, but if you touch the copy make it explicitly "review" rather than today's active task.
- Medical language must stay educational and non-diagnostic:
  - no diagnosis,
  - no treatment prescription,
  - no "you should be healed by X" guarantees,
  - clear "stop and contact a clinician" framing for dangerous symptoms.

### Testing Requirements

- Existing Playwright patterns:
  - `e2e/program-entry.spec.ts` seeds users, purchases, programs, and program days directly via `PrismaClient`.
  - It already covers auth redirects, current-day routing, future-day redirect, invalid day fallback, missing current-day content, missing-program repair, inactive-program repair, and missing-profile fallback.
- Story 4.1 should add tests for rendered UI details, not just routing:
  - current-day header: `Day X of 14`
  - stage/progress/estimated minutes
  - Today's Focus title/focus/summary
  - safety boundary copy
  - mobile viewport sees the top sections without relying on desktop-only selectors
- Expected validation commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e e2e/program-entry.spec.ts`
  - focused Day page test if created separately

### Previous Story Intelligence

- Story 3.4 review patches matter for Story 4.1:
  - active paid program + missing current `ProgramDay` returns `missing_day_content`, not `no_purchase`;
  - paid purchase + inactive existing program is restored to `ACTIVE` through `provisionProgramForPaidPurchase`;
  - focused program-entry coverage is now 10/10 on Desktop Chrome.
- Story 3.3 content generation already guarantees template-first safety language and structured day content under normal provisioning.
- Keep session/JWT shape small. Do not add `contentJson` or current-day details to NextAuth session; fetch server-side.

### Scope Boundaries

Do not implement in this story:

- Exercise cards, exercise completion toggles, exercise local/server completion state.
- `POST /api/program/day/[day]/complete`, `Program.currentDay` advancement, or day-complete confirmation.
- Sticky bottom completion CTA behavior beyond a non-functional placeholder if layout needs it.
- Chat entry, chat API, suggested prompts, RAG, quota, or AI answer surfaces.
- Product analytics events.
- PDF/reporting, sharing, billing portal, refunds, subscriptions, i18n, or native app work.
- New dependencies.

### Likely Files to Add or Modify

- `src/app/(app)/day/[day]/page.tsx`
- `src/lib/program/current-program-service.ts`
- `e2e/program-entry.spec.ts` or a new focused `e2e/day-page.spec.ts`
- `stories/4-1-day-header-and-todays-focus.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- Stripe checkout creation and webhook signature verification.
- Prisma schema.
- Program template JSON content.
- Full exercise/FAQ rendering components not yet introduced.

### References

- `epics.md` Epic 4 Story 4.1.
- `UX设计规格说明.md` §7 Day Page, especially §7.3 Recovery Header + Today's Focus and §7.5 page states.
- `技术架构详细设计.md` §7.3 Protected App Routes, §8.2 Program/ProgramDay, §9.2 Day View -> Completion, §12 Auth and Access Control.
- `stories/3-4-current-program-retrieval-and-progress-entry.md`.
- `src/lib/program/current-program-service.ts`.
- `src/app/(app)/day/[day]/page.tsx`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 3.4 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` does not exist in this repository; paths were resolved from the project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Avoid slow broad `Glob`/subagent review patterns in this workspace for this story; direct known-file reads were more reliable.

### Completion Notes List

- Story 4.1 should convert the protected Day route from a placeholder into the first real Day Page sections: Recovery Header and Today's Focus.
- The story deliberately freezes exercise cards, completion state/mutation, sticky completion CTA behavior, chat, analytics, and launch polish out of scope.
- The dev agent should preserve Story 3.4's server-side routing/access-control behavior and only add display-ready top-of-page content.
- Implementation summary (2026-05-06):
  - Extended `src/lib/program/current-program-service.ts` to parse `normalSignals`, `getHelpSignals`, `safetyNotes`, and `personalizationFlags` from `ProgramDay.contentJson` through typed string-array guards; required `title` + `focus` still gate `missing_day_content`.
  - Replaced the `/day/[day]` placeholder with real top-of-page Day Header + Today's Focus sections showing `Day X of 14`, overall progress, formatted stage, estimated minutes, completion state, template version, title, focus, summary, safety boundary, normal signals, and get-help signals.
  - Preserved Story 3.4 routing/access behavior: unauthenticated redirects, invalid-day fallback, no-purchase/missing-profile redirects, missing-content fallback, future-day redirect, and read-only past-day review shell.
  - Kept Story 4.2+ work out of scope: no exercise cards, completion mutation, sticky completion CTA behavior, chat, analytics, PDF/reporting, billing/refund, i18n, native app work, or new dependencies.
  - Extended `e2e/program-entry.spec.ts` to cover current-day header/focus render, safety copy, signal arrays, malformed content fallback, mobile viewport visibility, and preserved route behavior.
- Validation:
  - `pnpm typecheck` passed.
  - `pnpm lint` passed.
  - `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` passed: 11/11.

### File List

- `src/lib/program/current-program-service.ts`
- `src/app/(app)/day/[day]/page.tsx`
- `e2e/program-entry.spec.ts`
- `stories/4-1-day-header-and-todays-focus.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-06: Implemented Story 4.1 (T1-T4); story marked `code-review` after typecheck, lint, and focused program-entry E2E passed.
