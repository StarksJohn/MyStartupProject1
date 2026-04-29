# Story 2.3: Recovery Profile Multi-Step Form

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an eligible user,
I want to complete a short multi-step recovery profile,
so that the product can tailor the 14-day plan to my situation.

## Acceptance Criteria

1. **AC1 - Eligible users can continue from Step 1 into Step 2**
   **Given** an authenticated user completes the existing Eligibility & Safety Gate with an `eligible` result
   **When** the eligible outcome is shown
   **Then** the UI provides a clear continue action into `Step 2 of 3` Recovery Profile
   **And** users with `not_eligible` or `needs_clinician_attention` outcomes cannot continue into profile capture.

2. **AC2 - Recovery Profile collects only MVP program-mapping fields**
   **Given** the user reaches Recovery Profile
   **When** the form renders
   **Then** it collects body part, subtype, cast removed date, hardware status, PT referral, pain level, dominant hand impact, and work type
   **And** optional notes may be captured only if they help future program mapping
   **And** it does not collect payment, program, chat, AI, diagnosis, or treatment-plan fields.

3. **AC3 - Multi-step profile UX preserves answers and avoids overload**
   **Given** the Recovery Profile has multiple groups of fields
   **When** the user moves between profile substeps
   **Then** the experience shows progress, previous/next controls, saved answers, and mobile-first spacing
   **And** unrelated questions are not crammed into a single screen.

4. **AC4 - Validation blocks incomplete or invalid profile submission**
   **Given** required profile fields are missing or invalid
   **When** the user tries to advance or submit
   **Then** inline validation explains what must be fixed
   **And** valid answers are preserved while the user corrects the invalid fields.

5. **AC5 - Completed profile is persisted for the signed-in user**
   **Given** the user submits a valid Recovery Profile
   **When** the server receives the profile
   **Then** it validates the input again, associates it with `session.user.id`, and creates or updates the user's current `RecoveryProfile`
   **And** it does not create `Purchase`, `Program`, `ProgramDay`, Stripe checkout sessions, or AI/chat records.

6. **AC6 - Completion stops at a Story 2.4 summary placeholder**
   **Given** the profile is saved successfully
   **When** the UI transitions after submission
   **Then** it shows that the profile is ready for the future personalized summary and checkout step
   **And** it does not implement the final summary, price block, refund framing, or `Unlock my 14-day plan` checkout behavior in this story.

7. **AC7 - Regression coverage protects eligibility, profile validation, and persistence**
   **Given** Story 2.2 auth and eligibility coverage is green
   **When** Story 2.3 is implemented
   **Then** E2E coverage proves unauthenticated `/onboarding` still redirects to sign-in, eligible users can reach Recovery Profile, not-eligible and clinician-attention users cannot, validation errors render, valid profile submission reaches the Story 2.4 placeholder, and public routes remain green.

## Tasks / Subtasks

- [x] **T1 - Extend the onboarding client flow after eligible result** (AC: 1, 3, 6)
  - [x] 1.1 Update `src/components/onboarding/eligibility-gate.tsx` or split a parent flow component under `src/components/onboarding/` so eligible users can continue into Recovery Profile.
  - [x] 1.2 Preserve Story 2.2 behavior for `not_eligible` and `needs_clinician_attention`; those outcomes must still stop before profile capture.
  - [x] 1.3 Show `Step 2 of 3`, "Recovery Profile", previous/next controls, and a final placeholder for Story 2.4 after save.

- [x] **T2 - Add typed Recovery Profile domain validation** (AC: 2, 4, 5)
  - [x] 2.1 Add `src/lib/onboarding/recovery-profile.ts` with explicit TypeScript unions and a Zod schema for profile inputs.
  - [x] 2.2 Keep field choices narrow: `bodyPart` should stay within `finger` / `metacarpal`; `painLevel` should be numeric and bounded.
  - [x] 2.3 Validate `castRemovedAt` as a real date; do not infer medical clearance or recommend exercises from this date.
  - [x] 2.4 Keep the helper deterministic and free of Stripe, AI, analytics, RAG, and hidden mutable globals.

- [x] **T3 - Add RecoveryProfile persistence without downstream business models** (AC: 5)
  - [x] 3.1 Update `prisma/schema.prisma` with a `RecoveryProfile` model related to `User`.
  - [x] 3.2 Include only current story fields: `userId`, `bodyPart`, `subType`, `castRemovedAt`, `hasHardware`, `referredToPt`, `painLevel`, `dominantHandAffected`, `jobType`, optional `notes`, optional `riskFlagsJson`, timestamps.
  - [x] 3.3 Add a server-side save path such as `src/app/api/onboarding/recovery-profile/route.ts` or an established server action if the codebase already uses one by implementation time.
  - [x] 3.4 Require `getAuthSession()` on the server and ignore any client-supplied `userId`.
  - [x] 3.5 Implement create-or-update semantics for the current signed-in user's profile; do not create purchases or programs.

- [x] **T4 - Build the mobile-first multi-step form UI** (AC: 2, 3, 4, 6)
  - [x] 4.1 Add `src/components/onboarding/recovery-profile-form.tsx`.
  - [x] 4.2 Reuse existing `react-hook-form`, `@hookform/resolvers`, `zod`, and `Button`; do not add a new form library.
  - [x] 4.3 Group fields into small profile substeps such as injury details, recovery context, and daily-life impact.
  - [x] 4.4 Preserve entered answers when navigating previous/next.
  - [x] 4.5 Show inline validation errors before advancing or submitting.
  - [x] 4.6 After a successful save, show a Story 2.4 placeholder and no checkout CTA.

- [x] **T5 - Add focused automated coverage** (AC: 1, 4, 5, 6, 7)
  - [x] 5.1 Extend `e2e/auth-shell.spec.ts` or add `e2e/onboarding-recovery-profile.spec.ts`.
  - [x] 5.2 Assert unauthenticated `/onboarding` still redirects to `/sign-in?callbackUrl=%2Fonboarding`.
  - [x] 5.3 Assert eligible answers reveal the Recovery Profile continue action and Step 2 form.
  - [x] 5.4 Assert not-eligible and clinician-attention outcomes do not show Recovery Profile fields.
  - [x] 5.5 Assert required-field validation blocks incomplete profile submission.
  - [x] 5.6 Assert a valid profile submission reaches the Story 2.4 placeholder.
  - [x] 5.7 Preserve existing public Landing / Blog / Legal / FAQ / 404 coverage.
  - [x] 5.8 Run `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and focused E2E after implementation.

## Dev Notes

### Product and UX Intent

- Story 2.3 is the second step in the fixed onboarding sequence: Eligibility Gate -> Recovery Profile -> Personalized Summary + Checkout CTA.
- The goal is to gather the minimum data needed for future template-first 14-day program mapping, not to produce medical advice.
- Source requirements: `epics.md` Story 2.3 / FR3, `UX设计规格说明.md` §6.3 Step 2, and `技术架构详细设计.md` §7.5 / §8.2 / §9.1.

### Current Real Code Baseline

- Story 2.2 is complete and `stories/sprint-status.yaml` marks `2-2-eligibility-safety-gate` as `done`.
- `/onboarding` is currently protected by `src/app/(app)/onboarding/page.tsx` with `getAuthSession()` and redirects unauthenticated users to `/sign-in?callbackUrl=%2Fonboarding`.
- The Step 1 client component lives at `src/components/onboarding/eligibility-gate.tsx`.
- Eligibility logic lives at `src/lib/onboarding/eligibility.ts` and returns `eligible`, `not_eligible`, or `needs_clinician_attention`.
- `prisma/schema.prisma` currently contains only NextAuth auth tables. Story 2.3 is the first story expected to introduce `RecoveryProfile`.
- `e2e/auth-shell.spec.ts` now runs the auth shell describe serially because parallel credentials login was flaky on Windows/Next.js dev server startup.

### Required Implementation Pattern

- Keep `/onboarding` authenticated for now. Do not refactor to anonymous onboarding in this story.
- Keep Step 1 safety stops intact. Profile capture must only be reachable after a current-session eligible result.
- Prefer a small typed domain module for profile schema and type exports; do not bury profile validation inside JSX.
- Server-side persistence must trust the session, not client-supplied identity.
- If Prisma schema changes, run `pnpm db:generate`. Do not add Stripe, Program, Chat, RAG, analytics, i18n, or new dependencies.

### Suggested Profile Inputs

- `bodyPart`: `finger` / `metacarpal`
- `subType`: short controlled list or typed string for MVP mapping
- `castRemovedAt`: date
- `hasHardware`: `yes` / `no` / `not_sure`
- `referredToPt`: `yes` / `no` / `not_sure`
- `painLevel`: 0-10 numeric scale
- `dominantHandAffected`: `yes` / `no`
- `jobType`: controlled options such as desk, manual, caregiving, student, other
- `notes`: optional, short, non-diagnostic context only

### Scope Exclusions

- No Personalized Summary implementation beyond a placeholder.
- No price block, refund framing, checkout CTA, Stripe Checkout, webhook, or payment state.
- No `Purchase`, `Program`, `ProgramDay`, AI, RAG, chat, analytics, localization, doctor/admin, or native app logic.
- No medical clearance language such as "safe to exercise" or "you are healing normally."

### Testing Requirements

- Minimum validation commands after implementation:
  - `pnpm db:generate`
  - `pnpm typecheck`
  - `pnpm lint`
  - focused Playwright coverage for auth + onboarding profile
- Full `pnpm test:e2e` remains recommended before marking the whole release scope ready.

### Project Structure Notes

- Files expected to change or be created:
  - `prisma/schema.prisma`
  - `src/app/(app)/onboarding/page.tsx`
  - `src/app/api/onboarding/recovery-profile/route.ts` or equivalent server action
  - `src/components/onboarding/eligibility-gate.tsx`
  - `src/components/onboarding/recovery-profile-form.tsx`
  - `src/lib/onboarding/recovery-profile.ts`
  - `e2e/auth-shell.spec.ts` or `e2e/onboarding-recovery-profile.spec.ts`
  - `stories/2-3-recovery-profile-multi-step-form.md`
  - `stories/sprint-status.yaml`
  - `项目主档案.md`

### Previous Story Intelligence

- Story 2.2 established the Step 1 gate and kept all Recovery Profile details out of the eligibility classifier.
- The stale-outcome review fix means results are tied to submitted answer snapshots; preserve that behavior if the flow component is refactored.
- The red-flag clinician-attention path uses assertive alert semantics and must remain a hard stop.
- The auth E2E helper uses unique dev emails and serial describe mode for stability; keep this pattern for new onboarding E2E tests.

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

- `pnpm db:generate` passed after adding `RecoveryProfile`.
- `pnpm typecheck` and `pnpm lint` passed.
- `pnpm exec prisma db push` failed because `DATABASE_URL` is not configured in the current shell.
- Local fallback check: Docker is not installed/available in the current shell, and `localhost:5432` is not accepting TCP connections.
- Focused `pnpm test:e2e e2e/auth-shell.spec.ts` currently passes 20/22 tests; the 2 valid profile submission tests fail because the API cannot initialize Prisma without `DATABASE_URL`.
- Supabase SQL Editor was used to apply the Prisma-generated schema because direct `prisma db push` could not reach the IPv6-only direct host from this environment.
- `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and focused `pnpm test:e2e e2e/auth-shell.spec.ts` passed after configuring Supabase pooler access and applying the schema.

### Completion Notes List

- Implemented eligible-to-profile onboarding transition while preserving `not_eligible` and `needs_clinician_attention` hard stops.
- Added typed Recovery Profile validation and a Prisma-backed save API scoped to the signed-in user.
- Added the mobile-first multi-step Recovery Profile form and Story 2.4 placeholder.
- Added focused E2E coverage for Step 2 reachability, safety stops, validation, and valid submission; valid submission remains blocked in this environment until `DATABASE_URL` is configured and the schema is pushed.
- Verified the persisted valid-submission path against Supabase; Story 2.3 is ready for code review.

### Review Findings

- [x] [Review] Lightweight Story 2.3 review found no blocking patch items. Persistence, safety stops, validation, and Story 2.4 placeholder coverage are verified.

### File List

- `prisma/schema.prisma`
- `src/app/api/onboarding/recovery-profile/route.ts`
- `src/components/onboarding/eligibility-gate.tsx`
- `src/components/onboarding/recovery-profile-form.tsx`
- `src/lib/onboarding/recovery-profile.ts`
- `e2e/auth-shell.spec.ts`
- `stories/2-3-recovery-profile-multi-step-form.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
- `.gitignore`

### Change Log

- 2026-04-27: Created Story 2.3 Recovery Profile Multi-Step Form and moved story to `ready-for-dev`.
- 2026-04-27: Implemented Story 2.3 core code; validation blocked from code-review by missing `DATABASE_URL` for Prisma persistence E2E.
- 2026-04-28: Applied schema through Supabase SQL Editor, verified focused E2E 22/22, and moved story to `code-review`.
- 2026-04-29: Lightweight review confirmed no blocking patch items; moved story to `done`.
