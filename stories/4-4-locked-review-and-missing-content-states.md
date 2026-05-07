# Story 4.4: Locked, Review, and Missing Content States

Status: done

<!-- Note: Created by bmad-create-story after Story 4.3 was implemented, lightly reviewed, patched, validated, and marked done. -->

## Story

As a user navigating the program,
I want non-happy-path day states to remain understandable,
so that I am never blocked by ambiguity.

## Acceptance Criteria

1. **AC1 - Locked future days render a clear locked state**
   **Given** a logged-in paid user opens `/day/{futureDay}` where `futureDay > Program.currentDay`
   **When** access is denied
   **Then** the page renders a locked day state instead of silently redirecting
   **And** it explains which day is currently available and offers a clear action back to today.

2. **AC2 - Locked state does not expose unusable controls**
   **Given** a future day is locked
   **When** the locked state renders
   **Then** it must not render Exercise Cards, `Mark day complete`, per-exercise checkboxes, or completion confirmation controls
   **And** it must not call the day-completion API.

3. **AC3 - Past completed days render review-oriented behavior**
   **Given** the user opens a completed day before `Program.currentDay`
   **When** the page renders
   **Then** the interface clearly says it is review mode
   **And** it shows readable day content without pretending the day is still the current active task.

4. **AC4 - Review mode remains read-only**
   **Given** the user is reviewing a past or completed day
   **When** the content renders
   **Then** it must not expose editable exercise checkboxes, `Mark day complete`, partial-completion confirmation, or active-day CTAs
   **And** it should provide navigation back to the current day and progress overview.

5. **AC5 - Completed current/final day state stays understandable**
   **Given** Story 4.3 can set `Program.status = COMPLETED` after Day 14
   **When** the user opens the completed final day
   **Then** the page shows a completed/review-oriented state, preserves the content, and avoids reactivating the plan
   **And** it must not show active completion controls for an already-completed day.

6. **AC6 - Missing or corrupted content has a support-oriented fallback**
   **Given** the current day row is missing, or required content like `title` / `focus` is blank
   **When** the page or progress entry cannot render a valid day experience
   **Then** the UI shows a clear missing-content fallback with support guidance and safe next actions
   **And** the response is observable via server logging with user/program/day context but without leaking medical details to the client.

7. **AC7 - API current-program fallback remains safe**
   **Given** `/api/program/current` returns `missing_day_content`
   **When** clients inspect the response
   **Then** the response includes enough non-sensitive metadata for support/debug routing (`programId`, `currentDay`, `redirectTo`)
   **And** it does not expose full `contentJson`, medical notes, or unrelated profile fields.

8. **AC8 - Existing happy paths remain intact**
   **Given** Stories 3.4-4.3 already protect entry, render Day Header/Focus, Exercise Cards, and day completion
   **When** locked/review/missing states are added
   **Then** current-day rendering, local exercise state, partial completion confirmation, day completion mutation, Day 14 completed-program handling, checkout success routing, and `/progress` entry behavior continue to pass.

9. **AC9 - Scope stays limited to state clarity**
   **Given** later epics own analytics, AI chat, final completion reports, PDFs, sharing, and launch observability
   **When** Story 4.4 is implemented
   **Then** it must not add analytics events, Chat UI/API, PDF/reporting, share flows, billing/refund behavior, Prisma schema changes, new dependencies, native/i18n work, or broad support-ticket infrastructure.

10. **AC10 - Focused regression coverage**
   **Given** this story changes non-happy-path day behavior
   **When** implementation is complete
   **Then** tests cover future-day locked state, past-day review state, Day 14 completed review state, missing current day row fallback, malformed/blank content fallback, absence of completion controls in non-active states, and preserved 3.4/4.1/4.2/4.3 happy paths
   **And** `pnpm typecheck`, `pnpm lint`, and focused `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` pass.

## Tasks / Subtasks

- [x] **T1 - Model Day page render states explicitly** (AC: 1, 2, 3, 4, 5, 8)
  - [x] 1.1 Introduce a narrow Day page state helper or local branching model for `current`, `locked`, `review`, and `completed-review`.
  - [x] 1.2 Replace the current future-day redirect (`requestedDay > program.currentDay`) with a locked state render.
  - [x] 1.3 Treat past days (`requestedDay < program.currentDay`) as review/read-only.
  - [x] 1.4 Treat already completed current/final day as completed review when `Program.status = COMPLETED` or `ProgramDay.completedAt` is set.
  - [x] 1.5 Keep invalid day params redirecting to `/progress` unless a narrow invalid-day fallback is simpler and does not break Story 3.4 tests.

- [x] **T2 - Render locked and review UI clearly** (AC: 1, 2, 3, 4, 5)
  - [x] 2.1 Add a locked state section with `data-testid="day-locked-state"` and copy that says the requested day is not unlocked yet.
  - [x] 2.2 Locked state must show a primary action to `/day/{program.currentDay}` and secondary `/progress`.
  - [x] 2.3 Add a review/completed section with `data-testid="day-review-state"` or clear existing `day-review-shell` copy.
  - [x] 2.4 Review mode should preserve readable Day Header/Focus and any safe day content already available.
  - [x] 2.5 Do not render `DayPlanActions`, Exercise Cards checkboxes, or day-complete CTA in locked/review/completed-review modes.

- [x] **T3 - Improve missing-content fallback and observability** (AC: 6, 7, 8)
  - [x] 3.1 Update `/progress` missing content copy from generic onboarding fallback to a support-oriented plan-content fallback.
  - [x] 3.2 Include safe action links such as retry progress/current day, back to onboarding, and landing/support guidance without adding a full support system.
  - [x] 3.3 Add server logging for `missing_day_content` resolution in `current-program-service` or the route/page boundary with user/program/currentDay context only.
  - [x] 3.4 Keep `/api/program/current` response safe and non-sensitive; do not expose full day `contentJson`.
  - [x] 3.5 Preserve no-purchase and missing-profile fallback behavior.

- [x] **T4 - Preserve Story 4.3 completion behavior** (AC: 5, 8, 9)
  - [x] 4.1 Ensure Day 14 completed programs remain `COMPLETED` and are not reactivated.
  - [x] 4.2 Ensure completed/review states do not call `POST /api/program/day/[day]/complete`.
  - [x] 4.3 Ensure current active days still render `DayPlanActions` and completion confirmation exactly once.
  - [x] 4.4 Do not add analytics, Chat, reports/PDF/share, billing/refund, schema changes, new dependencies, i18n, or native work.

- [x] **T5 - Add focused tests and validation** (AC: 10)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` unless a focused day-states spec becomes cleaner.
  - [x] 5.2 Cover future-day `/day/{future}` renders locked state and does not show completion controls.
  - [x] 5.3 Cover past completed day renders review state and does not show completion controls.
  - [x] 5.4 Cover Day 14 completed program renders completed/review state without reactivating the program.
  - [x] 5.5 Cover missing current day row and malformed/blank content fallback copy.
  - [x] 5.6 Confirm current-day happy path, Exercise Cards, partial day-completion confirmation, day-completion API, and auth redirects still pass.
  - [x] 5.7 Run `pnpm typecheck`.
  - [x] 5.8 Run `pnpm lint`.
  - [x] 5.9 Run focused `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"`.

## Dev Notes

### Product and UX Intent

- Story 4.4 completes the Day page's non-happy-path state clarity for Epic 4.
- Users should never be silently bounced or shown active controls for days they cannot act on.
- Locked, review, completed, and missing-content states should be calm, direct, mobile-readable, and action-oriented.
- Medical content remains educational support only; state copy must not imply clinical clearance or diagnosis.

### Current Real Code Baseline

- Story 3.4 implemented protected program entry:
  - `/progress` redirects ready users to `/day/{currentDay}`.
  - `/day/[day]` redirects unauthenticated users to sign-in, invalid params to `/progress`, no-purchase/missing-profile to `/onboarding`, missing content to `/progress`, and future days back to current day.
  - `resolveCurrentProgramForUser()` handles `ready`, `missing_program_recovered`, `no_purchase`, `missing_profile`, and `missing_day_content`.
- Story 4.1 renders Day Header and Today's Focus for current active day.
- Story 4.2 renders `ExerciseCards` and local exercise completion state.
- Story 4.3 added:
  - `src/lib/program/day-completion-service.ts`
  - `POST /api/program/day/[day]/complete`
  - `src/components/day-plan/day-plan-actions.tsx`
  - controlled `ExerciseCards`
  - Day 14 sets `Program.status = COMPLETED`
  - code-review patch: `current-program-service` now reads `ACTIVE` and `COMPLETED`, while missing-program recovery only reactivates missing/`EXPIRED` programs.

### Important Existing Behavior to Revisit

- Current `/day/[day]` still does:

```ts
if (requestedDay > program.currentDay) {
  redirect(`/day/${program.currentDay}`);
}
```

- Story 4.4 should replace that silent future-day redirect with a visible locked state.
- Current past-day branch only renders a minimal text block and does not show the day's full content. Story 4.4 should make this intentionally review-oriented and readable without adding active controls.
- Current missing-content path sends `/day/[day]` to `/progress`, and `/progress` says "Your plan content is being prepared..." plus "Back to onboarding". Story 4.4 should make this more support-oriented and less ambiguous.

### Data and State Anchors

- `Program.currentDay` is the unlocked active day pointer.
- `Program.status` can be `ACTIVE`, `COMPLETED`, or `EXPIRED`.
- `ProgramDay.completedAt` and `completionPercent` represent day completion state.
- `ProgramDay.contentJson` must retain required `title` and `focus` for day content to be renderable.
- Do not change Prisma schema.
- Do not add per-exercise persistence.

### Recommended Page State Semantics

- `current`:
  - `requestedDay === program.currentDay`
  - `program.status === ACTIVE`
  - day content complete
  - render Day Header, Today's Focus, `DayPlanActions`
- `locked`:
  - `requestedDay > program.currentDay`
  - render locked copy and navigation only
  - no exercise checkboxes, no day-complete CTA
- `review`:
  - `requestedDay < program.currentDay`
  - or requested day has `completedAt`
  - render readable review content
  - no active controls
- `completed-review`:
  - `program.status === COMPLETED`
  - especially Day 14 after Story 4.3
  - render completed copy, progress overview, and safe next actions
  - no active controls
- `missing-content`:
  - resolver returns `missing_day_content`
  - show support-oriented fallback and log safe metadata.

### Recommended Implementation Approach

- Keep `src/app/(app)/day/[day]/page.tsx` as a Server Component.
- Avoid large refactors; add small helper functions and branches in the page if sufficient.
- If adding reusable presentation components, keep them under `src/components/day-plan/`.
- Reuse existing `Button`, `Link`, and styling patterns.
- Prefer `data-testid` values for tests:
  - `day-locked-state`
  - `day-review-state`
  - `day-missing-content-state` or keep `progress-fallback` with specific text
  - existing `day-current-shell`, `day-review-shell`, `day-recovery-header`, `today-focus`
- Server logs for missing content should include:
  - `userId`
  - `programId`
  - `currentDay`
  - route or API boundary
  - no full `contentJson`, no recovery profile notes.

### Testing Requirements

- Extend `e2e/program-entry.spec.ts`, which already contains all program-entry and Day page regression coverage.
- Use existing helpers:
  - `seedDevUser`
  - `seedPaidPurchaseAndProgram`
  - `signInAs`
- Test locked future day by visiting `/day/{currentDay + 1}` and asserting:
  - URL may stay on requested day or canonical locked route, but must not silently land on current day.
  - `day-locked-state` is visible.
  - `Mark day complete` is not visible.
  - exercise completion checkboxes are not visible.
- Test review mode by completing a day through API or seeding `completedAt`, advancing `Program.currentDay`, visiting the past day, and asserting read-only review copy plus no active controls.
- Test Day 14 completed by completing Day 14 through Story 4.3 API or seeding completed state; assert completed review and program remains `COMPLETED` after current-program lookup.
- Test missing content:
  - deleted current `ProgramDay` row.
  - malformed/blank `title`/`focus`.
  - fallback copy includes support-oriented guidance.
- Keep the focused validation command:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"`

### Previous Story Intelligence

- Story 4.1 review patched blank string parsing; do not treat whitespace-only `title`/`focus` as valid content.
- Story 4.2 review patched exercise cautions so all cautions render; do not regress that.
- Story 4.3 review patched completed-program resolver behavior; do not reintroduce auto-reactivation of `COMPLETED` programs.
- Story 4.3 validation passed 18/18 but was slow (~9.9m). Keep new tests focused and avoid unnecessary extra navigation where possible.
- Story 4.3 changed `signInAs` in E2E to use NextAuth credentials callback directly; preserve that reliable pattern.

### Scope Boundaries

Do not implement in this story:

- Product analytics events, despite UX listing Day state events.
- Chat entry/API, suggested prompts, RAG, quota, or AI answer surfaces.
- Completion report, PDF, sharing, or final outcome summary.
- Billing/refund/subscription behavior.
- Prisma schema changes or new dependencies.
- Full support ticketing, email, or operator dashboard.
- i18n or native app work.

### Likely Files to Add or Modify

- `src/app/(app)/day/[day]/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/lib/program/current-program-service.ts` (only if safe logging or state metadata requires it)
- `src/app/api/program/current/route.ts` (only if response metadata/copy needs refinement)
- `src/components/day-plan/*` (optional small presentational components)
- `e2e/program-entry.spec.ts`
- `stories/4-4-locked-review-and-missing-content-states.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- `prisma/schema.prisma`
- Stripe checkout/webhook code
- Program content JSON files
- Chat, analytics, share, report, billing, or i18n modules

### References

- `epics.md` Epic 4 Story 4.4.
- `UX设计规格说明.md` §7.4-7.5 Day key interactions and states.
- `技术架构详细设计.md` §7.3 Protected App Routes, §8.2 Program/ProgramDay, §9.2 Day View -> Completion.
- `stories/4-1-day-header-and-todays-focus.md`.
- `stories/4-2-exercise-cards-and-completion-state.md`.
- `stories/4-3-day-completion-and-progress-update.md`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/app/(app)/progress/page.tsx`.
- `src/lib/program/current-program-service.ts`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 4.3 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from the project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded: `epics.md`, `UX设计规格说明.md`, `技术架构详细设计.md`, Stories 4.1/4.2/4.3, current Day/Progress pages, `current-program-service`, current-program API route, and focused E2E test patterns.

### Completion Notes List

- Story 4.4 should complete Epic 4's Day page state clarity for locked, review, completed, and missing-content scenarios.
- The story deliberately keeps analytics, Chat, final reports/PDF/share, support infrastructure, schema changes, and new dependencies out of scope.
- The dev agent should preserve all Story 3.4-4.3 happy paths while replacing ambiguous redirects/fallbacks with explicit states.
- Implemented explicit Day page modes for `current`, `locked`, `review`, and `completed-review`; future days now render a locked state instead of redirecting.
- Added readable read-only review rendering for past/completed days by loading requested `ProgramDay` content when it is before `Program.currentDay`.
- Improved missing-content fallback copy and `/api/program/current` metadata so missing content routes users to `/progress` with support-oriented guidance.
- Added safe server logs for missing current/requested day content with user/program/day context only.
- Tightened day completion mutation from an interactive Prisma transaction to a short batch transaction after reads, fixing repeated E2E `P2028` transaction failures while preserving Story 4.3 idempotency and Day 14 behavior.
- Validation passed on 2026-05-07: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 19/19 tests passing.
- Light code review completed on 2026-05-07. No blocking findings were found; story moved to done.

### File List

- `stories/4-4-locked-review-and-missing-content-states.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
- `src/app/(app)/day/[day]/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/api/program/current/route.ts`
- `src/lib/program/current-program-service.ts`
- `src/lib/program/day-completion-service.ts`
- `e2e/program-entry.spec.ts`

### Change Log

- 2026-05-07: Created Story 4.4 with locked/review/completed/missing-content state guidance, explicit scope boundaries, and focused regression requirements; story marked ready-for-dev.
- 2026-05-07: Implemented Story 4.4 locked/review/completed/missing-content states, extended E2E coverage, stabilized day completion transaction behavior, and moved story to code-review.
- 2026-05-07: Completed light code review with no blocking findings; Story 4.4 moved to done.

### Senior Developer Review (AI)

Outcome: Approved

Findings:

- No blocking findings. The implementation satisfies the locked future-day state, read-only review/completed-review states, missing-content fallback safety, non-sensitive API metadata, and regression coverage required by AC1-AC10.

Residual Risk:

- Missing-content observability currently uses server logs rather than a dedicated operator dashboard or alerting path. This matches Story 4.4 scope; richer launch observability remains Epic 7 work.

Validation:

- 2026-05-07: `pnpm typecheck` passed.
- 2026-05-07: `pnpm lint` passed.
- 2026-05-07: `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` passed with 19/19 tests.
