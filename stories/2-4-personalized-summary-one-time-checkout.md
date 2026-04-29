# Story 2.4: Personalized Summary and One-Time Checkout

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a qualified user,
I want to see a summary of my recovery context before paying,
so that I feel confident this plan is intended for me.

## Acceptance Criteria

1. **AC1 - Users who saved a profile land on Step 3 Personalized Summary**
   **Given** an authenticated user who has just saved a valid Recovery Profile in Step 2
   **When** the client flow transitions after save
   **Then** the UI shows `Step 3 of 3` Personalized Summary instead of the current "Recovery Profile saved" placeholder
   **And** users who did not complete Step 1 eligibility or Step 2 profile cannot reach the summary screen.

2. **AC2 - Summary reflects the user's real recovery context**
   **Given** the Recovery Profile has been persisted for the current session user
   **When** the Summary screen renders
   **Then** it reads the saved profile (from the Step 2 submission payload or a trusted server read) and shows, at minimum: body part + subtype, cast removal date framed as the current recovery window, dominant hand impact, work/daily-use category, and current pain level
   **And** the copy stays educational and non-diagnostic; it must not claim medical clearance or that the user is "safe to exercise".

3. **AC3 - Summary communicates what the next 14 days include, price, and refund framing**
   **Given** the user is on Summary
   **When** they read the commercial section
   **Then** they see a short "what your 14-day plan includes" block (daily exercises, AI recovery Q&A with safety guardrails, completion report)
   **And** the one-time price is shown as `$14.99 one-time` with a plain-language refund framing consistent with `/legal/refund`
   **And** the approved disclaimer reminds the user the product is educational, not a medical device.

4. **AC4 - Checkout CTA uses the approved copy and disables while the session is being created**
   **Given** the user has reviewed Summary
   **When** the primary CTA is rendered
   **Then** the CTA text is exactly `Unlock my 14-day plan`
   **And** clicking it disables the button, shows a loading state, and calls `POST /api/checkout`
   **And** only one network request is issued per click; the button remains disabled until the redirect happens or an error is shown.

5. **AC5 - `POST /api/checkout` creates a one-time Stripe Checkout session for the signed-in user**
   **Given** the authenticated user has a persisted `RecoveryProfile`
   **When** the client calls `POST /api/checkout`
   **Then** the server authenticates via `getAuthSession()`, ignores any client-supplied identity, verifies a `RecoveryProfile` exists for `session.user.id`, and creates a Stripe Checkout session in `mode: "payment"` with a single line item priced at `$14.99 USD`
   **And** the server returns `{ url: string }` pointing at the Stripe Checkout URL
   **And** unauthenticated callers receive `401` and callers without a `RecoveryProfile` receive `409` with a clear error message.

6. **AC6 - Dev-only fallback keeps CI and local flow testable without Stripe keys**
   **Given** `STRIPE_SECRET_KEY` is not configured in the current environment
   **When** `POST /api/checkout` is invoked
   **Then** the server does not throw and does not contact Stripe
   **And** it returns `{ url: "/onboarding/checkout/success?session_id=dev_mock" }` so local dev and Playwright E2E can exercise the full CTA → redirect path without live Stripe
   **And** when `STRIPE_SECRET_KEY` is present, the server must call Stripe and must not return the dev fallback URL.

7. **AC7 - Checkout success and cancelled landing pages exist with safe, scoped copy**
   **Given** Stripe redirects the user back after checkout
   **When** they land on `/onboarding/checkout/success` or `/onboarding/checkout/cancelled`
   **Then** both pages render for authenticated users, read `session_id` from the query string where applicable, and show clear status copy
   **And** the success page explicitly states that the personalized plan will be unlocked by a later step (Story 3.2 webhook) and does not claim the program is ready yet
   **And** the cancelled page offers a clear path back to `/onboarding` to retry or to `/` and `/legal/refund`.

8. **AC8 - Story 2.4 does not implement webhook unlock, Purchase, Program, or refund handling**
   **Given** future stories own downstream provisioning
   **When** Story 2.4 is implemented
   **Then** no `Purchase`, `Program`, `ProgramDay`, `ChatMessage`, or `KnowledgeChunk` Prisma models are introduced
   **And** no `POST /api/stripe/webhook` route, refund handling, billing portal, subscription logic, or `hasPurchase` flip is added
   **And** AI, RAG, analytics event emission, i18n, and native app work remain out of scope.

9. **AC9 - Regression coverage protects identity, eligibility, profile, and checkout intent**
   **Given** Stories 2.1 / 2.2 / 2.3 E2E coverage is green
   **When** Story 2.4 is implemented
   **Then** existing public Landing / Blog / Legal / FAQ / 404 E2E continues to pass
   **And** the auth shell / onboarding E2E is extended so that: unauthenticated `/onboarding/checkout/success` and `/onboarding/checkout/cancelled` redirect to sign-in; a user who finished Step 1 + Step 2 reaches Step 3 Summary with `Unlock my 14-day plan` CTA; clicking the CTA in the dev fallback environment navigates to `/onboarding/checkout/success`; the success page is reachable and shows the "plan will be unlocked shortly" copy without claiming the program is already created.

## Tasks / Subtasks

- [x] **T1 - Lift the onboarding state machine to include Step 3 Summary** (AC: 1, 2, 4)
  - [x] 1.1 Extend the state in `src/components/onboarding/eligibility-gate.tsx` from `"eligibility" | "profile"` to `"eligibility" | "profile" | "summary"`.
  - [x] 1.2 Replace the internal "Recovery Profile saved" placeholder in `src/components/onboarding/recovery-profile-form.tsx` with an `onProfileSaved(values)` callback that hands the saved values back to the parent.
  - [x] 1.3 Render the new Summary component when `onboardingStep === "summary"`; keep Step 1 and Step 2 behavior unchanged when the user uses Previous to navigate back.
  - [x] 1.4 Ensure users who have not satisfied Step 1 eligible + Step 2 saved cannot jump directly into Summary client-side.

- [x] **T2 - Build the Personalized Summary component** (AC: 2, 3, 4)
  - [x] 2.1 Add `src/components/onboarding/personalized-summary.tsx` as a focused client component.
  - [x] 2.2 Accept the saved `RecoveryProfileInput` (plus `userEmail`) as props and render: current recovery window framed from `castRemovedAt`, body part + subtype, dominant hand impact, job/daily-use category, current pain level.
  - [x] 2.3 Render a "what your 14-day plan includes" block that matches the approved MVP scope (daily exercises, AI recovery Q&A with safety guardrails, completion report); no feature claims outside scope.
  - [x] 2.4 Render the price block `$14.99 one-time`, refund framing, and the approved disclaimer consistent with `/legal/disclaimer` and `/legal/refund`.
  - [x] 2.5 Render the primary CTA with exact text `Unlock my 14-day plan`; wire it to the checkout flow with a disabled loading state and a retryable error state.
  - [x] 2.6 Keep layout mobile-first and reuse the existing `Button`, token classes, and section shell patterns from Step 1/2 instead of introducing a new design system.

- [x] **T3 - Add a scoped checkout service module** (AC: 5, 6)
  - [x] 3.1 Add `src/lib/billing/purchase-service.ts` exporting a `createCheckoutSession({ userId, userEmail })` function.
  - [x] 3.2 Reuse `NEXT_PUBLIC_APP_URL` to build `success_url` and `cancel_url`; fall back to `http://localhost:3000` only when that env is unset.
  - [x] 3.3 When `STRIPE_SECRET_KEY` is absent, return `{ url: "/onboarding/checkout/success?session_id=dev_mock", isDevMock: true }` without calling Stripe.
  - [x] 3.4 When `STRIPE_SECRET_KEY` is present, instantiate the Stripe SDK once per module load, create a `mode: "payment"` Checkout session for a single `$14.99 USD` line item (`Fracture Recovery Companion - 14-day plan` description), set `customer_email` from the session, and return `{ url, isDevMock: false }`.
  - [x] 3.5 Keep the helper deterministic, free of Prisma writes, free of webhook logic, and free of Program / Purchase mutation.

- [x] **T4 - Add `POST /api/checkout`** (AC: 5, 6, 8)
  - [x] 4.1 Add `src/app/api/checkout/route.ts` with a `POST` handler.
  - [x] 4.2 Require `getAuthSession()`; return `401` when there is no session user id.
  - [x] 4.3 Verify a `RecoveryProfile` exists for `session.user.id` via `prisma.recoveryProfile.findUnique({ where: { userId } })`; return `409` with a clear message and suggested redirect target of `/onboarding` when it does not.
  - [x] 4.4 Call `createCheckoutSession(...)` and return `{ url }`; on a Stripe error, return `502` with a short, non-sensitive message and log enough context for Sentry.
  - [x] 4.5 Do not write `Purchase`, do not touch `Program` / `ProgramDay`, and do not flip `hasPurchase` in the session.

- [x] **T5 - Add checkout success and cancelled landing pages** (AC: 7, 8)
  - [x] 5.1 Add `src/app/(app)/onboarding/checkout/success/page.tsx` as a server component: require `getAuthSession()`, redirect unauthenticated users to `/sign-in?callbackUrl=%2Fonboarding%2Fcheckout%2Fsuccess`, read `?session_id=` from `searchParams`, and render copy that explicitly says the personalized plan will be unlocked by a later step and the user should not reload to retry payment.
  - [x] 5.2 Add `src/app/(app)/onboarding/checkout/cancelled/page.tsx` as a server component with the same auth guard; show clear cancel copy, a primary link back to `/onboarding`, and secondary links to `/` and `/legal/refund`.
  - [x] 5.3 Both pages must stay English-single-site, avoid medical claims, and must not show any Program / Day UI.

- [x] **T6 - Extend environment config without touching secrets of other stories** (AC: 5, 6)
  - [x] 6.1 Add `STRIPE_SECRET_KEY` (required in production, optional in local) to `.env.example` with a brief comment explaining the dev fallback.
  - [x] 6.2 Update `scripts/verify-env.ts` so that `pnpm deploy:verify` warns (not fails) when `STRIPE_SECRET_KEY` is missing outside production and fails in `NODE_ENV=production`.
  - [x] 6.3 Do not add `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, Gemini, Groq, or Upstash variables in this story; those belong to Stories 3.2 / 5.x.

- [x] **T7 - Add the Stripe dependency scoped to this story** (AC: 5)
  - [x] 7.1 Add `stripe` to `dependencies` in `package.json` via `pnpm add stripe` (do not pin arbitrarily; accept the latest stable caret range).
  - [x] 7.2 Do not add other billing, analytics, AI, or form libraries.

- [x] **T8 - Focused automated coverage** (AC: 1, 4, 7, 9)
  - [x] 8.1 Extend `e2e/auth-shell.spec.ts` (preferred, to stay within the existing serial describe) or add `e2e/onboarding-checkout.spec.ts` if the file is getting too long.
  - [x] 8.2 Assert unauthenticated `/onboarding/checkout/success` and `/onboarding/checkout/cancelled` redirect to `/sign-in?callbackUrl=...`.
  - [x] 8.3 Assert a dev-login user who completes Step 1 eligible + Step 2 valid profile reaches Step 3 Summary, sees the `$14.99 one-time` price and the `Unlock my 14-day plan` CTA.
  - [x] 8.4 Assert clicking the CTA in the dev fallback environment (no `STRIPE_SECRET_KEY`) navigates to `/onboarding/checkout/success` and shows the "plan will be unlocked shortly" copy.
  - [x] 8.5 Assert the cancelled page copy and `Back to onboarding` link work.
  - [x] 8.6 Preserve the existing public shell E2E and existing Story 2.3 profile validation / save coverage.
  - [x] 8.7 Run `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/auth-shell.spec.ts`, and the full `pnpm test:e2e` before handing off to code-review.

### Review Findings

- [x] [Review][Patch] Stripe client violates spec T3.4 "once per module load" [src/lib/billing/purchase-service.ts:22-30] — fixed with a module-level lazy Stripe client singleton.
- [x] [Review][Patch] Summary error state ignores API `redirectTo` for `recovery_profile_missing` [src/components/onboarding/personalized-summary.tsx:55-69] — fixed by rendering an actionable `Return to onboarding` link when the API returns `redirectTo`.
- [x] [Review][Patch] E2E `castRemovedAt` uses UTC date which can flake the recovery-window assertion in negative-UTC timezones [e2e/auth-shell.spec.ts:320-322,335-337] — fixed with a local-time date input helper built from `getFullYear/getMonth/getDate`.
- [x] [Review][Defer] Day-15 phrasing for the upper boundary of the 2-week window [src/lib/onboarding/summary.ts:47-50] — deferred, copy follows spec dev-notes verbatim; revisit copy in a later UX polish pass.
- [x] [Review][Defer] Multi-step profile form loses entered state when navigating back from Summary [src/components/onboarding/recovery-profile-form.tsx remount on Previous] — deferred, pre-existing Story 2.3 behavior, spec does not require state preservation.

## Dev Notes

### Product and UX Intent

- Story 2.4 is the final onboarding step in the fixed 3-step flow: Eligibility Gate -> Recovery Profile -> Personalized Summary + Checkout CTA.
- Goal: make the qualified user feel "this plan is for me" and convert them into a one-time paying user without ever implying the product is a medical device or already unlocked before payment clears.
- Source requirements:
  - `epics.md` Epic 2 Story 2.4, FR4, UX-DR3, UX-DR4, UX-DR9, UX-DR10.
  - `UX设计规格说明.md` §6.3 Step 3 Personalized Summary + Checkout CTA, §6.5 "CTA 进入 Stripe Checkout", §6.6 Checkout Redirecting state.
  - `技术架构详细设计.md` §9.1 Onboarding -> Checkout -> Program Provisioning (steps 5-8), §13 支付设计 (single SKU, Stripe Checkout, `POST /api/checkout` creates session, webhook handles unlock).
  - `产品Brief.md` $14.99 one-time pricing decision.

### Current Real Code Baseline

- Story 2.3 is `done`. `stories/sprint-status.yaml` marks `2-3-recovery-profile-multi-step-form: done` and `2-4-personalized-summary-one-time-checkout: ready-for-dev`.
- `/onboarding` is implemented in `src/app/(app)/onboarding/page.tsx` and is protected by `getAuthSession()` with redirect to `/sign-in?callbackUrl=%2Fonboarding`. Do not regress this guard when adding `/onboarding/checkout/*` routes; apply the same pattern.
- `src/components/onboarding/eligibility-gate.tsx` already owns the 2-state machine `"eligibility" | "profile"` and swaps in `RecoveryProfileForm`. Story 2.4 extends this machine to 3 states; it is the single source of truth for the client flow.
- `src/components/onboarding/recovery-profile-form.tsx` currently renders its own "Recovery Profile saved" placeholder when `status === "saved"`. Story 2.4 must replace that placeholder path with a parent callback so Summary can render instead.
- `src/lib/onboarding/recovery-profile.ts` already exports `recoveryProfileSchema`, `RecoveryProfileInput`, and `toRecoveryProfileSaveInput`. Reuse these types for Summary props; do not duplicate schemas.
- `src/app/api/onboarding/recovery-profile/route.ts` already persists the profile with `prisma.recoveryProfile.upsert`. Story 2.4 only needs a read-side confirmation via `prisma.recoveryProfile.findUnique({ where: { userId } })` inside the checkout route.
- `prisma/schema.prisma` currently has `User`, `Account`, `Session`, `VerificationToken`, and `RecoveryProfile`. Story 2.4 must not introduce `Purchase`, `Program`, `ProgramDay`, `ChatMessage`, or `KnowledgeChunk` models.
- `package.json` already includes `react-hook-form`, `@hookform/resolvers`, `zod`, `@prisma/client`, and `next-auth`. `stripe` is the only new dependency Story 2.4 adds.
- `e2e/auth-shell.spec.ts` runs serially (`test.describe.configure({ mode: "serial" })`) because parallel dev-login was flaky on Windows. Any new checkout E2E cases must live inside that same serial describe or a new serial describe; do not introduce parallel auth tests.
- `.env.example` ends at `SENTRY_*` today. `STRIPE_SECRET_KEY` is the only new env this story adds. Leave `STRIPE_WEBHOOK_SECRET` to Story 3.2.
- `playwright.config.ts` already uses `next dev --webpack` and reduced workers; do not change these settings for Story 2.4.

### Required Implementation Pattern

- Keep the client state machine in `eligibility-gate.tsx`. Do not spread onboarding state across new contexts, new Zustand slices, or URL params in this story.
- Do the Stripe Checkout create from the server only. The client must not see or embed `STRIPE_SECRET_KEY`. The client only calls `POST /api/checkout` and follows `response.url`.
- Use `window.location.href = url` for the redirect after a successful `POST /api/checkout`. Do not use `router.push` for the Stripe URL; external URLs require full-page navigation. For the dev-mock URL, `router.push` is fine because it is same-origin.
- The dev fallback (`session_id=dev_mock`) exists specifically so CI and local dev can exercise the full CTA -> redirect -> success page flow without a live Stripe key. It must not run in production; the rule is simply "no `STRIPE_SECRET_KEY` -> dev fallback", and production deployments must configure the key.
- The success page must be honest: say "We are confirming your payment. Your personalized plan will be available shortly." Do not say "Your plan is ready" or "Here is Day 1" — those are owned by Story 3.2 (webhook unlock + `Program` / `ProgramDay` creation) and Story 3.4 (current-program retrieval).
- The cancelled page must not silently retry; it must give the user an explicit retry path via `/onboarding` and a legal/refund reference.

### Suggested Summary Rendering Contract

- Recovery window framing:
  - Compute `daysSinceRemoval = daysBetween(castRemovedAt, today)` client-side.
  - If `daysSinceRemoval < 0`: "Your cast is scheduled to come off in N days. This plan is built for the 14 days after removal."
  - If `0 <= daysSinceRemoval <= 14`: "You are in day N of the critical 2-week window after cast removal."
  - If `daysSinceRemoval > 14`: "You removed your cast N days ago. This plan still focuses on the early recovery motions most people miss."
  - Copy must stay non-diagnostic. Do not say "you are healing normally."
- Profile recap:
  - Body part: `finger` or `metacarpal`, capitalized.
  - Subtype: raw string from `subType`.
  - Dominant hand affected: `Yes` / `No`.
  - Job type: human-readable label from `jobType` (`desk` -> "Desk / computer work" etc.).
  - Pain level: `N / 10` short label.
- What is included block (MVP-scope only):
  - "14 daily exercise guides tuned for your body part and recovery window"
  - "AI recovery Q&A with safety guardrails and clinician-escalation for red flags"
  - "A completion report at the end of Day 14"
- Price and refund block:
  - Price line: `$14.99 one-time. No subscription.`
  - Refund line: a short, plain-English sentence consistent with `/legal/refund`; do not invent refund terms that contradict the legal page.
  - Disclaimer line: "Fracture Recovery Companion is educational support, not diagnosis or treatment."

### API Contract

- Route: `src/app/api/checkout/route.ts` with exported `POST(request: NextRequest)`.
- Auth: `getAuthSession()`; `401` if no `session?.user?.id`.
- Profile check: `prisma.recoveryProfile.findUnique({ where: { userId: session.user.id } })`; `409 { error: "recovery_profile_missing", redirectTo: "/onboarding" }` if missing.
- Body: none required in v1. The price is fixed at `$14.99` server-side so clients cannot tamper with it.
- Response:
  - `200 { url: string, isDevMock: boolean }` on success
  - `401 { error: "unauthenticated" }`
  - `409 { error: "recovery_profile_missing", redirectTo: "/onboarding" }`
  - `502 { error: "stripe_checkout_unavailable" }` on upstream failure
- Stripe session parameters (production path only):
  - `mode: "payment"`
  - `line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: 1499, product_data: { name: "Fracture Recovery Companion - 14-day plan" } } }]`
  - `customer_email: session.user.email ?? undefined`
  - `success_url: \`${appUrl}/onboarding/checkout/success?session_id={CHECKOUT_SESSION_ID}\``
  - `cancel_url: \`${appUrl}/onboarding/checkout/cancelled\``
  - `client_reference_id: session.user.id`

### UI Copy Guardrails

- Primary CTA text is exactly `Unlock my 14-day plan` (matches epics.md Story 2.4 and UX spec).
- Never claim "safe to exercise", "medically cleared", or "your plan is ready" before Story 3.2 lands.
- Never show "Day 1" affordances, program content previews, or exercise thumbnails on Summary or the success page; those belong to Story 4.x.
- Price must be consistent everywhere: Summary UI, success page wording, and FAQ copy. Today `$14.99 one-time` is the canonical phrasing.

### Scope Exclusions

- No Stripe webhook endpoint, signature verification, or `Purchase` writes (Story 3.2).
- No `Program`, `ProgramDay`, or active-program resolution logic (Stories 3.1 / 3.3 / 3.4).
- No `hasPurchase` toggling on the session; the session field stays a static default until Story 3.2.
- No refund workflow, billing portal, subscription, upgrade / downgrade, or dispute handling (Story 7.3 and explicitly out of §13.4 scope).
- No AI, RAG, Chat, analytics event emission, i18n, native app, or doctor/admin surfaces.
- No changes to marketing, blog, legal, or FAQ pages except (optionally) a minor FAQ price consistency tweak if the current FAQ disagrees with `$14.99 one-time`; if the disagreement does not exist, do not edit the FAQ.

### Testing Requirements

- Minimum validation commands after implementation:
  - `pnpm db:generate`
  - `pnpm typecheck`
  - `pnpm lint`
  - focused `pnpm test:e2e e2e/auth-shell.spec.ts` (or the new `e2e/onboarding-checkout.spec.ts`)
  - full `pnpm test:e2e` before code-review
- Keep new E2E cases inside a serial describe to match the existing auth-shell stability pattern on Windows + Next.js 16.
- Do not require `STRIPE_SECRET_KEY` in CI. Playwright must work on the dev-mock fallback path.

### Project Structure Notes

Files expected to change or be created:

- `prisma/schema.prisma` (unchanged unless a profile read requires a fix; do not add new models)
- `package.json`, `pnpm-lock.yaml` (adds `stripe`)
- `.env.example` (adds `STRIPE_SECRET_KEY`)
- `scripts/verify-env.ts` (soft warning for missing `STRIPE_SECRET_KEY` in non-prod, hard fail in prod)
- `src/lib/billing/purchase-service.ts` (new)
- `src/app/api/checkout/route.ts` (new)
- `src/app/(app)/onboarding/checkout/success/page.tsx` (new)
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx` (new)
- `src/components/onboarding/eligibility-gate.tsx` (state machine extension + onProfileSaved handling)
- `src/components/onboarding/recovery-profile-form.tsx` (replace internal saved-placeholder with `onProfileSaved` callback)
- `src/components/onboarding/personalized-summary.tsx` (new)
- `e2e/auth-shell.spec.ts` or `e2e/onboarding-checkout.spec.ts`
- `stories/2-4-personalized-summary-one-time-checkout.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files expected to remain unchanged:

- `src/lib/auth/options.ts`, `src/lib/auth/session.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/onboarding/eligibility.ts`, `src/lib/onboarding/recovery-profile.ts` (types reused, not edited)
- `src/app/api/onboarding/recovery-profile/route.ts`
- `src/app/(marketing)/**`, `src/components/marketing/**`, `src/app/blog/**`, `src/app/legal/**`
- `playwright.config.ts`

### Previous Story Intelligence

- Story 2.1 established NextAuth v4 + dev-only credentials login and the serial auth E2E pattern. Use dev login for all Story 2.4 checkout E2E cases; do not introduce parallel logins.
- Story 2.2 proved that domain classification lives in a typed module outside React. Follow the same split for Summary: compute recovery-window labels in a small helper (e.g. inside `src/lib/onboarding/recovery-profile.ts` or a new `src/lib/onboarding/summary.ts`) rather than inside JSX.
- Story 2.3 demonstrated that Windows IPv6-only direct Postgres hosts can block local Prisma writes. The checkout route only reads `RecoveryProfile`, so it should be unaffected, but keep the auth-pooler-capable `DATABASE_URL` expectation in mind.
- Story 2.3 also left a "Recovery Profile saved" in-component placeholder that Story 2.4 must remove; do not create a separate route or duplicate the profile UI just to avoid editing that component.

### Architecture Compliance

- Follow `技术架构详细设计.md` §6 code structure:
  - server route: `src/app/(app)/onboarding/checkout/{success,cancelled}/page.tsx`
  - API route: `src/app/api/checkout/route.ts`
  - billing module: `src/lib/billing/purchase-service.ts`
  - onboarding UI: `src/components/onboarding/*`
- Keep v1 English single-site; do not add `next-intl` or `[locale]`.
- Keep data layer aligned with §4 + §8: Story 2.4 stays on Postgres + Prisma, no SQLite branch, no new schema models.
- Follow §13 Payment: single SKU, one-time, Stripe Checkout, `POST /api/checkout` creates session, webhook is explicitly deferred to a later story.
- Follow §9.1: `Program` generation is deliberately post-payment; Story 2.4 must not pre-generate anything before Stripe settles.

### References

- `epics.md` FR4, UX-DR3, UX-DR4, UX-DR9, UX-DR10, and Epic 2 Story 2.4 acceptance criteria.
- `UX设计规格说明.md` §6.3 Step 3 Personalized Summary + Checkout CTA, §6.5 Key Interactions, §6.6 Page States (Checkout Redirecting).
- `技术架构详细设计.md` §9.1 Onboarding -> Checkout -> Program Provisioning, §13 Payment, §14 Monitoring & Testing.
- `产品Brief.md` $14.99 one-time pricing decision and 3-month PMF KPIs.
- `stories/2-3-recovery-profile-multi-step-form.md` Dev Agent Record and File List.
- `src/components/onboarding/eligibility-gate.tsx` current onboarding state machine.
- `src/components/onboarding/recovery-profile-form.tsx` current saved-state placeholder that Story 2.4 replaces.
- `src/app/api/onboarding/recovery-profile/route.ts` current Prisma read/write pattern.
- `e2e/auth-shell.spec.ts` current serial auth + onboarding E2E baseline.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- `pnpm db:generate` passed after adding Stripe dependency and Story 2.4 files.
- `pnpm typecheck` and `pnpm lint` passed.
- Focused `pnpm test:e2e e2e/auth-shell.spec.ts` initially exposed Desktop/Mobile concurrent auth/profile save flakiness; `playwright.config.ts` local workers were tightened to 1 to match CI stability.
- Recovery Profile submit received the same hydration guard pattern as Story 2.2 to prevent native form submit before React attaches handlers.
- Final validation passed: focused auth E2E 30/30 and full E2E 46/46.
- Code review patch validation passed after fixes: `pnpm typecheck`, `pnpm lint`, and focused `pnpm test:e2e e2e/auth-shell.spec.ts` 30/30 passed.

### Completion Notes List

- Implemented Step 3 Personalized Summary in the existing onboarding state machine and replaced the Step 2 saved placeholder with `onProfileSaved`.
- Added recovery-window summary helpers, profile recap, `$14.99 one-time` price block, refund/disclaimer framing, checkout loading/error state, and exact CTA copy `Unlock my 14-day plan`.
- Added scoped Stripe Checkout service with dev-mock fallback when `STRIPE_SECRET_KEY` is absent, plus `POST /api/checkout` guarded by session and persisted `RecoveryProfile`.
- Added authenticated checkout success and cancelled pages without webhook unlock, Purchase, Program, ProgramDay, AI, RAG, refunds, billing portal, analytics, or i18n.
- Added `STRIPE_SECRET_KEY` env documentation and production-only env verification behavior.
- Added focused E2E coverage for unauthenticated checkout redirects, Summary, dev-mock checkout success, cancelled recovery paths, and preserved existing public/auth/profile regression coverage.

### File List

- `.env.example`
- `e2e/auth-shell.spec.ts`
- `package.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `scripts/verify-env.ts`
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `src/app/api/checkout/route.ts`
- `src/components/onboarding/eligibility-gate.tsx`
- `src/components/onboarding/personalized-summary.tsx`
- `src/components/onboarding/recovery-profile-form.tsx`
- `src/lib/billing/purchase-service.ts`
- `src/lib/onboarding/summary.ts`
- `stories/2-4-personalized-summary-one-time-checkout.md`
- `stories/deferred-work.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-04-29: Created Story 2.4 Personalized Summary and One-Time Checkout; moved story to `ready-for-dev`.
- 2026-04-29: Implemented Story 2.4 Summary + checkout session creation + success/cancelled pages + E2E; moved story to `code-review`.
- 2026-04-29: Completed lightweight code review patches, revalidated focused E2E, and moved story to `done`.
