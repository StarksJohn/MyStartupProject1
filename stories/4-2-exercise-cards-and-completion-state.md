# Story 4.2: Exercise Cards and Completion State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user following today's plan,
I want to complete exercises one by one,
so that I can feel progress and stay on track.

## Acceptance Criteria

1. **AC1 - Exercise cards render from current `ProgramDay.contentJson`**
   **Given** a logged-in paid user has an active program and current `ProgramDay`
   **When** they open `/day/{currentDay}`
   **Then** the page renders an Exercise Cards section below Today's Focus
   **And** each card shows the exercise title/name, duration/reps or fallback effort guidance, instructions/notes, and a clear completion control
   **And** the data comes from the server-resolved current `ProgramDay.contentJson.exercises`, not hardcoded mock content.

2. **AC2 - Exercise content parsing is defensive and typed**
   **Given** exercise entries may be missing optional fields or contain unexpected JSON shapes
   **When** the Day page parses exercise content
   **Then** invalid exercise rows are skipped or shown through a safe fallback without crashing
   **And** the implementation avoids `any` and does not expose unrelated full content structures to the client.

3. **AC3 - Per-exercise completion state works within the page session**
   **Given** the user checks or unchecks an exercise card
   **When** the interaction occurs
   **Then** the UI immediately reflects the per-card completion state
   **And** the visible day completion percentage recalculates based on completed exercise count.

4. **AC4 - Completion state persistence boundary is explicit**
   **Given** Story 4.3 owns server-side day completion mutation and `Program.currentDay` advancement
   **When** Story 4.2 adds exercise-level state
   **Then** it may persist lightweight per-exercise UI state only if using existing browser/local state patterns without new dependencies
   **And** it must not add `POST /api/program/day/[day]/complete`, change Prisma schema, mutate `ProgramDay.completedAt`, or advance `Program.currentDay`.

5. **AC5 - Mobile readability and accessibility**
   **Given** the user is on a mobile viewport
   **When** exercise cards render
   **Then** card titles, instructions, and completion controls remain readable and keyboard/screen-reader usable
   **And** controls use accessible labels tied to each exercise rather than ambiguous checkbox text.

6. **AC6 - Scope stays limited to cards and local completion state**
   **Given** later stories own day completion, locked/review polish, chat, analytics, and reporting
   **When** Story 4.2 is implemented
   **Then** it must not implement sticky day-complete CTA behavior, day-complete confirmation, backend completion endpoints, Chat UI/API, analytics events, PDF/reporting, billing/refund, i18n, native app work, or new dependencies.

7. **AC7 - Existing routing and focus sections remain intact**
   **Given** Story 4.1 already renders Day Header + Today's Focus and Story 3.4 already protects route entry
   **When** Exercise Cards are added
   **Then** unauthenticated redirects, future-day redirect, invalid-day fallback, missing-content fallback, Day Header, Today's Focus, and safety copy continue to work.

8. **AC8 - Focused regression coverage**
   **Given** this story adds interactive client UI to the protected Day page
   **When** implementation is complete
   **Then** tests cover exercise card rendering, accessible completion toggles, completion percentage recalculation, malformed exercise content fallback, mobile readability, and preserved Story 3.4/4.1 behavior
   **And** `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/program-entry.spec.ts`, and any new focused Day page E2E test pass.

## Tasks / Subtasks

- [x] **T1 - Add typed exercise parsing for Day page UI** (AC: 1, 2)
  - [x] 1.1 Extend `src/lib/program/current-program-service.ts` or a narrow `src/lib/program/day-content.ts` helper to parse the exercise subset needed for cards.
  - [x] 1.2 Parse only display-safe fields: slug/id, title/name, summary/instructions, duration/reps, notes/cautions when available.
  - [x] 1.3 Skip or safely degrade malformed exercise entries without crashing.
  - [x] 1.4 Keep `title` + `focus` required for the overall day content; do not weaken Story 4.1's missing-content behavior.

- [x] **T2 - Add Exercise Cards UI below Today's Focus** (AC: 1, 5, 6, 7)
  - [x] 2.1 Add a small client component under `src/components/day-plan/` if interactivity is needed; keep server-only route logic in `src/app/(app)/day/[day]/page.tsx`.
  - [x] 2.2 Render exercise cards below Today's Focus and before later-story placeholders.
  - [x] 2.3 Each card must show exercise title, practical guidance, and completion control.
  - [x] 2.4 Use accessible labels such as `Mark Gentle finger bends complete`.
  - [x] 2.5 Keep the card UI mobile-first and readable; avoid dense multi-column layouts on narrow screens.

- [x] **T3 - Implement local per-exercise completion state** (AC: 3, 4, 6)
  - [x] 3.1 Track checked/unchecked state in the Day page client component.
  - [x] 3.2 Recalculate visible exercise completion percentage as cards are toggled.
  - [x] 3.3 Do not mutate Prisma, `ProgramDay.completedAt`, `ProgramDay.completionPercent`, or `Program.currentDay`.
  - [x] 3.4 If using persistence, keep it local/browser-scoped and clearly separate from server truth until Story 4.3.

- [x] **T4 - Preserve routing, focus, and fallback behavior** (AC: 6, 7)
  - [x] 4.1 Keep Story 3.4 protected routing and fallback behavior unchanged.
  - [x] 4.2 Keep Story 4.1 Day Header + Today's Focus visible and above Exercise Cards.
  - [x] 4.3 Ensure malformed or empty exercise arrays show a clear placeholder such as "Exercise details are being prepared" rather than crashing.
  - [x] 4.4 Do not add analytics, chat, sticky completion, server completion endpoint, schema migration, or new dependencies.

- [x] **T5 - Add focused tests and validation** (AC: 8)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` or create a focused `e2e/day-exercises.spec.ts`.
  - [x] 5.2 Cover exercise card rendering from seeded `contentJson.exercises`.
  - [x] 5.3 Cover toggle behavior and visible completion percentage recalculation.
  - [x] 5.4 Cover malformed/empty exercises fallback.
  - [x] 5.5 Cover accessible labels and mobile viewport readability.
  - [x] 5.6 Confirm future-day redirect, invalid-day fallback, missing-content fallback, and unauthenticated redirect still pass.
  - [x] 5.7 Run `pnpm typecheck`.
  - [x] 5.8 Run `pnpm lint`.
  - [x] 5.9 Run focused `pnpm test:e2e e2e/program-entry.spec.ts`.
  - [x] 5.10 Run any new focused Day exercise E2E test.

## Dev Notes

### Product and UX Intent

- Story 4.2 starts making the Day page actionable without yet completing a whole day.
- The user should see exercises as manageable cards with a small sense of progress after each toggle.
- Keep the psychology simple: "I did this one" should update the visible state immediately.
- The final day-complete action, persistence semantics, and `Program.currentDay` advancement belong to Story 4.3.

### Current Real Code Baseline

- Story 4.1 completed:
  - `src/lib/program/current-program-service.ts` now returns Day Header + Focus fields plus `normalSignals`, `getHelpSignals`, `safetyNotes`, and `personalizationFlags`.
  - `src/app/(app)/day/[day]/page.tsx` renders Day Header + Today's Focus and keeps route/fallback behavior.
  - `e2e/program-entry.spec.ts` covers current-day UI, malformed content fallback, mobile viewport, and entry-route regressions.
- Current Day page is still mostly a Server Component. For interactive exercise toggles, create a focused client component instead of making the whole page client-side.

### Content Model Anchors

- `ProgramDay.contentJson` from Story 3.3 includes:
  - `exerciseSlugs`
  - `exercises`
  - `faqSlugs`
  - `faqs`
  - `normalSignals`
  - `getHelpSignals`
  - `safetyNotes`
  - `personalizationFlags`
- `content/exercises/finger-basic-v1.json` contains the canonical exercise source used by generated day content.
- Story 4.2 should parse only what is needed for exercise cards. Do not render full FAQ lists or AI/chat content here.

### Recommended Component Shape

- Keep `src/app/(app)/day/[day]/page.tsx` responsible for:
  - auth/session checks,
  - current program resolution,
  - route redirects,
  - passing parsed current-day exercise card props into a client component.
- Add a client component such as:
  - `src/components/day-plan/exercise-cards.tsx`
- Suggested prop shape:

```ts
interface DayExerciseCard {
  slug: string;
  title: string;
  summary: string;
  durationLabel: string;
  notes: string[];
}
```

- The component can keep `completedBySlug` in React state and derive:

```ts
const completionPercent =
  exercises.length === 0 ? 0 : Math.round((completedCount / exercises.length) * 100);
```

### Route and UX Guardrails

- Do not change Story 3.4 access control:
  - unauthenticated -> `/sign-in?callbackUrl=...`
  - invalid day -> `/progress`
  - no purchase / missing profile -> `/onboarding`
  - missing content -> `/progress`
  - future day -> `/day/{currentDay}`
- Past days should stay read-only/review-oriented.
- Exercise cards should not appear as editable controls in past-day review mode unless explicitly read-only.
- Medical language stays educational and non-diagnostic. Exercise card copy must not imply that completing cards means medical clearance.

### Testing Requirements

- Existing `e2e/program-entry.spec.ts` seeds `ProgramDay.contentJson`; extend seed data with an `exercises` array that mirrors real generated content shape enough to validate rendering.
- Test interactively:
  - first card unchecked -> check -> progress updates,
  - second card check -> progress updates,
  - uncheck -> progress recalculates.
- Keep tests on Desktop Chrome unless a mobile project is stable; explicit `page.setViewportSize({ width: 390, height: 844 })` is acceptable for focused mobile assertions.

### Previous Story Intelligence

- Story 4.1 review patched blank string parsing; preserve this behavior while adding exercise parsing.
- Story 4.1's top sections must remain above exercise cards.
- Story 3.4/4.1 regression suite is currently `e2e/program-entry.spec.ts` with 12 passing tests on Desktop Chrome.

### Scope Boundaries

Do not implement in this story:

- Server-side day completion mutation.
- `POST /api/program/day/[day]/complete`.
- `Program.currentDay` advancement.
- Sticky day-complete CTA behavior or confirmation modal.
- AI Chat entry/API, analytics events, PDF/reporting, sharing, billing/refund, i18n, native app work.
- Prisma schema changes or new dependencies.

### Likely Files to Add or Modify

- `src/lib/program/current-program-service.ts`
- `src/app/(app)/day/[day]/page.tsx`
- `src/components/day-plan/exercise-cards.tsx` (new, if using a client component)
- `e2e/program-entry.spec.ts` or `e2e/day-exercises.spec.ts`
- `stories/4-2-exercise-cards-and-completion-state.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### References

- `epics.md` Epic 4 Story 4.2.
- `UX设计规格说明.md` §7.3 Exercise Cards and §7.4 completion-related interactions.
- `技术架构详细设计.md` §9.2 Day View -> Completion.
- `stories/4-1-day-header-and-todays-focus.md`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/lib/program/current-program-service.ts`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 4.1 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` does not exist in this repository; paths were resolved from the project root, `项目主档案.md`, and `stories/sprint-status.yaml`.

### Completion Notes List

- Story 4.2 should add exercise-card rendering and page-local per-card completion state without server mutation.
- The story deliberately freezes day completion endpoint, `Program.currentDay` advancement, sticky completion CTA behavior, Chat, analytics, and launch polish out of scope.
- The dev agent should preserve Story 3.4 routing and Story 4.1 header/focus layout while adding the next actionable section.
- Implemented typed `DayExerciseCard` parsing in `current-program-service`, including defensive skip behavior for malformed rows and safe duration/repetition fallback labels.
- Added `src/components/day-plan/exercise-cards.tsx` as a focused client component with local checkbox state, accessible per-exercise labels, live completion percentage, and empty-exercise fallback copy.
- Wired Exercise Cards below Today's Focus on the current Day page while keeping past-day review mode read-only and preserving Story 3.4/4.1 routing and top-section behavior.
- Extended `e2e/program-entry.spec.ts` to cover exercise rendering from seeded `contentJson.exercises`, accessible completion toggles, 0/50/100/50 percentage recalculation, malformed exercise fallback, mobile visibility, and existing entry-route regressions.
- Validation passed on 2026-05-07: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 13/13 tests passing.
- Light code review completed on 2026-05-07. One safety-copy issue was patched: all exercise cautions are now rendered instead of only the first caution, and completion counts now derive from the current exercise list. Re-validation passed with `pnpm typecheck`, `pnpm lint`, and focused E2E 13/13.

### File List

- `src/lib/program/current-program-service.ts`
- `src/components/day-plan/exercise-cards.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `e2e/program-entry.spec.ts`
- `stories/4-2-exercise-cards-and-completion-state.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-07: Implemented Story 4.2 exercise cards, page-local completion state, focused E2E coverage, and moved story to code-review.
- 2026-05-07: Completed light code review patch for full caution rendering and robust local completion counting; moved story to done.

### Senior Developer Review (AI)

Outcome: Approved after patch

Findings:

- Medium: `src/components/day-plan/exercise-cards.tsx` rendered only the first parsed exercise caution even though `contentJson.exercises[].contraindications` can contain multiple safety constraints. This risked hiding relevant medical boundary copy. Patched by rendering every caution and adding E2E coverage for a second caution.

Residual Risk:

- Story 4.2 intentionally keeps completion state page-local. Refreshing the page resets exercise checkboxes until Story 4.3 introduces server-side day completion.
