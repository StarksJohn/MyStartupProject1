# Story 6.1: Completion Experience for Day 14

Status: done

<!-- Note: Created by bmad-create-story after Epic 5 was completed and Story 5.4 passed light code review. -->

## Story

As a user who reaches the end of the program,  
I want a clear completion experience,  
so that I feel progress and closure rather than the program simply ending.

## Acceptance Criteria

1. **AC1 - Day 14 completion routes to a dedicated completion experience**  
   **Given** a paid user is on Day 14 of an active program  
   **When** they complete Day 14 through the existing day completion flow  
   **Then** the program remains marked `COMPLETED`  
   **And** the client routes them to a dedicated completion page such as `/completion`  
   **And** the user does not simply remain on the Day 14 review page with only generic completion feedback.

2. **AC2 - Completion page is protected and program-aware**  
   **Given** a user opens the completion page  
   **When** they are unauthenticated  
   **Then** they are redirected to sign in with `callbackUrl=%2Fcompletion`.  
   **Given** an authenticated user has no paid completed program  
   **When** they open the completion page  
   **Then** they are routed back to the correct existing recovery entry point (`/onboarding`, `/progress`, or their current day) without exposing a false completion state.

3. **AC3 - Completed users can revisit the completion page**  
   **Given** a paid user has a completed 14-day program  
   **When** they open `/completion` directly or re-enter from progress-style navigation  
   **Then** the completion experience renders from persisted program state  
   **And** it does not reactivate the program, mutate day completion, or show active day-completion controls.

4. **AC4 - Achievement summary is motivating but non-medical**  
   **Given** the completion page renders  
   **When** the user reviews the summary  
   **Then** it clearly states that the 14-day program is complete  
   **And** it summarizes progress context such as `14 of 14 days`, current completion status, and template/body-part context when safely available  
   **And** it avoids diagnosis, treatment claims, clinical clearance, or promises of recovery.

5. **AC5 - Lightweight next suggestions are available**  
   **Given** the user is on the completion page  
   **When** they look for what to do next  
   **Then** the page provides lightweight, non-medical next suggestions such as reviewing Day 14, reviewing progress, continuing clinician-approved habits, or asking a non-urgent question in Chat  
   **And** the suggestions follow the existing button hierarchy and feedback patterns.

6. **AC6 - Safety boundaries remain visible**  
   **Given** the user is reading the completion page  
   **When** safety copy appears  
   **Then** it states that the product is educational, not diagnostic, and does not replace clinician guidance  
   **And** it repeats danger-signal guidance to contact a clinician for severe or worsening symptoms.

7. **AC7 - Scope excludes report, PDF, sharing, and analytics**  
   **Given** later Epic 6 stories own downloadable reports and sharing  
   **When** Story 6.1 is implemented  
   **Then** it must not generate PDFs, create downloadable reports, add share links, add referral mechanics, emit analytics events, or add new report/share database fields.

8. **AC8 - Existing Day 14 and completed review behavior remains intact**  
   **Given** Stories 4.3 and 4.4 already complete Day 14 and render completed review states  
   **When** Story 6.1 adds the completion experience  
   **Then** Day 14 still sets `Program.status = COMPLETED`, `Program.currentDay = 14`, and `ProgramDay.completionPercent = 100`  
   **And** visiting `/day/14` after completion still shows the existing read-only completed review state without active completion controls.

9. **AC9 - Missing or inconsistent program content fails safely**  
   **Given** a completed program has missing or malformed current Day 14 content  
   **When** the completion page attempts to load summary context  
   **Then** it shows a safe fallback or redirects to the existing support-oriented state  
   **And** it must not show partial recovery instructions as if they were valid.

10. **AC10 - Focused regression coverage**  
    **Given** this story changes the final-day route and completion destination  
    **When** implementation is complete  
    **Then** tests cover Day 14 completion routing to completion, direct completion-page access for completed users, unauthenticated completion-page redirect, non-completed user fallback, preserved Day 14 completed review state, and scope boundaries around report/share  
    **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright/API coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add protected completion page route** (AC: 2, 3, 4, 6, 9)
  - [x] 1.1 Add `src/app/(app)/completion/page.tsx` as a Server Component.
  - [x] 1.2 Reuse `getAuthSession()` and existing auth redirect style with `callbackUrl=%2Fcompletion`.
  - [x] 1.3 Reuse `resolveCurrentProgramForUser()` or a narrow helper; do not create a parallel program resolver.
  - [x] 1.4 Render only when the resolved program exists and `Program.status === COMPLETED`.
  - [x] 1.5 For non-completed active programs, redirect to `/day/{currentDay}` or `/progress` using existing app patterns.
  - [x] 1.6 For no purchase/missing profile/missing content states, reuse existing `/onboarding` or `/progress` fallback behavior.

- [x] **T2 - Route Day 14 completion into the completion experience** (AC: 1, 8)
  - [x] 2.1 Update `DayPlanActions` to recognize a completion response with `programStatus === "COMPLETED"`.
  - [x] 2.2 Route completed Day 14 users to `/completion` after the existing success feedback timing.
  - [x] 2.3 Preserve existing Days 1-13 behavior: successful completion still navigates to the next day when `currentDay > day`.
  - [x] 2.4 Preserve retry/error feedback for failed completion responses.
  - [x] 2.5 Do not change the server mutation semantics in `day-completion-service` unless a narrow compile/test issue forces it.

- [x] **T3 - Render completion content and next suggestions** (AC: 4, 5, 6, 7)
  - [x] 3.1 Add a completion hero/status card that says the 14-day program is complete.
  - [x] 3.2 Show safe progress context: `14 of 14 days`, program status, and template/body-part context if already available without new schema.
  - [x] 3.3 Add lightweight next suggestions: review Day 14, review progress, continue clinician-approved routines, and use Chat for non-urgent questions.
  - [x] 3.4 Add visible safety boundary copy: educational only, not diagnosis, not clinician replacement, contact clinician for danger signs.
  - [x] 3.5 Use existing `Button`, `Link`, card styling, and mobile-first layout conventions.
  - [x] 3.6 Avoid report/download/share CTAs except possibly neutral disabled/coming-later copy if needed; prefer omitting them in this story.

- [x] **T4 - Preserve completed-program and Day 14 review behavior** (AC: 3, 8, 9)
  - [x] 4.1 Ensure `resolveCurrentProgramForUser()` continues to read `ACTIVE` and `COMPLETED` programs.
  - [x] 4.2 Ensure missing-program recovery does not reactivate completed programs.
  - [x] 4.3 Ensure `/day/14` after completion still renders read-only completed review and no `Mark day complete` CTA.
  - [x] 4.4 Ensure `/progress` behavior for completed programs is intentionally handled; either keep current redirect to `/day/14` or route completed programs to `/completion`, but document and test the chosen behavior.
  - [x] 4.5 Log only safe metadata for missing completion context; do not log full content JSON or medical profile detail.

- [x] **T5 - Add focused tests and validation** (AC: 1-10)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` unless a small focused completion spec becomes cleaner.
  - [x] 5.2 Test completing Day 14 through the API/UI flow results in `Program.status = COMPLETED` and the UI reaches `/completion`.
  - [x] 5.3 Test direct `/completion` access for a completed paid user renders the completion summary.
  - [x] 5.4 Test unauthenticated `/completion` redirects to sign-in with `callbackUrl=%2Fcompletion`.
  - [x] 5.5 Test an active non-completed user cannot see false completion and is redirected to their current day or progress.
  - [x] 5.6 Test `/day/14` remains completed review without active completion controls after completion.
  - [x] 5.7 Test the completion page does not expose report/download/share controls for Story 6.1.
  - [x] 5.8 Run `pnpm typecheck`.
  - [x] 5.9 Run `pnpm lint`.
  - [x] 5.10 Run focused Playwright/API tests, noting any Supabase pooler instability separately from application failures.

### Review Findings

- [x] [Review][Decision] Progress overview CTA self-loops for completed users — resolved by removing the `/completion` page `Progress overview` CTA so completed users are not offered a self-looping action.
- [x] [Review][Patch] Completed programs with inconsistent `currentDay` can render an inconsistent completion state [`src/lib/program/current-program-service.ts`] — resolved by reading completed programs with Day 14 as the effective current day.

## Dev Notes

### Product Intent

- Story 6.1 starts Epic 6 by giving users a clear ending moment for the 14-day program.
- The completion experience should create closure and confidence, not make medical claims.
- This story is deliberately the narrow completion page/routing story. It sets up the surface where Story 6.2 report download and Story 6.3 sharing can later attach.
- Users should not feel like the program "just stopped" after Day 14. They should see a dedicated page that says the program is complete and points to safe next steps.

### Current Baseline From Stories 4.3 and 4.4

- `src/lib/program/day-completion-service.ts` already implements the final-day mutation:
  - completing Day 14 sets `Program.currentDay = 14`
  - completing Day 14 sets `Program.status = ProgramStatus.COMPLETED`
  - completing the day sets `ProgramDay.completedAt`
  - completing the day sets `ProgramDay.completionPercent = 100`
  - retry/idempotency returns `already_completed` without advancing incorrectly
- `POST /api/program/day/[day]/complete` already wraps the service and returns JSON with:
  - `status`
  - `completedDay`
  - `currentDay`
  - `totalDays`
  - `programStatus`
  - `completionPercent`
  - `message`
- `src/components/day-plan/day-plan-actions.tsx` currently navigates after completion:
  - if `body.currentDay > day`, `router.push(/day/{currentDay})`
  - otherwise `router.refresh()`
  - For Day 14, `currentDay` remains `14`, so the current behavior refreshes instead of routing to a dedicated completion page.
- `src/lib/program/current-program-service.ts` already loads both `ACTIVE` and `COMPLETED` programs and avoids reactivating completed programs.
- `src/app/(app)/day/[day]/page.tsx` already renders `completed-review` for completed programs and hides active `DayPlanActions`.
- `/progress` currently redirects `ready` and `missing_program_recovered` states to `/day/{currentDay}`; for completed programs this is effectively `/day/14`.

### Relevant UX and Architecture Context

- `UX设计规格说明.md` focuses page-level UX on Landing, Onboarding, Day, and Chat. It does not yet define a full Completion page, so this story should extend existing patterns conservatively.
- UX principles that apply:
  - reduce anxiety before explaining functionality
  - keep compliance boundaries visible
  - keep the page action-oriented and mobile-first
  - one clear primary action per screen
- `UX设计规格说明.md` §7 Day Page already defines:
  - `Mark day complete`
  - completed/review states
  - progress context
  - safety boundaries
- `技术架构详细设计.md` §9.2 says Day completion updates `ProgramDay.completedAt` and `Program.currentDay`, and Day 14 later produces a summary/report path. Story 6.1 should only implement the completion experience route; report/PDF belongs to Story 6.2.

### Recommended Route and UI Shape

- Add a protected app route:
  - `src/app/(app)/completion/page.tsx`
  - `data-testid="completion-page"` for the root card/section
  - `data-testid="completion-summary"` for the achievement/progress summary
  - `data-testid="completion-next-steps"` for lightweight suggestions
  - `data-testid="completion-safety-boundary"` for safety copy
- Suggested sections:
  1. Hero/status:
     - "Your 14-day recovery companion is complete"
     - "14 of 14 days finished"
     - "This is educational support, not medical clearance."
  2. Progress context:
     - Program status: Completed
     - Current day: Day 14 of 14
     - Template version if helpful
     - Body part/subtype if retrieved safely from `RecoveryProfile`
  3. Next lightweight suggestions:
     - Review Day 14
     - Review progress
     - Keep following clinician-approved guidance
     - Ask a non-urgent question in Chat
  4. Safety boundary:
     - Not a diagnosis
     - Not a medical device
     - Contact clinician for severe/worsening symptoms or danger signs
- Preferred primary action:
  - `Review Day 14` linking to `/day/14`
- Secondary actions:
  - `Progress overview` linking to `/progress`
  - `Ask a non-urgent question` linking to `/chat`
- Avoid `Download report`, `Generate PDF`, `Share`, `Copy link`, or analytics instrumentation in this story.

### Data and State Guardrails

- Do not change `prisma/schema.prisma`.
- Do not add new `CompletionReport`, `Share`, or analytics tables.
- Do not mutate program state from `/completion`; it should be read-only.
- Treat `Program.status === COMPLETED` as the source of truth for completion access.
- Preserve `Program.currentDay = 14` for completed programs.
- Preserve Day 14 `ProgramDay.completedAt` and `completionPercent`.
- If Day 14 content is missing/malformed, avoid rendering partial recovery instructions. Either show a support-safe fallback on `/completion` or redirect to `/progress`, and log only safe metadata.
- Use existing helpers rather than duplicating content parsing. If the completion page needs Day 14 content beyond `currentProgramDay`, prefer existing `resolveCurrentProgramForUser()` data first.

### Scope Boundaries

Do not implement in Story 6.1:

- PDF generation
- downloadable report
- "generate report" API
- share links, copy-link, social share, referral mechanics
- analytics events such as `completion_report_view` or `share_click`
- new Prisma schema fields/models
- long-term maintenance plan content
- email/scheduled reminders
- clinician contact workflow
- new dependencies
- broad refactors of Day or Progress pages

### Testing Guidance

- Existing `e2e/program-entry.spec.ts` is serial and already has program/day/chat coverage. It is acceptable to extend it, but the file is large and remote Supabase can be slow.
- If adding a new focused file, keep helper duplication minimal or extract only if the repo already has a pattern. Do not create broad test infrastructure for this story.
- Suggested focused tests:
  - unauthenticated `/completion` redirects to `/sign-in?callbackUrl=%2Fcompletion`
  - active paid Day 5 user opening `/completion` is redirected to `/day/5` or `/progress`
  - Day 14 completion through UI or authenticated API leads to `/completion`
  - completed user opening `/completion` sees completion summary and safety boundary
  - completed user opening `/day/14` still sees completed review and no `Mark day complete`
  - completion page does not show `Download report`, `Share`, or `Copy link`
- Use `test.setTimeout(...)` for slow remote DB paths where prior stories already needed it.
- Keep validation commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - focused Playwright command for completion/day tests
- Known environment risk:
  - Story 5.4 validation repeatedly encountered intermittent Supabase pooler failures at `aws-1-ap-northeast-1.pooler.supabase.com:6543`. If a focused E2E run fails before application assertions during seed/session DB calls, record it separately from code failures.

### Previous Story Intelligence

- Story 4.3 established the Day 14 completion mutation. Do not rewrite it unless tests reveal a narrow issue.
- Story 4.3 code review fixed completed-program resolver behavior. Do not reintroduce completed program reactivation.
- Story 4.4 established explicit `completed-review` rendering on `/day/14` for completed programs. Keep this behavior intact.
- Story 5.4 introduced more remote-DB-heavy E2E coverage and documented Supabase pooler instability. Use focused tests and clear failure classification.
- Epic 6 later stories own downloadable summary report and sharing. Story 6.1 should leave clean extension points through route/UI structure, not hidden report/share logic.

### Likely Files to Add or Modify

- `src/app/(app)/completion/page.tsx`
- `src/components/day-plan/day-plan-actions.tsx`
- `src/app/(app)/progress/page.tsx` (only if choosing to route completed users from progress to completion)
- `src/app/(app)/day/[day]/page.tsx` (only if a narrow completed-review link/CTA is needed)
- `e2e/program-entry.spec.ts` or a focused completion E2E file
- `stories/6-1-completion-experience-for-day-14.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- Stripe checkout/webhook code
- Chat API/provider/quota code
- report/PDF/share modules
- analytics modules
- Program template content JSON files

### References

- `epics.md` Epic 6 Story 6.1.
- `UX设计规格说明.md` §2 UX principles and §7 Day Page completion/review patterns.
- `技术架构详细设计.md` §9.2 Day View -> Completion and §14.3 testing strategy.
- `stories/4-3-day-completion-and-progress-update.md`.
- `stories/4-4-locked-review-and-missing-content-states.md`.
- `stories/5-4-quota-control-provider-fallback-and-error-recovery.md`.
- `src/lib/program/day-completion-service.ts`.
- `src/app/api/program/day/[day]/complete/route.ts`.
- `src/components/day-plan/day-plan-actions.tsx`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/app/(app)/progress/page.tsx`.
- `src/lib/program/current-program-service.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Epic 5 was completed and Story 5.4 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded via exact reads and targeted search: `epics.md`, `UX设计规格说明.md`, `技术架构详细设计.md`, Product Brief completion references, Stories 4.3/4.4/5.4 completion notes, current Day completion service/API, Day page, Progress page, current-program service, and DayPlanActions.

### Completion Notes List

- Story 6.1 should add the first dedicated completion experience after Day 14 without implementing report/PDF/share.
- The dev agent should preserve Day 14 completed-program state, completed review mode, and all existing Day/Chat behavior.
- Use `Program.status === COMPLETED` as the access gate for the completion page.
- Avoid adding new schema, dependencies, analytics, or report/share surfaces.
- Implemented protected `/completion` page as a read-only Server Component, gated by auth and `Program.status === COMPLETED`, with safe redirects for onboarding/progress/current-day fallback states.
- Day 14 completion now routes to `/completion` when the completion API returns `programStatus === "COMPLETED"`; Days 1-13 navigation and retry/error behavior are unchanged.
- `/progress` now sends completed programs to `/completion`, while active programs still route to the current day.
- Completion UI renders a non-medical 14/14 achievement summary, body-part context from the existing recovery profile, next-step links, and visible safety boundary copy without report/PDF/share/analytics work.
- Validation passed: `pnpm typecheck`, `pnpm lint`, and focused Playwright coverage for unauthenticated redirect, active fallback, completed revisit, report/share absence, progress-to-completion, Day 14 completion route, and Day 14 read-only review.
- Code review resolved the self-looping `Progress overview` completion CTA by removing it, and hardened completed-program resolution so inconsistent stored `currentDay` values still load Day 14 for completed programs.
- Review fix validation passed: `pnpm typecheck`, `pnpm lint`, and focused completion Playwright coverage (`4 passed`).

### File List

- `stories/6-1-completion-experience-for-day-14.md`
- `src/app/(app)/completion/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/components/day-plan/day-plan-actions.tsx`
- `src/lib/program/current-program-service.ts`
- `e2e/program-entry.spec.ts`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-09: Created Story 6.1 with dedicated Day 14 completion experience scope, route/UI guidance, Day 14 routing requirements, report/share exclusions, and focused regression guidance; story marked ready-for-dev.
- 2026-05-09: Implemented Story 6.1 completion experience, Day 14 completion routing, completed-program progress redirect, focused E2E coverage, and validation; story marked code-review.
- 2026-05-10: Resolved light code review findings, revalidated typecheck/lint/focused completion E2E, and marked Story 6.1 done.
