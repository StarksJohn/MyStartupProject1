# Story 7.3: Payment Failure, Refund, and Support Recovery Paths

Status: code-review

<!-- Created by bmad-create-story after Story 7.2 monitoring/error observability was implemented, lightly reviewed, and marked done. -->

## Story

As the product operator,
I want failed payments, refunds, and support-sensitive billing states handled explicitly,
so that users are not left in ambiguous account states.

## Acceptance Criteria

1. **AC1 - Billing access states are centralized and unambiguous**
   **Given** the app already stores `Purchase.status` as `PENDING | PAID | FAILED | REFUNDED` and gates access through active paid programs
   **When** the app resolves a user's purchase/program state for checkout success, progress, Day, Chat, and session callbacks
   **Then** it distinguishes at least: `ready`, `payment_pending`, `payment_failed`, `purchase_refunded`, `missing_profile`, `missing_program_recovered`, `missing_day_content`, and `no_purchase`
   **And** only a `PAID` purchase with an `ACTIVE` or `COMPLETED` program grants product access.

2. **AC2 - Checkout creation records a recoverable pending state**
   **Given** an authenticated eligible user with a saved `RecoveryProfile` starts Stripe Checkout
   **When** `POST /api/checkout` creates a real Stripe Checkout Session
   **Then** the app records or updates a `PENDING` `Purchase` for that checkout session without creating a program
   **And** it stores only safe operational identifiers and amounts; it must not store raw Checkout URLs, Stripe secrets, request headers, or user medical profile fields.

3. **AC3 - Stripe failure and refund webhooks update state safely**
   **Given** Stripe sends payment failure, async checkout failure, checkout expiration, or refund events for a known checkout/payment intent
   **When** the webhook is processed
   **Then** matched pending/non-unlocked purchases are marked `FAILED`, matched refunded purchases are marked `REFUNDED` with `refundedAt`, and refunded programs no longer grant access
   **And** the webhook remains idempotent, preserves existing successful unlock behavior, and does not accidentally downgrade a valid paid active program from an unrelated or stale failure event.

4. **AC4 - Refunded access is blocked with a clear recovery path**
   **Given** a user has a purchase that was refunded after a program was created
   **When** they open `/progress`, `/day/[day]`, `/chat`, `/api/program/current`, or session-dependent access paths
   **Then** the app blocks paid access and explains that the purchase was refunded or access was revoked
   **And** it provides safe next actions such as returning to onboarding, reading the refund policy, or contacting support without exposing internal payment IDs.

5. **AC5 - Payment failed or pending states avoid partial unlocks**
   **Given** a checkout is still pending, expired, failed, or not yet matched to a completed webhook
   **When** the user returns to checkout success/cancelled, opens progress, or refreshes a protected product route
   **Then** the UI does not claim Day 1 is ready unless a paid active program exists
   **And** the UI clearly offers retry/payment recovery instructions rather than silently redirecting the user into onboarding with no explanation.

6. **AC6 - Support and refund copy is concrete but not over-promising**
   **Given** the current refund page is placeholder-level and several product states say "contact support" without a concrete path
   **When** Story 7.3 is implemented
   **Then** refund/support instructions are consistent across Landing FAQ, checkout cancelled/success, billing fallback states, and `/legal/refund`
   **And** copy stays non-diagnostic, does not promise medical outcomes, and does not introduce automated refunds, billing portal, subscriptions, or admin tooling.

7. **AC7 - Analytics and observability remain privacy-safe**
   **Given** Stories 7.1 and 7.2 already added analytics and Sentry helpers
   **When** billing failure/refund states are handled
   **Then** any emitted analytics or monitoring uses existing helpers and low-cardinality values such as `status`, `surface`, or `operation`
   **And** it must not include email, user ID, purchase ID, checkout session ID, payment intent ID, Stripe customer ID, profile fields, raw URLs, report content, chat content, or Stripe payloads.

8. **AC8 - Focused regression covers billing recovery behavior**
   **Given** this story changes purchase state transitions and access fallback UX
   **When** implementation is complete
   **Then** focused tests cover checkout pending creation, failed/refunded webhook state changes, refunded access denial, checkout success pending/failed/refunded/ready copy, progress fallback copy, and session `hasPurchase` behavior
   **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add a shared billing/access state resolver** (AC: 1, 4, 5, 7, 8)
  - [x] 1.1 Add or refactor a small server-side resolver in `src/lib/billing/` or `src/lib/program/current-program-service.ts` that returns explicit billing states instead of collapsing all non-paid states into `no_purchase`.
  - [x] 1.2 Keep the existing `CurrentProgramState` ready/missing content behavior, but add billing-specific states for `payment_pending`, `payment_failed`, and `purchase_refunded`.
  - [x] 1.3 Ensure `getActiveProgramForUser()` continues to return a program only for `PurchaseStatus.PAID` and `ProgramStatus.ACTIVE` / `ProgramStatus.COMPLETED`.
  - [x] 1.4 If a refunded purchase has an associated program, treat access as revoked even if the program row still exists.
  - [x] 1.5 Do not send internal IDs to client JSON unless already owned by the current user and needed for a support-safe reference; prefer generic copy.

- [x] **T2 - Persist recoverable checkout pending records** (AC: 2, 5, 7, 8)
  - [x] 2.1 In `src/app/api/checkout/route.ts`, keep the current auth and `RecoveryProfile` guard before creating checkout.
  - [x] 2.2 After `createCheckoutSession()` returns a real Stripe session, create/upsert a `Purchase` with `status: PENDING`, `stripeCheckoutSessionId`, amount, currency, and safe Stripe IDs when available.
  - [x] 2.3 Keep `dev_mock` behavior deterministic and local-only; do not create a pending real-Stripe purchase for dev mock.
  - [x] 2.4 If the user already has an active paid program, do not create another checkout session; return a safe "already unlocked" response or redirect target to `/progress`.
  - [x] 2.5 Do not persist raw `session.url`, full Stripe payloads, headers, cookies, or profile fields.

- [x] **T3 - Harden Stripe webhook failure/refund transitions** (AC: 3, 4, 7, 8)
  - [x] 3.1 Keep existing `checkout.session.completed` handling and idempotency table behavior intact.
  - [x] 3.2 For `payment_intent.payment_failed`, update only matched pending/non-unlocked purchases to `FAILED`; do not revoke a paid active program from a stale or unrelated failure event.
  - [x] 3.3 Add support for `checkout.session.async_payment_failed` and `checkout.session.expired` where they can be matched by `stripeCheckoutSessionId`, mapping them to `FAILED` for this MVP.
  - [x] 3.4 For `charge.refunded`, mark the matched purchase `REFUNDED`, set `refundedAt`, and revoke access by excluding it from paid-access queries; if needed, set the associated program to `EXPIRED` without deleting user progress.
  - [x] 3.5 Treat any Stripe refund as full access revocation for MVP because the schema has no partial-refund entitlement model; do not add partial refund support unless the schema is deliberately expanded.
  - [x] 3.6 Preserve Story 7.2 capture behavior and add only low-noise observability for state transitions or unmatched events.

- [x] **T4 - Update checkout success/cancelled billing recovery UI** (AC: 4, 5, 6, 7, 8)
  - [x] 4.1 In `src/app/(app)/onboarding/checkout/success/page.tsx`, render distinct copy for ready, pending/confirming, failed, refunded, unknown/foreign session, and missing profile/program states.
  - [x] 4.2 Only show "Your 14-day plan is ready" and emit `paid` when a paid active program exists.
  - [x] 4.3 Replace the full checkout session display with either no identifier or a support-safe truncated reference; never show payment intent IDs or raw Stripe URLs.
  - [x] 4.4 In `src/app/(app)/onboarding/checkout/cancelled/page.tsx`, keep the existing "No payment was completed" path but add retry/support/refund-policy copy that matches the new billing states.
  - [x] 4.5 Keep unauthenticated redirects unchanged.

- [x] **T5 - Update protected route fallbacks and API contracts** (AC: 1, 4, 5, 7, 8)
  - [x] 5.1 In `/progress`, show billing-specific fallback cards for pending, failed, and refunded purchases instead of the generic no-purchase message.
  - [x] 5.2 In `/day/[day]`, `/chat`, and other product routes that depend on current program state, redirect billing-blocked states to `/progress` or a support-safe fallback instead of `/onboarding` when the user has a known failed/refunded/pending purchase.
  - [x] 5.3 In `src/app/api/program/current/route.ts`, return explicit safe statuses and redirect targets for billing-blocked states.
  - [x] 5.4 Preserve missing content behavior from Stories 4.4 and 7.2; do not show partial recovery guidance.
  - [x] 5.5 Keep session shape unchanged: `id`, `email`, `hasPurchase`, `activeProgramId`.

- [x] **T6 - Finalize refund/support copy surface** (AC: 6, 7)
  - [x] 6.1 Update `src/app/(marketing)/legal/refund/page.tsx` from placeholder to a lightweight MVP policy page.
  - [x] 6.2 If a concrete support email/config is introduced, keep it centralized and update `.env.example` / `scripts/verify-env.ts` only if this story makes it production-required.
  - [x] 6.3 Update `src/components/marketing/landing-faq.tsx` only if its current refund/support copy conflicts with the new policy.
  - [x] 6.4 Avoid formal legal guarantees beyond the approved MVP stance: one-time payment, refund/support expectations, educational support only, no medical outcome promise.

- [x] **T7 - Add focused regression coverage** (AC: 2, 3, 4, 5, 8)
  - [x] 7.1 Extend `e2e/stripe-webhook.spec.ts` for pending purchase creation, `async_payment_failed` / expired session if implemented, non-downgrade of paid active access, and refund access revocation.
  - [x] 7.2 Extend `e2e/auth-shell.spec.ts` or add a focused billing recovery spec for checkout success/cancelled UI states.
  - [x] 7.3 Extend `e2e/program-entry.spec.ts` for `/progress` and `/api/program/current` billing-blocked states.
  - [x] 7.4 Assert event/response payloads do not expose forbidden payment/account/medical fields.
  - [x] 7.5 Run `pnpm typecheck`.
  - [x] 7.6 Run `pnpm lint`.
  - [x] 7.7 Run focused E2E for billing recovery and webhook behavior with Desktop Chrome only unless mobile coverage is explicitly low-cost.

## Dev Notes

### Product Intent

- Epic 7 is the operator-readiness epic. Story 7.3 should answer: "If payment or refund state is not happy-path, does the user know what happened and can the operator/support path reason about it?"
- Story 7.1 owns product analytics vocabulary. Do not add new analytics events unless a tiny property on an existing event is enough.
- Story 7.2 owns monitoring helpers and caught error capture. Reuse its helper; do not add another monitoring abstraction.
- Story 7.4 owns broad launch QA and regression runbooks. Keep this story focused on billing/refund/support states and focused tests.

### Current Code Baseline

- `prisma/schema.prisma` already has `PurchaseStatus` values `PENDING`, `PAID`, `FAILED`, and `REFUNDED`; `ProgramStatus` has `ACTIVE`, `COMPLETED`, and `EXPIRED`.
- `src/lib/billing/purchase-service.ts` creates Stripe Checkout Sessions in `mode: "payment"` and returns a dev-mock success URL when `STRIPE_SECRET_KEY` is absent.
- `src/app/api/checkout/route.ts` currently checks auth and `RecoveryProfile`, then calls `createCheckoutSession()`; it does not persist a pending purchase before redirect.
- `src/lib/billing/webhook-service.ts` already handles `checkout.session.completed`, `payment_intent.payment_failed`, and `charge.refunded`.
- Current refund handling marks `Purchase.status = REFUNDED`, but active-program queries rely on purchase status filters rather than explicit refunded UX.
- `src/lib/program/provisioning-service.ts#getCheckoutUnlockState()` currently returns only `{ purchaseId, program }`, so checkout success cannot explain `FAILED` or `REFUNDED`.
- `src/lib/program/current-program-service.ts#resolveCurrentProgramForUser()` currently collapses non-paid states into `no_purchase` unless there is a paid purchase without a program/profile.
- `src/app/(app)/progress/page.tsx` currently has generic fallbacks for `no_purchase`, `missing_profile`, and `missing_day_content`.
- `src/app/(app)/day/[day]/page.tsx` redirects `no_purchase` and `missing_profile` to `/onboarding`.
- `src/app/(app)/onboarding/checkout/success/page.tsx` shows ready vs confirming states, emits `paid` only when `program` exists, and currently displays the full checkout session id as a reference.
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx` already gives retry and refund-policy links for authenticated users.
- `src/app/(marketing)/legal/refund/page.tsx` is still placeholder-level and explicitly says refunds are finalized later.
- `stories/deferred-work.md` contains a deferred item for "Paid purchase without recovery profile repair path"; this story should handle the user-facing support path and avoid ambiguous paid-without-profile states.

### Stripe / Latest Technical Notes

- Official Stripe Checkout event docs list `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed` as Checkout Session lifecycle events.
- Stripe's post-payment guidance for Checkout says delayed payment methods may need `checkout.session.async_payment_succeeded` / `checkout.session.async_payment_failed`; the underlying PaymentIntent can move from `processing` to success or failure.
- Stripe PaymentIntent events include `payment_intent.payment_failed`, which fires when a PaymentIntent fails an attempt to create a payment method or payment.
- Stripe refund docs allow creating a refund by Charge or PaymentIntent. Refund objects include `amount`, `currency`, `charge`, `payment_intent`, `reason`, and `status`.
- Stripe event docs note `charge.refunded` fires for full and partial refunds; for this MVP, treat any matched refund as access revoked because the project has no partial-entitlement model.
- The current Node SDK package is `stripe@^22.1.0`; continue using `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)` with the raw request text in the App Router route.

### Access State Guidance

Recommended server-only state names for implementation:

- `ready`: paid purchase and active/completed program can be opened.
- `missing_program_recovered`: existing recovery path rebuilt a paid program.
- `payment_pending`: checkout was started or returned but no completed paid active program exists yet.
- `payment_failed`: Stripe failure/expiration is known; no paid access should be granted.
- `purchase_refunded`: Stripe refund is known; access should be blocked/revoked.
- `missing_profile`: purchase exists but profile is missing; show finish-profile/support copy.
- `missing_day_content`: program exists but content is unsafe to render; preserve existing support fallback.
- `no_purchase`: no known checkout/purchase state for the user.

Avoid a broad `billing_error` bucket; the point of this story is to remove ambiguity.

### UX / Copy Guidance

- Keep copy calm and operational: tell the user whether payment is pending, failed, refunded, or ready.
- Do not describe refunds as medical dissatisfaction compensation. Frame refunds as product/support policy.
- Do not say the user is "not eligible" when the actual state is payment failed or refunded.
- Do not expose internal database ids, payment intent ids, or customer ids in UI.
- If showing a support reference, prefer a truncated checkout reference after ownership has been verified.
- Keep the product safety boundary visible: educational support only, not diagnosis/treatment/medical clearance.

### Privacy and Safety Guardrails

Do not put these in analytics, monitoring metadata, API JSON, or visible support copy:

- email, full user id, internal purchase/program ids unless already server-owned and strictly required
- full checkout session id in analytics or monitoring; use a truncated UI-only reference if needed
- payment intent id, Stripe customer id, raw Stripe payloads, raw Checkout URLs, webhook signatures, headers, cookies
- recovery profile body part/subtype, cast removal date, pain level, hardware/PT status, notes, job type
- chat text, report text/HTML, `contentJson`, exercise/FAQ slugs if they reveal recovery context

### Testing Guidance

- Reuse existing Playwright + Prisma patterns in `e2e/stripe-webhook.spec.ts`, `e2e/auth-shell.spec.ts`, and `e2e/program-entry.spec.ts`.
- Keep DB-backed tests serial/Desktop-only where the surrounding specs already do so.
- If Supabase pooler instability occurs before the application assertion, document it separately and rerun the focused test in isolation.
- Avoid hitting real Stripe, real Sentry, real analytics providers, or sending email.

### Likely Files to Add or Modify

- `src/lib/billing/purchase-service.ts`
- `src/lib/billing/webhook-service.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/program/current-program-service.ts`
- `src/lib/program/provisioning-service.ts`
- `src/lib/auth/options.ts`
- `src/app/api/program/current/route.ts`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `src/app/(app)/chat/page.tsx` if it currently needs explicit billing-blocked handling
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx`
- `src/app/(marketing)/legal/refund/page.tsx`
- `src/components/marketing/landing-faq.tsx` only if copy must be aligned
- `.env.example` and `scripts/verify-env.ts` only if a concrete support contact env is introduced
- `e2e/stripe-webhook.spec.ts`
- `e2e/auth-shell.spec.ts` or a new focused billing recovery spec
- `e2e/program-entry.spec.ts`
- `stories/7-3-payment-failure-refund-and-support-recovery-paths.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- analytics event vocabulary from Story 7.1
- observability sanitizer/capture helper from Story 7.2
- `prisma/schema.prisma` unless the existing `PurchaseStatus` / `ProgramStatus` model is proven insufficient
- AI chat provider or quota internals
- completion report/share payload behavior
- launch readiness runbook and broad regression suite for Story 7.4

### References

- `epics.md` Epic 7 Story 7.3.
- `技术架构详细设计.md` §13 Payment Design, §14 Monitoring/Analytics/Testing, §15.2 Billing env vars.
- `UX设计规格说明.md` §4 shared feedback patterns, §6 onboarding checkout states, §9 feedback consistency.
- `产品Brief.md` §6 MVP scope, §8 technical/payment considerations, §10 refund-rate risk.
- `stories/7-2-monitoring-and-error-observability.md` previous story intelligence and monitoring privacy guardrails.
- `stories/7-1-product-analytics-and-funnel-events.md` analytics vocabulary and privacy guardrails.
- `stories/deferred-work.md` paid purchase without recovery profile support follow-up.
- `package.json` current `stripe`, `next`, `@prisma/client`, and Playwright versions.
- `prisma/schema.prisma` current `PurchaseStatus` and `ProgramStatus`.
- `src/lib/billing/purchase-service.ts`.
- `src/lib/billing/webhook-service.ts`.
- `src/lib/program/provisioning-service.ts`.
- `src/lib/program/current-program-service.ts`.
- `src/app/(app)/onboarding/checkout/success/page.tsx`.
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx`.
- `src/app/(app)/progress/page.tsx`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/app/api/program/current/route.ts`.
- `src/app/(marketing)/legal/refund/page.tsx`.
- Stripe official docs fetched via Context7 on 2026-05-12: Checkout Session events, PaymentIntent events, refund API/object, `charge.refunded` event behavior, and Stripe Node webhook construction.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Created after `/MyStartupProject1` restored state from `项目主档案.md` and `stories/sprint-status.yaml`.
- MyStartupProject1 prerequisites loaded from `C:\Users\Stark8964911\.codex\skills\MyStartupProject1\SKILL.md`.
- bmad-create-story prerequisites loaded from `C:\Users\Stark8964911\.cursor\skills\bmad-create-story\SKILL.md`, `workflow.md`, `discover-inputs.md`, `checklist.md`, and `template.md`.
- bmad-dev-story prerequisites loaded from `C:\Users\Stark8964911\.cursor\skills\bmad-dev-story\SKILL.md`, `workflow.md`, and `checklist.md`.
- Auto-discovered first backlog story from `stories/sprint-status.yaml`: `7-3-payment-failure-refund-and-support-recovery-paths`.
- Discovery loaded `epics.md`, `产品Brief.md`, `技术架构详细设计.md`, `UX设计规格说明.md`, Story 7.1, Story 7.2, billing/program/auth routes and services, existing E2E specs, and deferred work notes.
- Latest Stripe docs were checked through Context7 because this story depends on current Checkout/webhook/refund event semantics.
- Implementation started by moving Story 7.3 from `ready-for-dev` to `in-progress`, then completed into project status `code-review`.
- Validation passed: `pnpm typecheck`; `pnpm lint`; `pnpm test:e2e e2e/stripe-webhook.spec.ts --project="Desktop Chrome"`; `pnpm test:e2e e2e/auth-shell.spec.ts --project="Desktop Chrome" --grep "checkout success explains pending"`; `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome" --grep "billing"`.

### Completion Notes List

- Story 7.3 should make payment pending, failed, and refunded states explicit across checkout, access gates, and support UX.
- The existing schema likely has enough status vocabulary for MVP; prefer using `PurchaseStatus` and `ProgramStatus.EXPIRED` before adding schema.
- `PAID + ACTIVE/COMPLETED Program` is the only paid-access grant condition.
- Any matched refund revokes access in MVP; partial refund entitlement is intentionally out of scope.
- Checkout success must not emit `paid` or claim readiness unless a paid active program exists.
- Support/refund copy should become concrete enough for users, but no billing portal, automated refund API, subscription logic, admin dashboard, or email workflow belongs in this story.
- Implemented explicit `payment_pending`, `payment_failed`, and `purchase_refunded` states across checkout success, progress, current-program API, Day, Chat, Completion, and session purchase derivation.
- Real Stripe Checkout creation now records a recoverable `PENDING` purchase with safe Stripe operational fields only; dev mock remains local-only.
- Stripe failure/expiration events now update only pending/failed purchases, while stale failures do not downgrade paid active access.
- Matched refunds now mark purchases `REFUNDED`, set `refundedAt`, and set the associated program to `EXPIRED` so progress is retained but access is revoked.
- Checkout/progress/refund support copy is aligned across success, cancelled, Landing FAQ, and `/legal/refund` without exposing full checkout session ids, payment intent ids, customer ids, or medical profile fields.

### File List

- `src/lib/billing/purchase-service.ts`
- `src/lib/billing/webhook-service.ts`
- `src/lib/program/provisioning-service.ts`
- `src/lib/program/current-program-service.ts`
- `src/lib/chat/context.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/program/current/route.ts`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `src/app/(app)/chat/page.tsx`
- `src/app/(app)/completion/page.tsx`
- `src/app/(marketing)/legal/refund/page.tsx`
- `src/components/marketing/landing-faq.tsx`
- `e2e/stripe-webhook.spec.ts`
- `e2e/auth-shell.spec.ts`
- `e2e/program-entry.spec.ts`
- `stories/7-3-payment-failure-refund-and-support-recovery-paths.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-12: Created Story 7.3 with explicit billing state scope, pending purchase persistence guidance, Stripe failure/refund transition requirements, support/refund UX guidance, privacy guardrails, and focused regression requirements; story marked ready-for-dev.
- 2026-05-12: Implemented Story 7.3 billing failure/refund recovery paths, added focused webhook/checkout/protected-route regression coverage, and moved story to code-review.
