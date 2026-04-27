# Story 2.2: Eligibility and Safety Gate

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a prospective user,
I want to be screened for obvious ineligibility or safety mismatches before I pay,
so that I do not buy a plan that should not be used for my situation.

## Acceptance Criteria

1. **AC1 - Authenticated onboarding entry shows Step 1 eligibility gate**
   **Given** Story 2.1 already protects `/onboarding` behind Magic Link identity
   **When** an authenticated user opens `/onboarding`
   **Then** they see the onboarding Step 1 experience for "Eligibility & Safety Gate"
   **And** the page shows progress such as `Step 1 of 3`, a concise safety disclaimer, and mobile-first spacing.

2. **AC2 - Gate collects only MVP eligibility inputs**
   **Given** the gate is the first onboarding step
   **When** the form renders
   **Then** it asks only the minimum questions needed to classify fit:
   - whether the user has already been evaluated by a clinician
   - whether cast / splint / fixed immobilization has been removed or is near removal
   - whether the injury is in the MVP scope of finger or metacarpal recovery
   - whether there are severe warning symptoms or complex injury signals
   **And** it does not collect Recovery Profile details such as subtype, pain level, job type, dominant hand impact, PT referral, or notes.

3. **AC3 - Eligible users can continue toward the future profile step**
   **Given** the user answers within MVP scope
   **When** the gate evaluates the answers
   **Then** the result is `eligible`
   **And** the UI clearly tells the user they can continue to the Recovery Profile step once Story 2.3 is implemented.

4. **AC4 - Not eligible users are stopped before profile capture**
   **Given** the user is outside MVP scope, such as not yet evaluated by a clinician, still fully immobilized outside the cast-removal window, or not recovering from a finger / metacarpal fracture
   **When** the gate evaluates the answers
   **Then** the result is `not_eligible`
   **And** the UI stops the flow before any Recovery Profile capture
   **And** the page offers a route back to the landing page and a link to the medical disclaimer.

5. **AC5 - Safety red flags produce clinician-attention state**
   **Given** the user reports severe pain, numbness, blue or purple color, fever, pus, rapidly worsening swelling, inability to move, or another urgent warning sign
   **When** the gate evaluates the answers
   **Then** the result is `needs_clinician_attention`
   **And** the UI displays a prominent warning message that the product cannot guide this situation and the user should contact a clinician or seek urgent care if symptoms feel urgent.

6. **AC6 - Classification logic is deterministic and testable**
   **Given** future stories will depend on the eligibility outcome
   **When** the implementation adds classification logic
   **Then** the logic lives outside the React component in a small typed module, for example `src/lib/onboarding/eligibility.ts`
   **And** it uses explicit TypeScript unions for the allowed answers and result values: `eligible`, `not_eligible`, and `needs_clinician_attention`
   **And** it does not depend on AI, network calls, database writes, or hidden mutable globals.

7. **AC7 - Regression coverage protects auth and public routes**
   **Given** Story 2.1 added auth E2E coverage and Epic 1 public routes are done
   **When** Story 2.2 is implemented
   **Then** E2E coverage proves unauthenticated `/onboarding` still redirects to `/sign-in`
   **And** dev login can reach the eligibility gate
   **And** eligible, not eligible, and clinician-attention outcomes can be exercised
   **And** existing landing, blog, legal, FAQ, 404, and mobile public route coverage continues to pass.

## Tasks / Subtasks

- [x] **T1 - Replace onboarding placeholder with Step 1 gate shell** (AC: 1)
  - [x] 1.1 Keep `/onboarding` in `src/app/(app)/onboarding/page.tsx`; do not add a parallel route for the same flow.
  - [x] 1.2 Keep the existing `getAuthSession()` server check and unauthenticated redirect to `/sign-in?callbackUrl=%2Fonboarding`.
  - [x] 1.3 Replace the "Identity ready for onboarding" placeholder with a Step 1 onboarding layout.
  - [x] 1.4 Show `Step 1 of 3`, "Eligibility & Safety Gate", and education-only / not-a-medical-device framing.
  - [x] 1.5 Keep mobile-first layout and reuse existing token classes / `Button` where possible.

- [x] **T2 - Implement deterministic eligibility classifier** (AC: 2, 3, 4, 5, 6)
  - [x] 2.1 Add a typed helper module such as `src/lib/onboarding/eligibility.ts`.
  - [x] 2.2 Define answer and result types without `any`.
  - [x] 2.3 Return `needs_clinician_attention` before any ordinary eligibility result when red flags are present.
  - [x] 2.4 Return `not_eligible` for users who have not seen a clinician, are outside the MVP cast-removal window, or are outside finger / metacarpal scope.
  - [x] 2.5 Return `eligible` only when all MVP-fit conditions pass.
  - [x] 2.6 Keep this helper pure and free of Prisma, NextAuth, Stripe, analytics, or AI dependencies.

- [x] **T3 - Build the eligibility form UI** (AC: 1, 2, 3, 4, 5)
  - [x] 3.1 Add a focused client component such as `src/components/onboarding/eligibility-gate.tsx`.
  - [x] 3.2 Use the existing `react-hook-form` + `zod` dependencies from `package.json`; do not add a new form library.
  - [x] 3.3 Ask only the Step 1 gate questions; explicitly leave Recovery Profile fields for Story 2.3.
  - [x] 3.4 Show validation messages when required answers are missing.
  - [x] 3.5 Show an eligible outcome panel with a clear next-step placeholder for Recovery Profile.
  - [x] 3.6 Show a not-eligible outcome panel with landing and disclaimer links.
  - [x] 3.7 Show a clinician-attention warning panel with visually prominent critical styling and clinician guidance.
  - [x] 3.8 Do not persist answers to the database in this story.

- [x] **T4 - Preserve public/auth behavior and scope boundaries** (AC: 4, 5, 7)
  - [x] 4.1 Keep public marketing, blog, legal, FAQ, and 404 routes public.
  - [x] 4.2 Do not introduce `RecoveryProfile`, `Purchase`, `Program`, `ProgramDay`, `ChatMessage`, `KnowledgeChunk`, Stripe, RAG, AI, analytics, or checkout code.
  - [x] 4.3 Do not change NextAuth provider setup or session fields unless a direct type error requires a narrow fix.
  - [x] 4.4 Do not add i18n, `[locale]`, Google OAuth, passwords, subscriptions, native app logic, or doctor/admin surfaces.

- [x] **T5 - Add focused automated coverage** (AC: 1, 3, 4, 5, 6, 7)
  - [x] 5.1 Extend `e2e/auth-shell.spec.ts` or add a focused `e2e/onboarding-eligibility.spec.ts`.
  - [x] 5.2 Assert unauthenticated `/onboarding` redirects to sign-in as before.
  - [x] 5.3 Assert dev login opens the eligibility gate and no longer shows the old identity placeholder.
  - [x] 5.4 Assert an eligible answer set shows the eligible continuation state.
  - [x] 5.5 Assert an out-of-scope answer set shows the not-eligible stop state.
  - [x] 5.6 Assert red-flag symptoms show the clinician-attention state.
  - [x] 5.7 Preserve existing public shell E2E expectations.
  - [x] 5.8 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` after implementation.

### Review Findings

- [x] [Review][Patch] Clear stale outcome when answers change after submit [`src/components/onboarding/eligibility-gate.tsx`]
- [x] [Review][Patch] Include "another urgent warning sign" in red-flag option copy [`src/components/onboarding/eligibility-gate.tsx`]
- [x] [Review][Patch] Make the full radio option card clickable on mobile [`src/components/onboarding/eligibility-gate.tsx`]
- [x] [Review][Patch] Use assertive alert semantics for clinician-attention outcome [`src/components/onboarding/eligibility-gate.tsx`]
- [x] [Review][Patch] Add empty-submit validation coverage for required gate answers [`e2e/auth-shell.spec.ts`]

## Dev Notes

### Product and UX Intent

- Story 2.2 is the first real onboarding step. It screens fit and safety before the product asks for detailed recovery profile data or payment.
- The product promise is "safe educational companion for the critical 2 weeks after cast removal." The gate must protect that promise by refusing situations that need a clinician or are outside MVP scope.
- Onboarding UX is fixed as 3 steps: Eligibility Gate -> Recovery Profile -> Personalized Summary + Checkout CTA.
- Source: `epics.md` Epic 2 Story 2.2, FR2, UX-DR3/UX-DR4/UX-DR9, `UX设计规格说明.md` §6, and `技术架构详细设计.md` §7.2 / §7.5.

### Current Real Code Baseline

- Story 2.1 is complete and `stories/sprint-status.yaml` marks `2-1-magic-link-identity-session` as `done`.
- `src/app/(app)/onboarding/page.tsx` currently:
  - imports `getAuthSession` from `src/lib/auth/session.ts`
  - redirects unauthenticated users to `/sign-in?callbackUrl=%2Fonboarding`
  - renders a placeholder "Identity ready for onboarding" card
  - shows `session.user.email` and `session.user.hasPurchase`
- `src/lib/auth/session.ts` exposes `getAuthSession()` via NextAuth v4 `getServerSession(authOptions)`.
- `src/lib/auth/options.ts` uses `@next-auth/prisma-adapter`, Email Magic Link, and a development-only `dev-login` Credentials provider.
- `src/types/next-auth.d.ts` defines the minimal session fields: `id`, `email`, `hasPurchase`, and `activeProgramId`.
- `prisma/schema.prisma` currently contains only NextAuth-compatible auth tables: `User`, `Account`, `Session`, and `VerificationToken`.
- `package.json` already includes `react-hook-form`, `@hookform/resolvers`, and `zod`; use these for form validation instead of adding dependencies.
- `e2e/auth-shell.spec.ts` currently covers sign-in rendering, unauthenticated onboarding redirect, and dev login into `/onboarding`.

### Required Implementation Pattern

- Keep `/onboarding` protected for now because Story 2.1 deliberately established identity before onboarding. If later product work decides anonymous quiz start is needed, handle that as a separate story or correct-course change.
- Use a server page for session enforcement and a client component for the interactive form.
- Put domain classification in `src/lib/onboarding/eligibility.ts`, not inside the React component. The classifier should be easy to unit-test if unit testing is added later and easy to reuse when Story 2.3 introduces Recovery Profile flow control.
- Prefer explicit result copy over medical-sounding certainty:
  - eligible: "You look within the first version's scope."
  - not eligible: "This first version is not designed for your situation."
  - needs clinician attention: "This product cannot guide urgent or unusual symptoms."
- The clinician-attention path must not provide exercise guidance, recovery diagnosis, or reassurance that symptoms are normal.

### Suggested Eligibility Inputs

- `clinicianEvaluated`: `yes` / `no`
- `immobilizationStatus`: `removed_or_near_removal` / `still_immobilized` / `not_sure`
- `injuryArea`: `finger_or_metacarpal` / `other_body_part` / `not_sure`
- `hasRedFlags`: `yes` / `no`

Suggested classification order:

1. `hasRedFlags === "yes"` -> `needs_clinician_attention`
2. `clinicianEvaluated !== "yes"` -> `not_eligible`
3. `immobilizationStatus !== "removed_or_near_removal"` -> `not_eligible`
4. `injuryArea !== "finger_or_metacarpal"` -> `not_eligible`
5. otherwise -> `eligible`

These inputs are intentionally narrower than the future Recovery Profile fields. Story 2.3 owns subtype, dates, hardware, PT referral, pain level, dominant-hand impact, and work type.

### UI Copy Guardrails

- Required safety framing:
  - "Fracture Recovery Companion is educational support, not diagnosis or treatment."
  - "If you have severe pain, numbness, color change, fever, pus, rapidly worsening swelling, or symptoms that feel urgent, contact a clinician."
- Do not claim the product has medically cleared the user.
- Do not say "safe to exercise" or "you are safe." Use "within the first version's scope" instead.
- Not-eligible and clinician-attention results should offer:
  - link to `/`
  - link to `/legal/disclaimer`
- Eligible result should make it clear that Recovery Profile and checkout come next, but Story 2.2 does not implement those steps.

### Architecture Compliance

- Follow the current `src/` structure from `技术架构详细设计.md` §6:
  - page route: `src/app/(app)/onboarding/page.tsx`
  - component route: `src/components/onboarding/*`
  - domain helper: `src/lib/onboarding/*`
- Keep v1 English single-site. Do not add `next-intl` or `[locale]`.
- Keep the data layer unchanged in this story. `RecoveryProfile` is a future business model; do not create it here.
- Do not add environment variables. Story 2.2 has no new provider, billing, AI, or infrastructure integration.

### Previous Story Intelligence

- Story 2.1 proved that the current dev-only login can establish a local session and reach `/onboarding`; build new E2E coverage on that pattern.
- Story 2.1 intentionally kept `hasPurchase` and `activeProgramId` as session defaults without backing business tables. Do not attempt to make these real in Story 2.2.
- The current auth redirect target is `/sign-in?callbackUrl=%2Fonboarding`; keep this stable unless tests show a direct bug.
- Recent git commit titles are non-descriptive (`1`), so rely on story files and actual code rather than commit messages.
- Existing Playwright mobile coverage uses Chromium via Pixel 5. Do not switch mobile E2E back to a WebKit/iPhone preset.

### Scope Exclusions

- No Recovery Profile persistence or database schema changes.
- No purchase status, Stripe Checkout, checkout API, webhook, or unlock logic.
- No Program / ProgramDay / active program initialization.
- No AI, RAG, chat, safety keyword engine beyond the simple gate red-flag answer.
- No analytics event implementation yet, even though UX specs list future `quiz_*` events.
- No pricing page, subscription, refund processing, or billing support state.
- No anonymous onboarding refactor unless the user explicitly changes the Story 2.1 identity-first decision.

### Testing Requirements

- Minimum automated coverage:
  - unauthenticated `/onboarding` redirects to `/sign-in?callbackUrl=%2Fonboarding`
  - dev login reaches Step 1 eligibility gate
  - eligible answers produce an eligible continuation state
  - out-of-scope answers produce a not-eligible stop state
  - red-flag answers produce clinician-attention state
  - public Landing / Blog / Legal / FAQ / 404 routes remain green
- Required validation commands after implementation:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e`
- `pnpm db:generate` is not required unless the implementation unexpectedly touches Prisma. It should not touch Prisma for this story.

### Project Structure Notes

- Files expected to change or be created:
  - `src/app/(app)/onboarding/page.tsx`
  - `src/components/onboarding/eligibility-gate.tsx`
  - `src/lib/onboarding/eligibility.ts`
  - `e2e/auth-shell.spec.ts` or `e2e/onboarding-eligibility.spec.ts`
  - `stories/2-2-eligibility-safety-gate.md`
  - `stories/sprint-status.yaml`
  - `项目主档案.md`
- Files expected to remain unchanged unless a direct regression requires otherwise:
  - `prisma/schema.prisma`
  - `src/lib/auth/options.ts`
  - `src/lib/auth/session.ts`
  - `src/types/next-auth.d.ts`
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `.env.example`
  - `scripts/verify-env.ts`
  - `package.json`
  - `pnpm-lock.yaml`
  - `src/app/(marketing)/**`
  - `src/components/marketing/**`

### References

- `epics.md` Requirements Inventory FR2, FR3, FR4, FR12 and Epic 2 Story 2.2.
- `UX设计规格说明.md` §6 Page Spec: Onboarding, especially Step 1 Eligibility & Safety Gate and not-eligible state.
- `技术架构详细设计.md` §6 Code Structure, §7.2 Auth / Conversion Routes, §7.5 Onboarding, §8.2 RecoveryProfile, §9.1 Onboarding -> Checkout -> Program Provisioning, and §12 Auth and Session.
- `stories/2-1-magic-link-identity-session.md` Dev Agent Record and File List.
- `src/app/(app)/onboarding/page.tsx` current protected placeholder.
- `src/lib/auth/session.ts` current session helper.
- `src/lib/auth/options.ts` current NextAuth v4 configuration.
- `e2e/auth-shell.spec.ts` current auth E2E pattern.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Red phase: new Story 2.2 auth E2E checks initially failed before the eligibility gate existed; an initial run also exposed Playwright webServer instability from Next.js 16 Turbopack on Windows.
- Test stability fix: switched Playwright's local webServer command to `next dev --webpack`, reduced local workers to 4, and increased the test timeout to 60s.
- Hydration fix: disabled the gate submit button until client hydration so automated and real users cannot trigger native form submission before React attaches handlers.
- Final validation: `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/auth-shell.spec.ts` (12 passed), and full `pnpm test:e2e` (28 passed).

### Completion Notes List

- Replaced the protected `/onboarding` placeholder with Step 1 "Eligibility & Safety Gate" while preserving the existing `getAuthSession()` redirect to `/sign-in?callbackUrl=%2Fonboarding`.
- Added a pure typed eligibility classifier with explicit `eligible`, `not_eligible`, and `needs_clinician_attention` outcomes.
- Added the focused onboarding gate UI with MVP-scope questions, validation, eligible continuation copy, not-eligible stop state, clinician-attention warning state, landing/disclaimer links, and no database persistence.
- Extended auth E2E coverage for unauthenticated redirect, dev login gate access, eligible continuation, not-eligible stop, and red-flag clinician-attention outcomes across desktop and mobile.
- Closed code-review findings for stale outcome clearing, red-flag copy, full-card radio selection, assertive clinician-attention alert semantics, empty-submit validation coverage, and auth E2E stability.
- Did not add RecoveryProfile, Purchase, Program, Stripe, AI, RAG, analytics, i18n, or new dependencies.

### File List

- `src/app/(app)/onboarding/page.tsx`
- `src/components/onboarding/eligibility-gate.tsx`
- `src/lib/onboarding/eligibility.ts`
- `e2e/auth-shell.spec.ts`
- `playwright.config.ts`
- `stories/2-2-eligibility-safety-gate.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-04-27: Implemented Story 2.2 Eligibility and Safety Gate; moved story to `code-review`.
- 2026-04-27: Closed Story 2.2 review findings; focused `auth-shell` E2E passed; moved story to `done`.
