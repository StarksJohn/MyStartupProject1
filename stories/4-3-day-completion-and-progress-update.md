# Story 4.3: Day Completion and Progress Update

Status: done

<!-- Note: Created by bmad-create-story after Story 4.2 was implemented, lightly reviewed, patched, validated, and marked done. -->

## Story

As a user finishing today's work,
I want to mark the whole day complete,
so that I receive closure and my overall progress advances.

## Acceptance Criteria

1. **AC1 - Current day can be completed through a protected API**
   **Given** a logged-in paid user has an active program and valid current `ProgramDay`
   **When** they submit `POST /api/program/day/[day]/complete` for `Program.currentDay`
   **Then** the server sets that `ProgramDay.completedAt`, stores `completionPercent = 100`, and advances `Program.currentDay` to the next day when the completed day is 1-13
   **And** the response includes the completed day, next/current day, completion status, and clear success metadata for the UI.

2. **AC2 - Day 14 completion ends the active program safely**
   **Given** the active program is on Day 14
   **When** the user completes Day 14
   **Then** the server marks Day 14 complete, keeps `Program.currentDay` within 14, and sets `Program.status = COMPLETED`
   **And** it does not generate PDF/reporting/share flows, which belong to later Epic 6 stories.

3. **AC3 - Completion endpoint is authenticated, authorized, and scoped**
   **Given** unauthenticated, unpaid, wrong-day, future-day, missing-profile, missing-program, or missing-day-content requests may occur
   **When** the completion endpoint is called
   **Then** unauthenticated requests return `401`
   **And** invalid or unauthorized state returns a safe non-2xx JSON response without mutating `Program`, `ProgramDay`, purchases, profiles, or content.

4. **AC4 - Completion is idempotent enough for double clicks**
   **Given** the user double-clicks the completion action or retries after a successful response
   **When** the same day is already completed
   **Then** the endpoint returns a safe already-completed response with the current program progress
   **And** it must not advance `Program.currentDay` more than once for the same day.

5. **AC5 - Current Day page exposes a day-complete CTA with partial-progress confirmation**
   **Given** Story 4.2 provides local per-exercise completion state
   **When** the user has completed all visible exercise cards
   **Then** the Day page allows direct `Mark day complete`
   **And** shows clear success feedback after the server confirms completion.

6. **AC6 - Incomplete exercise progress requires explicit confirmation**
   **Given** the user has not completed all visible exercise cards
   **When** they tap `Mark day complete`
   **Then** the page shows a confirmation step explaining that not all exercise cards are checked
   **And** the user can cancel without server mutation or explicitly continue to complete the day.

7. **AC7 - Progress surfaces update after completion**
   **Given** a day has been completed
   **When** the user reloads or calls `GET /api/program/current`
   **Then** the completed day reflects `completedAt` and `completionPercent = 100`
   **And** the active current day advances to the next available day for Days 1-13.

8. **AC8 - Scope stays limited to day completion**
   **Given** later stories own locked/review polish, chat, analytics, completion report, PDF, sharing, and launch readiness
   **When** Story 4.3 is implemented
   **Then** it must not add analytics events, Chat UI/API, PDF/reporting, sharing, billing/refund behavior, Prisma schema changes, new dependencies, or native/i18n work.

9. **AC9 - Focused regression coverage**
   **Given** this story adds the first mutating program endpoint after purchase/program creation
   **When** implementation is complete
   **Then** tests cover authenticated completion, unauthenticated rejection, partial-progress confirmation/cancel/confirm, double-submit idempotency, future/wrong-day rejection, Day 14 completion, and preserved Story 3.4/4.1/4.2 behavior
   **And** `pnpm typecheck`, `pnpm lint`, and focused `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` pass.

## Tasks / Subtasks

- [x] **T1 - Add server-side day completion service** (AC: 1, 2, 3, 4, 7, 8)
  - [x] 1.1 Add a narrow service/helper under `src/lib/program/` for completing the active day; do not bury completion mutation logic in the route handler.
  - [x] 1.2 Load only the authenticated user's active paid program and the requested `ProgramDay`.
  - [x] 1.3 Reject invalid day params, missing active program, unpaid state, missing day row, and future-day requests without mutation.
  - [x] 1.4 Use a Prisma transaction for `ProgramDay.completedAt`, `ProgramDay.completionPercent`, and `Program.currentDay`/`Program.status` updates.
  - [x] 1.5 Prevent double-advance: repeated completion for the same already-completed day must return a safe success/already-completed state without incrementing `currentDay` again.
  - [x] 1.6 Day 1-13 completion advances `currentDay` by one; Day 14 completion keeps `currentDay` at 14 and sets `Program.status = COMPLETED`.

- [x] **T2 - Add protected completion API route** (AC: 1, 2, 3, 4)
  - [x] 2.1 Create `src/app/api/program/day/[day]/complete/route.ts`.
  - [x] 2.2 Use `getAuthSession()` and return `401` JSON for unauthenticated requests, matching existing API patterns.
  - [x] 2.3 Parse Next.js 16 route `params` as a `Promise<{ day: string }>` if needed, consistent with existing App Router dynamic route patterns.
  - [x] 2.4 Return typed JSON states such as `completed`, `already_completed`, `invalid_day`, `not_current_day`, `missing_program`, or `missing_day_content`.
  - [x] 2.5 Log server errors with enough context for debugging but without leaking medical/profile details to the client.

- [x] **T3 - Connect Day page CTA to server completion** (AC: 5, 6, 7, 8)
  - [x] 3.1 Add or refactor a focused client component under `src/components/day-plan/` to own visible exercise completion state plus the day-complete CTA.
  - [x] 3.2 Reuse the existing `ExerciseCards` behavior from Story 4.2; do not duplicate card rendering or introduce a second source of exercise progress truth.
  - [x] 3.3 Show a mobile-readable `Mark day complete` action below the exercise cards; sticky positioning is allowed only if simple and non-invasive.
  - [x] 3.4 If local exercise completion is below 100%, show an explicit confirmation panel/dialog before calling the API.
  - [x] 3.5 Canceling confirmation must leave the server unchanged.
  - [x] 3.6 On success, show clear success feedback and refresh/navigate so the visible progress summary reflects the new server state.

- [x] **T4 - Preserve routing, safety, and story boundaries** (AC: 3, 7, 8)
  - [x] 4.1 Preserve unauthenticated redirects for `/day/[day]` and `/progress`.
  - [x] 4.2 Preserve invalid-day fallback, future-day redirect, no-purchase/missing-profile redirects, and missing-content fallback from Story 3.4.
  - [x] 4.3 Preserve Story 4.1 Day Header + Today's Focus and Story 4.2 Exercise Cards rendering.
  - [x] 4.4 Do not implement Chat, analytics events, PDF/reporting, share flows, billing/refund behavior, schema migrations, new dependencies, or broad review/locked-state polish.

- [x] **T5 - Add focused tests and validation** (AC: 9)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` unless a focused day-completion spec becomes cleaner.
  - [x] 5.2 Cover `POST /api/program/day/[day]/complete` unauthenticated -> `401`.
  - [x] 5.3 Cover authenticated current-day completion mutates `ProgramDay.completedAt`, `completionPercent = 100`, and advances `Program.currentDay`.
  - [x] 5.4 Cover partial exercise completion confirmation: cancel does not mutate; confirm completes.
  - [x] 5.5 Cover double-submit / already-completed behavior does not advance more than once.
  - [x] 5.6 Cover wrong/future day completion rejection.
  - [x] 5.7 Cover Day 14 completion sets `Program.status = COMPLETED` and keeps `currentDay` within 14.
  - [x] 5.8 Confirm existing Story 3.4/4.1/4.2 E2E assertions still pass.
  - [x] 5.9 Run `pnpm typecheck`.
  - [x] 5.10 Run `pnpm lint`.
  - [x] 5.11 Run focused `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"`.

## Dev Notes

### Product and UX Intent

- Story 4.3 turns the Day page from "actionable local progress" into real program progress.
- The user needs closure after the day's work: a visible success state and updated overall progress.
- Completion should feel supportive, not punitive. If not all exercise cards are checked, show a clear warning and let the user intentionally continue.
- Medical language remains educational; completing a day must not imply medical clearance.

### Current Real Code Baseline

- Story 3.4 completed:
  - `src/lib/program/current-program-service.ts` resolves the active paid user's current program and current day.
  - `src/app/api/program/current/route.ts` exposes `GET /api/program/current`.
  - `/progress` redirects ready users to `/day/{currentDay}`.
  - `/day/[day]` protects access, rejects invalid/future days, and handles missing content safely.
- Story 4.1 completed:
  - `/day/[day]` renders Day Header and Today's Focus.
  - `current-program-service` parses `title`, `focus`, `summary`, `normalSignals`, `getHelpSignals`, `safetyNotes`, and `personalizationFlags`.
- Story 4.2 completed:
  - `current-program-service` parses `DayExerciseCard[]` from `ProgramDay.contentJson.exercises`.
  - `src/components/day-plan/exercise-cards.tsx` renders exercise cards and tracks page-local completed exercise slugs.
  - Light review patch ensures all exercise cautions render and local completed count is derived from the current exercise list.
  - Story 4.2 deliberately did not persist per-exercise completion or mutate server day/program state.

### Data Model Anchors

- `prisma/schema.prisma` already has the required fields:
  - `Program.currentDay Int @default(1)`
  - `Program.status ProgramStatus` with `ACTIVE`, `COMPLETED`, `EXPIRED`
  - `ProgramDay.completedAt DateTime?`
  - `ProgramDay.completionPercent Int @default(0)`
  - `ProgramDay` unique key: `@@unique([programId, dayIndex])`
- Do not change Prisma schema for this story.
- Do not add a per-exercise persistence table. If per-exercise persistence is later needed, it should be a separate story/design decision.

### Recommended Server Contract

- Add `POST /api/program/day/[day]/complete`.
- Suggested success response shape:

```ts
type CompleteDayResponse =
  | {
      status: "completed" | "already_completed";
      completedDay: number;
      currentDay: number;
      totalDays: 14;
      programStatus: "ACTIVE" | "COMPLETED";
      completionPercent: 100;
      message: string;
    }
  | {
      status:
        | "invalid_day"
        | "unauthenticated"
        | "missing_program"
        | "missing_day_content"
        | "not_current_day";
      message: string;
    };
```

- Suggested HTTP status guidance:
  - `401`: unauthenticated.
  - `400`: invalid day parameter.
  - `403` or `404`: no active paid program for this user, missing profile/program, or unauthorized state.
  - `409`: requested day is ahead of `Program.currentDay` or otherwise not completable.
  - `200`: completed or already completed.
- Keep response wording product-safe and non-medical.

### Recommended Mutation Semantics

- Complete only the authenticated user's active paid program.
- Use `prisma.$transaction`.
- For Days 1-13:
  - set requested `ProgramDay.completedAt` if not already set,
  - set `ProgramDay.completionPercent = 100`,
  - advance `Program.currentDay` to `requestedDay + 1` only if the program has not already advanced beyond that requested day.
- For Day 14:
  - set Day 14 completion fields,
  - keep `Program.currentDay = 14`,
  - set `Program.status = ProgramStatus.COMPLETED`.
- Be careful with idempotency:
  - Double-clicking should not advance from Day 5 to Day 7.
  - If `requestedDay < Program.currentDay` and that day has `completedAt`, return `already_completed`.
  - If `requestedDay > Program.currentDay`, reject as `not_current_day`.

### Recommended UI Shape

- Avoid making `src/app/(app)/day/[day]/page.tsx` a client component.
- Keep server route/auth/redirect logic in the page.
- Add a small client wrapper such as `src/components/day-plan/day-plan-actions.tsx` or refactor `ExerciseCards` to accept completion callbacks.
- The client wrapper should:
  - render or reuse `ExerciseCards`,
  - know visible `completedCount`, total exercise count, and completion percent,
  - render `Mark day complete`,
  - show confirmation when completion percent is less than 100,
  - call `POST /api/program/day/${day}/complete`,
  - show success feedback and call `router.refresh()` or navigate to the next day based on the response.
- Past-day review mode should remain read-only until Story 4.4; Story 4.3 should only add completion CTA to the current day branch.

### Route and UX Guardrails

- Do not weaken Story 3.4 routing:
  - unauthenticated -> `/sign-in?callbackUrl=...`
  - invalid day -> `/progress`
  - no purchase / missing profile -> `/onboarding`
  - missing content -> `/progress`
  - future day -> `/day/{currentDay}`
- Do not weaken Story 4.1/4.2 rendering:
  - Day Header and Today's Focus stay above Exercise Cards.
  - Exercise Cards continue to show all cautions.
  - Empty/malformed exercises still show "Exercise details are being prepared".
- Do not introduce analytics despite UX §7.7 listing `day_complete_click` / `day_complete_confirm`; analytics is Epic 7.

### Testing Requirements

- Extend the existing Playwright serial test file unless a separate file is clearly cleaner.
- Use `page.request` for authenticated API requests so cookies/session are shared.
- Reuse helpers in `e2e/program-entry.spec.ts`:
  - `seedDevUser`
  - `seedRecoveryProfile`
  - `seedPaidPurchaseAndProgram`
  - `signInAs`
- Add DB assertions with Prisma for:
  - `ProgramDay.completedAt` not null,
  - `ProgramDay.completionPercent === 100`,
  - `Program.currentDay` advanced exactly once,
  - Day 14 `Program.status === ProgramStatus.COMPLETED`.
- Keep Desktop Chrome as the focused project unless the Playwright config changes.

### Previous Story Intelligence

- Story 4.2 client progress is page-local. Story 4.3 should use it only for the confirmation UX, not as trusted server state.
- Story 4.2 E2E already covers 0/50/100/50 local exercise percentage recalculation. Add day completion tests without deleting that coverage.
- Story 4.2 review found safety copy loss when only the first caution rendered. Preserve all caution rendering while adding the completion CTA.
- The focused regression suite was passing at 13/13 before Story 4.3.

### Scope Boundaries

Do not implement in this story:

- Per-exercise server persistence.
- New Prisma models or migrations.
- Completion report page, PDF, sharing, or final outcome summary.
- Chat entry/API, suggested prompts, RAG, quota, or AI answer surfaces.
- Analytics event emission.
- Billing/refund/subscription work.
- i18n, native app work, or new dependencies.
- Full Story 4.4 locked/review/missing-content polish.

### Likely Files to Add or Modify

- `src/lib/program/day-completion-service.ts` or similarly narrow helper (new)
- `src/app/api/program/day/[day]/complete/route.ts` (new)
- `src/components/day-plan/exercise-cards.tsx`
- `src/components/day-plan/day-plan-actions.tsx` or similarly narrow wrapper (new, if useful)
- `src/app/(app)/day/[day]/page.tsx`
- `e2e/program-entry.spec.ts` or focused day completion E2E file
- `stories/4-3-day-completion-and-progress-update.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- `prisma/schema.prisma`
- Stripe checkout/webhook code
- Program content JSON files
- Chat, analytics, share, report, billing, or i18n modules

### References

- `epics.md` Epic 4 Story 4.3.
- `UX设计规格说明.md` §7.2-7.5 Day page entry/exit, page structure, key interactions, and states.
- `技术架构详细设计.md` §7.4 API Routes, §8.2 Program/ProgramDay, §9.2 Day View -> Completion, §14.3 testing strategy.
- `stories/4-1-day-header-and-todays-focus.md`.
- `stories/4-2-exercise-cards-and-completion-state.md`.
- `src/lib/program/current-program-service.ts`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/components/day-plan/exercise-cards.tsx`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 4.2 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from the project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded: `epics.md`, `UX设计规格说明.md`, `技术架构详细设计.md`, previous Stories 4.1/4.2, current Day page/service/component code, Prisma schema, and focused E2E test patterns.

### Completion Notes List

- Story 4.3 should add the first dedicated day completion mutation and connect it to the Day page CTA.
- The story deliberately separates server day completion from per-exercise persistence; local exercise state is only used for confirmation UX.
- The dev agent must preserve Story 3.4 routing, Story 4.1 header/focus layout, and Story 4.2 exercise cards while adding completion flow.
- Implemented `src/lib/program/day-completion-service.ts` with transactional Day completion, Day 14 program completion, safe unauthorized/missing-content states, and retry/idempotency behavior that prevents double-advancing `Program.currentDay`.
- Added `POST /api/program/day/[day]/complete` with Next.js 16 dynamic params, `getAuthSession()` authentication, status-code mapping, and product-safe JSON responses.
- Added `src/components/day-plan/day-plan-actions.tsx` to reuse `ExerciseCards`, own local visible exercise completion state, show partial-progress confirmation, call the completion endpoint, and show success feedback before refresh/navigation.
- Refactored `ExerciseCards` to support controlled completion state without losing its standalone Story 4.2 behavior.
- Extended `e2e/program-entry.spec.ts` from 13 to 18 focused tests covering unauthenticated completion rejection, current-day completion mutation, idempotent retry, future-day rejection without mutation, Day 14 program completion, partial-progress cancel/confirm, and prior Story 3.4/4.1/4.2 regressions.
- Validation passed on 2026-05-07: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 18/18 tests passing.
- Light code review completed on 2026-05-07. One completion-state conflict was patched: `/api/program/current` now recognizes completed programs instead of treating them as missing, and missing-program recovery only reactivates `EXPIRED` programs instead of `COMPLETED` programs. E2E now verifies Day 14 completion stays completed after `GET /api/program/current`.
- Review validation passed on 2026-05-07: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 18/18 tests passing.

### File List

- `src/lib/program/day-completion-service.ts`
- `src/app/api/program/day/[day]/complete/route.ts`
- `src/components/day-plan/day-plan-actions.tsx`
- `src/components/day-plan/exercise-cards.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `src/lib/program/current-program-service.ts`
- `e2e/program-entry.spec.ts`
- `stories/4-3-day-completion-and-progress-update.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-07: Created Story 4.3 with server mutation, UI completion CTA, idempotency, Day 14, scope, and regression-test guidance; story marked ready-for-dev.
- 2026-05-07: Implemented Story 4.3 day completion service/API/UI, added focused E2E coverage, and moved story to code-review.
- 2026-05-07: Completed light code review patch for completed-program resolver behavior; focused validation passed and story moved to done.

### Senior Developer Review (AI)

Outcome: Approved after patch

Findings:

- High: `src/lib/program/current-program-service.ts` only loaded `ACTIVE` programs while `day-completion-service` marks Day 14 programs as `COMPLETED`. After Day 14 completion, `GET /api/program/current` would miss the completed program and the recovery path could treat the paid purchase as missing an active program, re-provisioning and reactivating a completed program. Patched by allowing `ACTIVE` and `COMPLETED` programs in current-program resolution while limiting missing-program recovery to absent or `EXPIRED` programs.

Residual Risk:

- Story 4.3 intentionally does not implement a final completion report, share flow, or locked/review polish; those remain later-story responsibilities.
