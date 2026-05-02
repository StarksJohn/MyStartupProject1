# Story 3.2: Stripe Webhook Unlock and Program Creation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a newly paying user,
I want the product to unlock my plan immediately after payment,
so that I can start Day 1 without manual intervention.

## Acceptance Criteria

1. **AC1 - Stripe webhook endpoint verifies real signatures**
   **Given** Stripe sends a webhook to the app
   **When** `POST /api/stripe/webhook` receives the request
   **Then** it reads the raw request body, validates the `stripe-signature` header with `stripe.webhooks.constructEvent(...)`, and uses `STRIPE_WEBHOOK_SECRET`
   **And** invalid signatures return a 400 response without writing `Purchase`, `Program`, or `ProgramDay`.

2. **AC2 - Checkout completed writes an idempotent paid Purchase**
   **Given** a verified `checkout.session.completed` event for the Story 2.4 one-time Checkout flow
   **When** the webhook is processed
   **Then** the system creates or updates a `Purchase` row for the authenticated `client_reference_id` user
   **And** stores `stripeCheckoutSessionId`, `stripePaymentIntentId`, `stripeCustomerId`, `amount`, `currency`, `status: PAID`, and `paidAt`
   **And** repeated delivery of the same event does not duplicate purchase or program records.

3. **AC3 - Program and initial 14 ProgramDay records are provisioned once**
   **Given** the paid user has a saved `RecoveryProfile`
   **When** the purchase is marked paid
   **Then** the system creates exactly one `Program` linked to the same user, `RecoveryProfile`, and `Purchase`
   **And** creates 14 `ProgramDay` rows with `dayIndex` 1 through 14, `currentDay: 1`, `status: ACTIVE`, and safe placeholder/template-first `contentJson`
   **And** the provisioner is transactional, so partial `ProgramDay` creation cannot leave a half-provisioned plan.

4. **AC4 - Success page restores users into the unlocked state**
   **Given** a logged-in user returns to `/onboarding/checkout/success?session_id=...`
   **When** the corresponding paid purchase/program exists
   **Then** the success page shows that the plan is ready and provides a primary CTA toward the Day 1 entry path
   **And** if the webhook has not arrived yet, it keeps the existing honest "confirming payment" pending state without claiming that Day 1 is ready.

5. **AC5 - Dev-mock checkout remains testable without real Stripe**
   **Given** `STRIPE_SECRET_KEY` is absent locally and Story 2.4 returns `session_id=dev_mock`
   **When** a logged-in test user reaches the success page after saving a `RecoveryProfile`
   **Then** local/dev code can provision a deterministic paid `Purchase`, `Program`, and 14 `ProgramDay` rows without calling Stripe
   **And** this dev path is unavailable in production.

6. **AC6 - Session purchase fields become real without bloating JWT**
   **Given** Story 2.1 exposed `session.user.hasPurchase` and `session.user.activeProgramId` as defaults
   **When** a user session is created or refreshed after Story 3.2
   **Then** `hasPurchase` is derived from a paid `Purchase` / active `Program`
   **And** `activeProgramId` is the active program id or `null`
   **And** the session still only stores `id`, `email`, `hasPurchase`, and `activeProgramId`.

7. **AC7 - Failed/refunded events are recorded safely but do not unlock**
   **Given** Stripe sends `payment_intent.payment_failed` or `charge.refunded`
   **When** the verified event is processed
   **Then** the system updates an existing `Purchase` to `FAILED` or `REFUNDED` when it can match the Stripe identifiers
   **And** it does not create a new `Program` or unlock Day 1 from failed/refunded events
   **And** unmatchable events are acknowledged and logged without crashing the webhook.

8. **AC8 - Story 3.2 does not implement downstream Day UI or AI**
   **Given** later stories own Day rendering, program content quality, chat, and progress
   **When** Story 3.2 is implemented
   **Then** it does not build the Day page UI, exercise cards, day completion endpoint, RAG retrieval, AI provider calls, embeddings, Upstash quotas, analytics, refunds UI, billing portal, subscription logic, i18n, or native app work.

9. **AC9 - Validation covers webhook and conversion regression**
   **Given** webhook handling is security-sensitive
   **When** implementation is complete
   **Then** tests cover valid and invalid webhook signatures, repeated `checkout.session.completed` delivery, missing `RecoveryProfile`, dev-mock provisioning, and failed/refunded events
   **And** `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and focused `pnpm test:e2e e2e/auth-shell.spec.ts` pass.

## Tasks / Subtasks

- [x] **T1 - Add webhook environment and verification boundary** (AC: 1, 9)
  - [x] 1.1 Add `STRIPE_WEBHOOK_SECRET` to `.env.example` and `scripts/verify-env.ts` as production-required only when webhook unlock is active.
  - [x] 1.2 Add `src/app/api/stripe/webhook/route.ts`.
  - [x] 1.3 In the route, call `await request.text()` and pass the exact raw payload to `stripe.webhooks.constructEvent(payload, signature, secret)`.
  - [x] 1.4 Return 400 for missing secret/signature or invalid signature before any database writes.
  - [x] 1.5 Keep `runtime` default Node.js unless the implementation verifies Stripe sync crypto works in a different runtime.

- [x] **T2 - Implement purchase and program provisioning service** (AC: 2, 3, 5, 7)
  - [x] 2.1 Create a server-only helper such as `src/lib/billing/webhook-service.ts` or `src/lib/program/provisioning-service.ts`.
  - [x] 2.2 For verified `checkout.session.completed`, require `client_reference_id` as `userId`; normalize absent Stripe ids to `null`, never empty strings.
  - [x] 2.3 Use a Prisma transaction to upsert `Purchase` by `stripeCheckoutSessionId`.
  - [x] 2.4 Load the user's `RecoveryProfile` by `userId`; if missing, mark/log the purchase state without creating a `Program`.
  - [x] 2.5 Create one `Program` per `Purchase` and 14 `ProgramDay` rows using Story 3.1 constraints.
  - [x] 2.6 Make repeated processing idempotent: no duplicate `Purchase`, `Program`, or `ProgramDay` rows.
  - [x] 2.7 For `payment_intent.payment_failed` and `charge.refunded`, update matched purchases without unlocking a program.

- [x] **T3 - Preserve and extend checkout success behavior** (AC: 4, 5, 8)
  - [x] 3.1 Update `/onboarding/checkout/success` to look up the logged-in user's paid purchase/program for the supplied `session_id`.
  - [x] 3.2 Show "plan ready" and a Day 1 CTA only when the paid purchase and active program exist.
  - [x] 3.3 Preserve the pending copy when no program exists yet.
  - [x] 3.4 Implement dev-only `session_id=dev_mock` provisioning for local/Playwright when `NODE_ENV !== "production"` and `STRIPE_SECRET_KEY` is absent.
  - [x] 3.5 Do not build Day UI in this story; the CTA may target the future Day 1 route if route work is explicitly scoped as a placeholder, or fall back to a clear "Day 1 will open here" pending shell if not.

- [x] **T4 - Make session purchase fields real** (AC: 6)
  - [x] 4.1 Update `src/lib/auth/options.ts` callbacks or a small helper so `hasPurchase` / `activeProgramId` derive from DB state safely.
  - [x] 4.2 Keep session shape unchanged: `id`, `email`, `hasPurchase`, `activeProgramId`.
  - [x] 4.3 Avoid putting `Purchase`, `Program`, `RecoveryProfile`, or large product state in the JWT/session.
  - [x] 4.4 Keep development login behavior deterministic for E2E.

- [x] **T5 - Add focused tests and regression coverage** (AC: 1, 2, 3, 4, 5, 7, 9)
  - [x] 5.1 Add route/service tests for valid Stripe webhook signatures using `stripe.webhooks.generateTestHeaderString(...)`.
  - [x] 5.2 Add a test for invalid signatures returning 400 and creating no rows.
  - [x] 5.3 Add a repeated `checkout.session.completed` test proving idempotency.
  - [x] 5.4 Add a missing `RecoveryProfile` test.
  - [x] 5.5 Add failed/refunded event tests.
  - [x] 5.6 Extend focused E2E so dev-mock success reaches the unlocked/ready state without real Stripe.

- [x] **T6 - Validate and document results** (AC: 9)
  - [x] 6.1 Run `pnpm db:generate`.
  - [x] 6.2 Run `pnpm typecheck`.
  - [x] 6.3 Run `pnpm lint`.
  - [x] 6.4 Run the new focused webhook/service tests.
  - [x] 6.5 Run focused `pnpm test:e2e e2e/auth-shell.spec.ts`.
  - [x] 6.6 Update this story's Dev Agent Record with commands, results, and any schema-application blockers.

## Dev Notes

### Review Findings

- `patch` — Concurrent duplicate `checkout.session.completed` delivery could race between event lookup and event persistence, allowing both requests to execute provisioning and one request to hit the `Program.purchaseId` unique constraint. Fixed by creating/observing the `StripeWebhookEvent` record before processing, skipping only events with `processedAt`, and making `Program` creation recover from unique conflicts by reloading the existing program and idempotently backfilling days.
- `dismiss` — The success page links to `/day/1` before Day UI exists. This is allowed by AC4/AC8 as a placeholder CTA toward the future Day 1 entry path and does not implement Day UI.
- `dismiss` — `pnpm prisma db push` / `db execute` CLI hangs were environmental against the current Supabase pooler, not an application-code defect. Focused tests passed after applying the required runtime tables through Prisma Client.

### Product and Architecture Intent

- Story 3.2 is the first real unlock story. Story 2.4 created Checkout Sessions and an honest pending success page; Story 3.1 froze the data model. Story 3.2 connects payment confirmation to `Purchase`, `Program`, and 14 `ProgramDay` rows.
- Keep the Epic 2 discipline: this story owns webhook unlock and program provisioning only. It must not drift into Day UI, exercise content, AI/RAG, analytics, refund UI, or subscription logic.
- Source requirements:
  - `epics.md` Epic 3 Story 3.2: webhook stores purchase, marks paid, creates `Program` and initial `ProgramDay` records; success flow can route the user toward Day 1.
  - `技术架构详细设计.md` §9.1: Onboarding -> Checkout -> Program Provisioning.
  - `技术架构详细设计.md` §13: single SKU, one-time Stripe Checkout, `POST /api/stripe/webhook`, required events.
  - `stories/deferred-work.md`: Story 3.1 deferred durable Stripe event idempotency to this story.

### Current Real Code Baseline

- `src/lib/billing/purchase-service.ts` creates Checkout Sessions with:
  - `mode: "payment"`
  - `client_reference_id: userId`
  - `customer_email`
  - `success_url: /onboarding/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  - dev fallback `/onboarding/checkout/success?session_id=dev_mock` when `STRIPE_SECRET_KEY` is absent.
- `src/app/api/checkout/route.ts` currently verifies the logged-in user and requires a `RecoveryProfile`, then calls `createCheckoutSession(...)`; it does not write `Purchase`.
- `src/app/(app)/onboarding/checkout/success/page.tsx` currently shows pending copy and checkout reference; it deliberately says Day 1 is not ready yet.
- `src/app/(app)/onboarding/checkout/cancelled/page.tsx` says no program/purchase/recovery plan was created.
- `src/lib/auth/options.ts` currently defaults `hasPurchase: false` and `activeProgramId: null`; Story 3.2 is allowed to make these real while preserving the same session fields.
- `prisma/schema.prisma` now has the Story 3.1 domain models and review patch constraints:
  - `Purchase.stripeCheckoutSessionId @unique`
  - `Purchase.stripePaymentIntentId String? @unique`
  - `Program.purchaseId @unique`
  - `Program` composite owner constraints to `Purchase` and `RecoveryProfile`
  - `ProgramDay @@unique([programId, dayIndex])`

### Stripe Webhook Requirements

- Current dependency: `stripe ^22.1.0` in `package.json`.
- Context7 Stripe Node docs checked on 2026-05-01:
  - Webhook verification must pass the **raw request body**, the `stripe-signature` header, and endpoint secret to `stripe.webhooks.constructEvent(...)`.
  - Do not parse JSON before signature verification.
  - Tests can use `stripe.webhooks.generateTestHeaderString(...)` to generate valid test signatures.
- App Router implementation guardrail:
  - Use `await request.text()` for the raw payload.
  - Use `request.headers.get("stripe-signature")`.
  - Return `NextResponse.json({ received: true })` or equivalent 2xx only after safe handling/acknowledgment.
  - Return 400 for signature failures.

### Idempotency and Data Invariants

- Minimum durable idempotency for this story:
  - Upsert `Purchase` by `stripeCheckoutSessionId`.
  - Create `Program` with `purchaseId` unique; on duplicate/retry, return existing program.
  - Create `ProgramDay` rows with unique `[programId, dayIndex]`; repeated processing must not create duplicates.
- Stronger event-level idempotency was deferred from Story 3.1. Preferred implementation:
  - Add a small `StripeWebhookEvent` model/table with `stripeEventId @unique`, `type`, `processedAt`, `createdAt`, and optional `payloadJson`.
  - If the event id already exists, acknowledge without rerunning side effects.
  - If the implementation chooses not to add the model, it must explain why row-level idempotency is enough for this story and record the tradeoff.
- Normalize optional Stripe identifiers:
  - `stripePaymentIntentId: paymentIntentId?.trim() || null`
  - `stripeCustomerId: customerId?.trim() || null`
  - Never store `""` in unique optional Stripe fields.

### Program Provisioning Scope

- This story may create safe placeholder/template-first content because Story 3.3 owns full template-first generation.
- Acceptable `ProgramDay.contentJson` for Story 3.2:
  - deterministic placeholder structure with `dayIndex`, `title`, `summary`, `exerciseSlugs: []`, `faqSlugs: []`, and safety copy
  - no medical diagnosis, no unsafe exercise prescription, no AI-generated content
- It must still create exactly 14 rows so Story 3.4 can retrieve current program/day without inventing provisioning.
- Use Story 3.1 content contract directories as references, but do not require full real content in this story.

### Session and Access Boundary

- `hasPurchase` should mean the user has at least one paid purchase with an active program, not just any checkout attempt.
- `activeProgramId` should be the active program id for the logged-in user, or `null`.
- Keep JWT/session small. Do not add program details, purchase ids list, profile details, or Stripe identifiers to the session.
- Any DB lookup inside auth callbacks must be scoped to `token.id` / `session.user.id` and must fail closed to `false` / `null` on missing data.

### Environment Notes

- Add `STRIPE_WEBHOOK_SECRET`.
- Keep `STRIPE_SECRET_KEY` behavior from Story 2.4: production requires it, local dev can use the dev-mock path.
- Do not add Gemini, Groq, Upstash, analytics, video hosting, PDF, billing portal, subscription, or refund UI env vars.

### Testing Requirements

- Prefer focused service/route tests for webhook behavior. If the repo lacks a unit test framework today, use the smallest project-consistent option already available, or document why E2E/API-level coverage is used instead.
- Must cover:
  - valid signed `checkout.session.completed`
  - invalid signature
  - repeated event delivery
  - missing `RecoveryProfile`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - dev-mock checkout success provisioning
- Existing focused E2E must keep passing and should now assert the success flow can reach the unlocked/ready state in local dev.

### Project Structure Notes

Likely files to add or modify:

- `src/app/api/stripe/webhook/route.ts`
- `src/lib/billing/webhook-service.ts` or `src/lib/program/provisioning-service.ts`
- `src/lib/billing/purchase-service.ts` only if Checkout metadata needs a narrow addition
- `src/lib/auth/options.ts`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `scripts/verify-env.ts`
- `.env.example`
- `prisma/schema.prisma` only if adding `StripeWebhookEvent` or narrow webhook idempotency fields
- focused tests under the repo's existing test structure or new minimal test files if justified
- `e2e/auth-shell.spec.ts`
- `stories/3-2-stripe-webhook-unlock-and-program-creation.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- Landing/marketing pages
- Onboarding eligibility/profile form UI
- Day page UI or exercise card components
- Chat UI / AI provider modules
- Analytics/monitoring setup beyond webhook error logging

### Previous Story Intelligence

- Story 3.1 review fixed schema-level owner constraints. Use those constraints: always provision by `userId`, `recoveryProfile.userId`, and `purchase.userId` together.
- Story 3.1 deferred numeric/date check constraints and active-program policy. Story 3.2 should at minimum enforce service-level guards for `currentDay`, `dayIndex`, `completionPercent`, and `startDate <= endDate`.
- Story 2.4 dev-mock checkout path is the regression surface. Preserve it and extend it so local E2E can verify unlock without Stripe network calls.
- Story 2.4 success page text intentionally did not claim unlock. Change it only when DB state proves a program exists.

### References

- `epics.md` Epic 3 Story 3.2.
- `技术架构详细设计.md` §9.1 and §13.
- `stories/3-1-program-domain-models-and-provisioning-inputs.md`.
- `stories/deferred-work.md`.
- `prisma/schema.prisma`.
- `src/lib/billing/purchase-service.ts`.
- `src/app/api/checkout/route.ts`.
- `src/app/(app)/onboarding/checkout/success/page.tsx`.
- Stripe Node docs via Context7 on webhook `constructEvent` and `generateTestHeaderString`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 3.1 code-review was completed and marked done.
- Context7 Stripe Node docs checked for webhook raw-body signature verification.
- `pnpm prisma db push` and `pnpm prisma db execute --stdin` hung against the current Supabase pooler during local schema application.
- Applied the Story 3.1/3.2 runtime tables needed by this story through Prisma Client `$executeRawUnsafe` so focused E2E could validate the implementation against the active database.
- `pnpm deploy:verify` was also run after the env-script edit; it failed on pre-existing required local deployment variables (`DATABASE_URL`, `EMAIL_SERVER`, `EMAIL_FROM`) while `STRIPE_WEBHOOK_SECRET` correctly remained optional outside production.
- Lightweight code review completed on 2026-05-01. One `patch` finding was fixed for concurrent Stripe webhook idempotency.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 3.2 must implement webhook unlock and program creation without pulling in Day UI, AI/RAG, analytics, refunds UI, or subscriptions.
- Added `POST /api/stripe/webhook` with raw-body Stripe signature verification and 400 responses for missing/invalid signatures.
- Added durable Stripe event idempotency through `StripeWebhookEvent`, plus row-level idempotency on `Purchase`, `Program`, and `ProgramDay`.
- Implemented paid purchase upsert, 14-day placeholder program provisioning, missing-profile handling, failed/refunded event updates, dev-mock provisioning, and real session purchase fields.
- Updated checkout success to show plan-ready copy and a Day 1 placeholder CTA only when a paid purchase and active program exist.
- Validation passed: `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e e2e/stripe-webhook.spec.ts`, and `pnpm test:e2e e2e/auth-shell.spec.ts`.
- Review patch validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e e2e/stripe-webhook.spec.ts`, and targeted `pnpm test:e2e e2e/auth-shell.spec.ts -g "checkout CTA uses dev fallback"`.

### File List

- `stories/3-2-stripe-webhook-unlock-and-program-creation.md`
- `.env.example`
- `scripts/verify-env.ts`
- `prisma/schema.prisma`
- `playwright.config.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/billing/webhook-service.ts`
- `src/lib/program/provisioning-service.ts`
- `src/lib/auth/options.ts`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `e2e/stripe-webhook.spec.ts`
- `e2e/auth-shell.spec.ts`
