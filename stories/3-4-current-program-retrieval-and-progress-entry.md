# Story 3.4: Current Program Retrieval and Progress Entry

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a logged-in paid user,
I want the app to know which program and day I should see next,
so that I never need to manually reconstruct my place.

## Acceptance Criteria

1. **AC1 - Active program resolution is server-side and user-scoped**
   **Given** a logged-in user has a paid `Purchase` and an active `Program`
   **When** the product resolves the user's current program
   **Then** it returns only that user's active paid program
   **And** it includes the active program id, `currentDay`, template version, total day count, and the current `ProgramDay` row
   **And** it never exposes another user's program, purchase, recovery profile, or day content.

2. **AC2 - Current program API route exists**
   **Given** a client or future app shell needs the current program entry state
   **When** it calls `GET /api/program/current`
   **Then** unauthenticated requests return `401`
   **And** authenticated users with no paid purchase return a safe no-access state
   **And** paid users with a valid active program return a JSON payload for the current program and day
   **And** route handlers use `NextResponse.json` and project session helpers instead of client-side auth assumptions.

3. **AC3 - App entry routes send paid users to the correct day**
   **Given** a paid user has an active program whose `currentDay` is not necessarily 1
   **When** they enter the protected recovery app through checkout success, `/progress`, or a day route
   **Then** the product resolves the current day from server state
   **And** the entry point routes them to `/day/{currentDay}` rather than hardcoding Day 1.

4. **AC4 - Missing program after paid purchase uses approved auto-recovery**
   **Given** a user has a paid purchase but no active program
   **When** they open a protected program route or `GET /api/program/current`
   **Then** the system attempts the approved repair path using existing template-first provisioning
   **And** if a `RecoveryProfile` exists, it creates or restores the active `Program` and 14 `ProgramDay` rows
   **And** if recovery is impossible, it returns/renders a safe fallback with next action instead of a broken page.

5. **AC5 - Minimal day/progress placeholders do not pre-implement Epic 4**
   **Given** Story 4 owns the full Day UI and completion experience
   **When** Story 3.4 creates `/progress` and `/day/[day]` entry points
   **Then** they may render a minimal protected placeholder or redirect shell
   **And** they must not implement exercise card UI, exercise completion state, day completion endpoint, sticky completion CTA, chat UI/API, analytics, PDF/reporting, subscriptions, refunds, i18n, or native app work.

6. **AC6 - Invalid, future, and missing day states are safe**
   **Given** a user requests an invalid day, a future locked day, or a day whose content is missing
   **When** the server resolves the route
   **Then** invalid day numbers are handled with redirect or safe not-found behavior
   **And** future days do not bypass `Program.currentDay`
   **And** missing content uses a clear fallback state rather than throwing an uncaught runtime error.

7. **AC7 - Session shape stays small**
   **Given** `src/lib/auth/options.ts` already refreshes `session.user.hasPurchase` and `session.user.activeProgramId`
   **When** this story adds current program retrieval
   **Then** it does not put large `ProgramDay.contentJson`, all days, or recovery profile details into the JWT/session
   **And** detailed program data is fetched server-side or through `GET /api/program/current`.

8. **AC8 - Focused regression coverage**
   **Given** this story changes protected app entry behavior
   **When** implementation is complete
   **Then** tests cover unauthenticated redirects/401s, paid active-program current-day resolution, checkout success linking to the resolved current day, missing-program auto-recovery, no-purchase fallback, invalid/future day handling, and no regression to existing auth/checkout/webhook flows
   **And** `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/auth-shell.spec.ts`, and a focused program-entry E2E/API test pass.

## Tasks / Subtasks

- [x] **T1 - Add current program retrieval service** (AC: 1, 4, 6, 7)
  - [x] 1.1 Add a server-only helper in `src/lib/program/`, preferably `current-program-service.ts`, unless extending `provisioning-service.ts` is clearly smaller.
  - [x] 1.2 Query active paid programs by `userId`, `Program.status = ACTIVE`, and `Purchase.status = PAID`; always scope through ownership fields.
  - [x] 1.3 Return a typed state union such as `ready`, `no_purchase`, `missing_program_recovered`, `missing_profile`, or `missing_day_content`.
  - [x] 1.4 Include only the current `ProgramDay` for the resolved `currentDay`; do not fetch all 14 days unless counting/validation needs it.
  - [x] 1.5 Keep `currentDay` within `1..14` and preserve existing `Program.currentDay` unless a repair path needs a narrow clamp.

- [x] **T2 - Implement approved missing-program recovery path** (AC: 4)
  - [x] 2.1 Reuse `prepareTemplateFirstProgramForUser(...)` and `provisionProgramForPaidPurchase(...)`; do not create a second provisioning implementation.
  - [x] 2.2 Find the latest paid purchase without an active program for the logged-in user.
  - [x] 2.3 If `RecoveryProfile` exists, create/restore the program inside a Prisma transaction with the same timeout pattern used by Story 3.3.
  - [x] 2.4 If no `RecoveryProfile` exists, return a safe fallback state with a link back to onboarding.
  - [x] 2.5 Do not mark failed recovery as success; the UI/API must expose a recoverable state.

- [x] **T3 - Add `GET /api/program/current`** (AC: 2, 4, 6, 7)
  - [x] 3.1 Create `src/app/api/program/current/route.ts`.
  - [x] 3.2 Use `getAuthSession()` and return `401` for unauthenticated requests.
  - [x] 3.3 Return JSON states from the current-program service; avoid redirects in this JSON endpoint.
  - [x] 3.4 Ensure returned JSON is display-ready but small: program id, current day number, total days, status, template version, current day metadata/content summary, and state.

- [x] **T4 - Add protected program entry routes** (AC: 3, 5, 6)
  - [x] 4.1 Add `src/app/(app)/progress/page.tsx` as the main protected app entry.
  - [x] 4.2 Add `src/app/(app)/day/[day]/page.tsx` as a minimal protected placeholder route.
  - [x] 4.3 For unauthenticated users, redirect to `/sign-in` with an encoded callback URL.
  - [x] 4.4 For paid users, use server-side current program resolution and route to the correct current day when entering `/progress`.
  - [x] 4.5 For `/day/[day]`, block invalid/future day access safely; do not implement full Day UI sections owned by Epic 4.
  - [x] 4.6 Show minimal fallback copy for missing profile/program/content, with links to onboarding or landing; keep medical language educational and non-diagnostic.

- [x] **T5 - Replace hardcoded Day 1 checkout success link** (AC: 3)
  - [x] 5.1 Update `src/app/(app)/onboarding/checkout/success/page.tsx` to link to the resolved `unlockState.program.currentDay`.
  - [x] 5.2 Preserve existing dev-mock behavior and checkout reference copy.
  - [x] 5.3 Do not change Stripe Checkout creation, webhook signature verification, pricing, or payment status handling.

- [x] **T6 - Add focused tests and validation** (AC: 8)
  - [x] 6.1 Extend or add Playwright/API coverage for `GET /api/program/current` unauthenticated and authenticated states.
  - [x] 6.2 Cover a paid active program resolving `currentDay` other than 1.
  - [x] 6.3 Cover paid purchase without program recovering into a template-first program when `RecoveryProfile` exists.
  - [x] 6.4 Cover paid purchase without profile returning safe fallback rather than throwing.
  - [x] 6.5 Cover `/progress` redirecting to `/day/{currentDay}`.
  - [x] 6.6 Cover checkout success link using current day instead of always `/day/1`.
  - [x] 6.7 Run `pnpm typecheck`.
  - [x] 6.8 Run `pnpm lint`.
  - [x] 6.9 Run focused `pnpm test:e2e e2e/auth-shell.spec.ts`.
  - [x] 6.10 Run the new focused program-entry E2E/API test.

## Dev Notes

### Product and Architecture Intent

- Story 3.4 is the bridge from "paid user has generated program data" to "the app can reliably enter the right recovery experience." It should make the current program/day resolvable everywhere before Epic 4 renders the full Day UI.
- The product promise is low-friction continuation: after payment or later login, the user should not have to remember where they left off.
- This story owns routing/state resolution, not full daily exercise UX. Epic 4 owns Recovery Header, Today's Focus, exercise cards, completion flow, locked/review polish, and analytics.

### Current Real Code Baseline

- `stories/sprint-status.yaml` marks `3-1-program-domain-models-and-provisioning-inputs`, `3-2-stripe-webhook-unlock-and-program-creation`, and `3-3-template-first-program-generation` as `done`; `3-4-current-program-retrieval-and-progress-entry` is the next backlog story.
- `src/lib/program/provisioning-service.ts` already exposes:
  - `getActiveProgramForUser(userId)`, returning only `{ id, currentDay }` for the newest active paid program.
  - `prepareTemplateFirstProgramForUser(userId)`, which loads `RecoveryProfile` and builds template-first content.
  - `provisionProgramForPaidPurchase(tx, { userId, purchaseId, preparedProgram })`, which creates/upgrades the `Program` and exactly 14 `ProgramDay` rows.
  - `provisionDevMockPurchaseAndProgram(userId)`, used only when Stripe is not configured.
- `src/lib/auth/options.ts` refreshes `token.hasPurchase` and `token.activeProgramId` from `getActiveProgramForUser(...)` on JWT callbacks. Keep that small; do not add current day content to session.
- `src/app/(app)/onboarding/checkout/success/page.tsx` currently links to `/day/1` when `unlockState.program` exists. Story 3.4 should replace this with the resolved `currentDay`.
- There is currently no `src/app/(app)/progress/page.tsx`, no `src/app/(app)/day/[day]/page.tsx`, and no `src/app/api/program/current/route.ts`.

### Data Model Anchors

- `prisma/schema.prisma` has:
  - `Program`: `userId`, `recoveryProfileId`, `purchaseId`, `templateVersion`, `startDate`, `endDate`, `currentDay`, `status`, `generatedSummaryJson`.
  - `ProgramDay`: `programId`, `dayIndex`, `stage`, `contentJson`, `estimatedMinutes`, `completedAt`, `completionPercent`, with `@@unique([programId, dayIndex])`.
  - `Program.purchase` and `Program.recoveryProfile` both use compound ownership relations including `userId`; keep this ownership invariant in all queries.
- `ProgramDay.contentJson` now contains display-ready data from Story 3.3: `title`, `focus`, `summary`, `exerciseSlugs`, `exercises`, `faqSlugs`, `faqs`, `normalSignals`, `getHelpSignals`, `safetyNotes`, and `personalizationFlags`.

### Recommended Service Shape

Prefer a narrow current-program service that keeps API/page logic simple:

```ts
type CurrentProgramState =
  | { status: "ready"; program: CurrentProgramEntry }
  | { status: "no_purchase" }
  | { status: "missing_profile"; purchaseId: string }
  | { status: "missing_program_recovered"; program: CurrentProgramEntry }
  | { status: "missing_day_content"; programId: string; currentDay: number };
```

Implementation guidance:

- Use `getAuthSession()` in pages/routes, then pass `session.user.id` into service helpers.
- The service should resolve the latest active program with a paid purchase and include the current day row only.
- If active program is absent but a paid purchase exists, attempt recovery by reusing Story 3.3 provisioning helpers. Do not duplicate template generation or day creation logic.
- If `Program.currentDay` points to missing content, return a `missing_day_content` fallback rather than throwing in the page.
- Future stories can expand the returned shape, but this story should return only what the protected entry and minimal placeholder need.

### Route and UX Guardrails

- `GET /api/program/current` is a JSON endpoint. It should return status-coded JSON, not server redirects.
- `/progress` is the protected app entry. For a ready/recovered program, redirect to `/day/{currentDay}`.
- `/day/[day]` may render a minimal shell such as "Day X is ready" and a small summary/fallback. It must not implement the full Epic 4 Day Page sections.
- Invalid day params should use `notFound()` or redirect to the resolved current day; choose the smaller pattern that matches existing Next.js App Router usage.
- Future day requests should not unlock content ahead of `Program.currentDay`. Keep the copy simple, e.g. "This day unlocks after you finish earlier days."
- Missing profile/program/content fallback must not imply medical advice; it should point to onboarding or support-style next steps.

### Next.js 16 Notes

- Current Next.js 16 App Router docs confirm `redirect()` can be used in Server Components and Route Handlers, and it throws internally. Call `redirect()` outside `try/catch` blocks.
- Use `NextResponse.json(...)` for App Router route handlers such as `GET /api/program/current`.
- Dynamic route params may be async in current Next.js App Router patterns; follow the local style used by existing pages and TypeScript errors if they surface.

### Testing Requirements

- Existing test framework is Playwright only; do not add Jest/Vitest for this story.
- Existing E2E patterns:
  - `e2e/auth-shell.spec.ts` covers auth redirects, dev login, onboarding, checkout success/cancelled.
  - `e2e/stripe-webhook.spec.ts` creates users/purchases/programs directly with `PrismaClient` and runs API-level assertions only on Desktop Chrome.
- Recommended focused test file: `e2e/program-entry.spec.ts`, or extend `e2e/auth-shell.spec.ts` if the additions are small.
- Tests that create DB rows must clean up created users, purchases, programs, program days, and webhook events by user id/session id as existing tests do.
- Expected validation commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e e2e/auth-shell.spec.ts`
  - `pnpm test:e2e e2e/program-entry.spec.ts` (or the chosen focused file)

### Previous Story Intelligence

- Story 3.3 already replaced placeholder generation with template-first `finger-v1` content and has review patches for:
  - ProgramDay upsert by `[programId, dayIndex]`.
  - Exactly 14 generated day rows.
  - Uniform "stop and contact a clinician" safety language.
  - exercise/FAQ slug validation and exercise bodyPart validation.
- Reuse Story 3.3's provisioning helpers for repair; do not reimplement day row creation in the current-program service.
- Story 3.3 left two deferred items in `stories/deferred-work.md`:
  - Standalone deployment must ensure runtime `content/**` files are packaged.
  - Paid purchase without recovery profile needs a repair/support path. Story 3.4 should handle the user-facing fallback for this state, but full launch support tooling can remain deferred.
- Story 3.2 fixed durable webhook idempotency; do not weaken `StripeWebhookEvent` handling.

### Scope Boundaries

Do not implement in this story:

- Full Day UI: Recovery Header, Today's Focus visual polish, exercise cards, normal/get-help sections, quick questions, sticky completion CTA.
- Completion mutation: `POST /api/program/day/[day]/complete`, exercise-level completion, `Program.currentDay` advancement.
- Chat UI/API, RAG, embeddings, Upstash quotas, analytics events, completion report/PDF, sharing, billing portal, refunds UI, subscriptions, i18n, or native app work.
- New dependencies. Use existing Next.js, Prisma, NextAuth, Playwright, and TypeScript patterns.

### Project Structure Notes

Likely files to add or modify:

- `src/lib/program/current-program-service.ts`
- `src/app/api/program/current/route.ts`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `e2e/program-entry.spec.ts` or `e2e/auth-shell.spec.ts`
- `stories/3-4-current-program-retrieval-and-progress-entry.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- Stripe checkout creation and webhook signature verification.
- `prisma/schema.prisma`; Story 3.4 should be service/page/API work, not a schema migration.
- Program template JSON content, exercise content, FAQ content.
- Marketing pages, onboarding form state machine, AI/RAG modules, analytics setup.

### References

- `epics.md` Epic 3 Story 3.4.
- `技术架构详细设计.md` §7.3 Protected App Routes, §7.4 API Routes, §8.2 Program/ProgramDay, §9.2 Day View -> Completion, §12 Auth and Access Control.
- `UX设计规格说明.md` §7 Day Page.
- `stories/3-3-template-first-program-generation.md`.
- `stories/deferred-work.md`.
- `prisma/schema.prisma`.
- `src/lib/program/provisioning-service.ts`.
- `src/lib/program/program-content.ts`.
- `src/lib/auth/options.ts`.
- `src/app/(app)/onboarding/checkout/success/page.tsx`.
- `e2e/auth-shell.spec.ts`.
- `e2e/stripe-webhook.spec.ts`.
- Next.js v16.1.1 docs via Context7: `redirect()` in App Router and `NextResponse.json` Route Handlers.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 3.3 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` does not exist in this repository; paths were resolved from the project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Current repository commit titles are not descriptive (`1`), so guidance is based on story records and current files rather than commit messages.
- Next.js latest behavior checked against Context7 for Next.js v16.1.1: `redirect()` is valid in Server Components/Route Handlers and `NextResponse.json` is the Route Handler JSON pattern.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 3.4 should make paid-user app entry reliable by resolving the current program/day server-side, adding a small API endpoint, adding protected entry routes, and recovering missing programs through existing template-first provisioning helpers.
- The story deliberately freezes full Day UI, completion flow, Chat, analytics, and launch polish out of scope.
- Implementation summary (2026-05-06):
  - Added `src/lib/program/current-program-service.ts` with the `CurrentProgramState` union (`ready`, `missing_program_recovered`, `no_purchase`, `missing_profile`, `missing_day_content`). Service scopes by `userId`, `Program.status = ACTIVE`, `Purchase.status = PAID`, returns only the resolved current `ProgramDay` row, and clamps `currentDay` into `1..14`.
  - Missing-program recovery reuses Story 3.3 helpers (`prepareTemplateFirstProgramForUser` + `provisionProgramForPaidPurchase`) inside a `prisma.$transaction({ timeout: 30000 })` and falls back to `missing_profile` if no `RecoveryProfile` is on file.
  - Added `GET /api/program/current` route handler returning `401` unauthenticated and otherwise emitting JSON states (`ready` / `missing_program_recovered` / `missing_profile` / `missing_day_content` / `no_purchase`) with `redirectTo` hints; does not perform server redirects.
  - Added protected `src/app/(app)/progress/page.tsx` that redirects ready/recovered users to `/day/{currentDay}` and otherwise renders a minimal fallback copy linking back to onboarding/landing.
  - Added protected `src/app/(app)/day/[day]/page.tsx` that:
    - Redirects unauthenticated users to `/sign-in` with encoded `callbackUrl`.
    - Redirects invalid day params (non-1..14 integers) to `/progress`.
    - Bounces no-purchase / missing-profile to `/onboarding`, missing day content to `/progress`.
    - Blocks future days by redirecting to `/day/{currentDay}`.
    - Renders a minimal placeholder for the active day with title/focus/summary/stage/template, plus a softer past-day recap shell. No exercise cards, completion CTA, chat, analytics, or other Epic 4 surface.
  - Updated `src/app/(app)/onboarding/checkout/success/page.tsx` to use `unlockState.program?.currentDay` for the "Open Day {n}" CTA, preserving dev-mock behavior and checkout reference copy.
  - Did not modify session/JWT shape: detailed program data stays server-side or behind `GET /api/program/current` (AC7 honored).
  - Review patch: fixed active paid programs whose `Program.currentDay` points to a missing `ProgramDay` row so they return `missing_day_content` instead of falling through to `no_purchase`; added focused regression coverage for the API and `/day/{currentDay}` fallback.
- Validation:
  - `pnpm typecheck` passed.
  - `pnpm lint` passed.
  - `pnpm test:e2e e2e/program-entry.spec.ts` (Desktop Chrome): 9/9 passed (401 on unauthenticated, no_purchase fallback, paid currentDay > 1 routing to `/day/5`, future-day clamp, invalid day fallback, missing current day row -> `missing_day_content`, missing-program recovery, missing-profile fallback, unauthenticated `/progress` and `/day/[day]` redirect to sign-in).
  - `pnpm test:e2e e2e/auth-shell.spec.ts` (Desktop Chrome): 15/15 passed (no regression on sign-in, onboarding, eligibility gate, recovery profile, dev checkout success, cancelled flow).
  - `pnpm test:e2e e2e/stripe-webhook.spec.ts` (Desktop Chrome): 7/7 passed (no regression on webhook signature, idempotency, placeholder upgrade, missing profile, refund flows).

### File List

- `src/lib/program/current-program-service.ts` (new)
- `src/app/api/program/current/route.ts` (new)
- `src/app/(app)/progress/page.tsx` (new)
- `src/app/(app)/day/[day]/page.tsx` (new)
- `src/app/(app)/onboarding/checkout/success/page.tsx` (modified)
- `e2e/program-entry.spec.ts` (new)
- `stories/3-4-current-program-retrieval-and-progress-entry.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-06: Implemented Story 3.4 (T1-T6); story marked `review` after focused E2E + auth-shell + stripe-webhook regressions all green.
- 2026-05-06: Addressed lightweight review finding for missing current-day row fallback; `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` pass.
