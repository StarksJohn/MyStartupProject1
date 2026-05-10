# Story 7.1: Product Analytics and Funnel Events

Status: done

<!-- Created by bmad-create-story after Epic 6 was completed and Story 6.3 was lightly reviewed, validated, and marked done. -->

## Story

As the product operator,  
I want meaningful funnel and usage events captured across the core journey,  
so that I can identify conversion and engagement bottlenecks.

## Acceptance Criteria

1. **AC1 - Analytics adapter is explicit, lightweight, and safe by default**  
   **Given** the app may run locally, in CI, or before a production analytics provider is chosen  
   **When** analytics helpers are loaded  
   **Then** analytics defaults to disabled/no-op unless a public provider flag enables it  
   **And** the implementation does not add new runtime dependencies, Prisma models, server logging endpoints, or analytics database tables.

2. **AC2 - Approved event vocabulary is centralized**  
   **Given** architecture §14.2 documents the MVP analytics vocabulary  
   **When** product events are emitted  
   **Then** event names come from a typed central registry for `landing_view`, `cta_click`, `quiz_start`, `quiz_submit`, `checkout_start`, `paid`, `day_completed`, `chat_sent`, `chat_escalated`, `share_click`, and `completion_report_view`  
   **And** tests fail if callers try to emit unknown event names.

3. **AC3 - Public landing funnel events are captured without PII**  
   **Given** a visitor opens the landing page and clicks primary/secondary CTAs  
   **When** those actions happen  
   **Then** the app emits `landing_view` and `cta_click` with low-cardinality metadata such as `surface` / `cta_id` only  
   **And** no email, user ID, medical profile field, query parameter, or free-text content is included.

4. **AC4 - Onboarding and checkout funnel events are captured at conversion points**  
   **Given** a signed-in user moves through Eligibility, Recovery Profile, Summary, and Checkout  
   **When** they start/submit eligibility, save profile, start checkout, and reach checkout success  
   **Then** the app emits `quiz_start`, `quiz_submit`, `checkout_start`, and `paid` at the relevant moments  
   **And** event properties avoid body part, subtype, pain level, dates, notes, email, Stripe IDs, checkout session IDs, and user IDs.

5. **AC5 - Paid usage and activation events are captured**  
   **Given** a paid user completes a day, sends a chat question, triggers danger escalation, downloads the completion report, or shares the product link  
   **When** those actions complete or are intentionally attempted  
   **Then** the app emits `day_completed`, `chat_sent`, `chat_escalated`, `completion_report_view`, and `share_click` respectively  
   **And** it must not include chat text, citations, provider/model names, quota keys, Day content, report content, body part/subtype, payment data, or internal IDs.

6. **AC6 - Provider integration remains provider-agnostic for v1**  
   **Given** the architecture allows Plausible or Umami  
   **When** analytics is enabled  
   **Then** the helper supports a small browser-side adapter for at least `plausible` and `umami` if their global functions already exist  
   **And** it no-ops cleanly when globals are absent, so CI and local dev remain deterministic.

7. **AC7 - Existing behavior and safety boundaries remain intact**  
   **Given** analytics is added to already-working flows  
   **When** the user completes the same E2E paths as before  
   **Then** navigation, checkout fallback, Day completion, Chat streaming, report download, and share fallback behavior remain unchanged  
   **And** analytics failures must never block user-facing actions.

8. **AC8 - Focused regression coverage proves emissions and privacy**  
   **Given** this story introduces analytics behavior  
   **When** implementation is complete  
   **Then** tests cover disabled no-op behavior, enabled provider dispatch, representative landing/onboarding/checkout/day/chat/report/share emissions, unknown event rejection at type/test level where practical, and private-data exclusion  
   **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add a typed analytics helper and safe provider adapter** (AC: 1, 2, 6, 8)
  - [x] 1.1 Add `src/lib/analytics/events.ts` with a typed event registry and property types for the approved events only.
  - [x] 1.2 Add `src/lib/analytics/client.ts` as a `"use client"` helper exposing `trackEvent(name, properties?)`.
  - [x] 1.3 Default analytics to disabled unless `NEXT_PUBLIC_ANALYTICS_PROVIDER` is `plausible` or `umami`.
  - [x] 1.4 Support existing browser globals only: `window.plausible(eventName, { props })` and `window.umami.track(eventName, props)` or the current Umami-compatible global if already present.
  - [x] 1.5 Catch provider errors and return without throwing; user actions must continue.
  - [x] 1.6 Do not add packages, Prisma schema, `/api/analytics`, `navigator.sendBeacon`, server-side logs, or DB persistence in this story.

- [x] **T2 - Add privacy guardrails for event properties** (AC: 1, 3, 4, 5, 8)
  - [x] 2.1 Keep properties low-cardinality and generic: examples include `surface`, `cta_id`, `step`, `result`, `day`, `program_completed`, `method`, and `outcome`.
  - [x] 2.2 Explicitly block or omit private keys such as `email`, `userId`, `programId`, `purchaseId`, `checkoutSessionId`, `stripe*`, `bodyPart`, `subType`, `painLevel`, `notes`, `question`, `answer`, `report`, `contentJson`, `provider`, `model`, `quotaKey`, and raw URLs with query strings.
  - [x] 2.3 If adding a sanitizer helper, unit-test it via existing TypeScript/lint/E2E-friendly patterns without introducing a new test runner.

- [x] **T3 - Instrument landing CTA surfaces** (AC: 3, 7, 8)
  - [x] 3.1 Add a small client analytics island or client CTA wrapper for `src/app/(marketing)/page.tsx`.
  - [x] 3.2 Emit `landing_view` once per page load.
  - [x] 3.3 Emit `cta_click` for Hero primary (`Start my 2-minute quiz`), Hero secondary (`See how the 14-day plan works`), and Footer CTA.
  - [x] 3.4 Keep links as normal accessible links; analytics failure must not prevent navigation or anchor scrolling.

- [x] **T4 - Instrument onboarding and checkout conversion points** (AC: 4, 7, 8)
  - [x] 4.1 In `src/components/onboarding/eligibility-gate.tsx`, emit `quiz_start` when the user first interacts with the eligibility form or when the gate first renders if simpler and deterministic.
  - [x] 4.2 Emit `quiz_submit` after eligibility classification with only `result: eligible | not_eligible | needs_clinician_attention`.
  - [x] 4.3 In `src/components/onboarding/recovery-profile-form.tsx`, do not emit profile details; if tracking step progression, use only generic `step` labels.
  - [x] 4.4 In `src/components/onboarding/personalized-summary.tsx`, emit `checkout_start` before the checkout POST is attempted.
  - [x] 4.5 Add a client-only success-page tracker for `src/app/(app)/onboarding/checkout/success/page.tsx` that emits `paid` when a plan is ready; do not include `session_id` or Stripe identifiers.

- [x] **T5 - Instrument paid usage events** (AC: 5, 7, 8)
  - [x] 5.1 In `src/components/day-plan/day-plan-actions.tsx`, emit `day_completed` only after `/api/program/day/[day]/complete` returns ok; include `day` and `program_completed` only.
  - [x] 5.2 In Chat flow, emit `chat_sent` when a paid user submits a non-empty question; do not include the question text.
  - [x] 5.3 Emit `chat_escalated` when the client receives or renders an escalation result; do not include matched terms or user text.
  - [x] 5.4 In `src/components/completion/report-download-action.tsx`, emit `completion_report_view` only after a successful report response is received or download starts.
  - [x] 5.5 In `src/components/completion/completion-share-action.tsx`, emit `share_click` when the user triggers the share button; include only `method: native | clipboard | manual` and `outcome`.

- [x] **T6 - Add focused analytics E2E coverage** (AC: 1-8)
  - [x] 6.1 Add focused tests to existing specs or a new `e2e/analytics-events.spec.ts`.
  - [x] 6.2 Mock provider globals with `page.addInitScript` and set public env/provider behavior in a deterministic way compatible with Playwright.
  - [x] 6.3 Assert landing events dispatch without blocking navigation.
  - [x] 6.4 Assert onboarding/checkout events do not include email, profile fields, or checkout/session identifiers.
  - [x] 6.5 Assert day/chat/report/share events dispatch representative event names and safe props.
  - [x] 6.6 Assert disabled/no-provider mode does not throw and does not require network access.
  - [x] 6.7 Run `pnpm typecheck`.
  - [x] 6.8 Run `pnpm lint`.
  - [x] 6.9 Run focused Playwright coverage; document Supabase pooler instability separately if it occurs before application assertions.

### Review Findings

- [x] [Review][Patch] Production analytics could be enabled through the test-only window provider override [`src/lib/analytics/client.ts:29`] — fixed by allowing `window.__analyticsProvider` only outside production, so production remains controlled by `NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible|umami`.

## Dev Notes

### Product Intent

- Epic 7 is the operator-readiness epic. Story 7.1 should answer: "Where are users dropping off and which paid behaviors are happening?"
- The MVP does not need a full analytics dashboard inside the app.
- The MVP does need consistent, privacy-safe events that can later feed Plausible or Umami.
- The product is medical-adjacent; analytics must avoid medical profile details and free-text health content.

### Current Code Baseline

- No analytics helper/provider exists in `src/` yet.
- `.env.example` currently has Core/Auth/Sentry/Stripe variables but no `NEXT_PUBLIC_ANALYTICS_PROVIDER`, Plausible domain, or Umami site id.
- Landing page is a Server Component at `src/app/(marketing)/page.tsx` with CTA links to `/onboarding` and `#how-it-works`.
- Onboarding state lives in `src/components/onboarding/eligibility-gate.tsx`, with steps `eligibility | profile | summary`.
- Recovery profile save lives in `src/components/onboarding/recovery-profile-form.tsx`; it posts to `/api/onboarding/recovery-profile`.
- Checkout start lives in `src/components/onboarding/personalized-summary.tsx`; it posts to `/api/checkout` and redirects to the returned URL.
- Checkout success is a Server Component at `src/app/(app)/onboarding/checkout/success/page.tsx`; it handles `session_id=dev_mock` locally and real Stripe sessions via `getCheckoutUnlockState`.
- Day completion client behavior lives in `src/components/day-plan/day-plan-actions.tsx`; successful completion redirects to `/completion` if the program becomes completed.
- Chat route streams NDJSON from `src/app/api/chat/route.ts`; client chat UI is already covered in `e2e/program-entry.spec.ts`.
- Report download client behavior lives in `src/components/completion/report-download-action.tsx`.
- Share behavior lives in `src/components/completion/completion-share-action.tsx` and currently has no analytics emission by design; Story 7.1 now owns `share_click`.

### Approved Event Vocabulary

Use these names exactly unless implementation discovers a hard conflict:

- `landing_view`
- `cta_click`
- `quiz_start`
- `quiz_submit`
- `checkout_start`
- `paid`
- `day_completed`
- `chat_sent`
- `chat_escalated`
- `share_click`
- `completion_report_view`

Prefer event properties over additional event-name variants. For example, use `cta_click` with `cta_id: hero_primary`, not `hero_cta_click`.

### Safe Property Examples

- `cta_click`: `{ surface: "landing", cta_id: "hero_primary" }`
- `quiz_submit`: `{ result: "eligible" }`
- `checkout_start`: `{ surface: "personalized_summary" }`
- `paid`: `{ source: "checkout_success", plan_ready: true }`
- `day_completed`: `{ day: 14, program_completed: true }`
- `chat_sent`: `{ surface: "chat" }`
- `chat_escalated`: `{ surface: "chat" }`
- `completion_report_view`: `{ surface: "completion" }`
- `share_click`: `{ surface: "completion", method: "native", outcome: "success" }`

### Privacy and Safety Guardrails

Do not send:

- email, user ID, session ID, program ID, purchase ID, checkout session ID, payment intent ID, Stripe customer ID
- body part, subtype, pain level, cast removal date, hardware status, PT referral, job type, notes
- chat question text, answer text, citations, matched danger terms, provider/model names, quota keys
- Day title/focus/summary, exercise slugs, FAQ slugs, `contentJson`
- report HTML/text, report filename if it could become user-specific later
- full URLs containing query strings

### Scope Boundaries

Do not implement in Story 7.1:

- an internal analytics dashboard
- database-backed event storage
- `/api/analytics` or `/api/share`
- server-side analytics logging
- Sentry monitoring changes; Story 7.2 owns monitoring/error observability
- payment failure/refund analytics or support recovery; Story 7.3 owns those product states
- launch-readiness runbook or broad regression suite; Story 7.4 owns that
- new dependencies

### Testing Guidance

- Prefer a deterministic mock global, for example `window.plausible = (name, options) => window.__analyticsEvents.push({ name, props: options?.props })`.
- Keep event assertions focused on representative flows; do not multiply the already-long DB-backed E2E suite unnecessarily.
- Existing DB-backed tests use Desktop-only execution with Mobile skips for auth/program flows. Follow the same pattern when seeding paid users.
- For public landing events, a lighter test can run without auth or DB.
- For privacy assertions, serialize event payloads and assert forbidden substrings/keys are absent.

### Likely Files to Add or Modify

- `src/lib/analytics/events.ts`
- `src/lib/analytics/client.ts`
- `src/components/analytics/analytics-page-view.tsx` or equivalent small client island
- `src/app/(marketing)/page.tsx`
- `src/components/onboarding/eligibility-gate.tsx`
- `src/components/onboarding/recovery-profile-form.tsx` only if generic step progression is needed
- `src/components/onboarding/personalized-summary.tsx`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `src/components/day-plan/day-plan-actions.tsx`
- Chat client component or API-adjacent client code that owns send/escalation rendering
- `src/components/completion/report-download-action.tsx`
- `src/components/completion/completion-share-action.tsx`
- `.env.example`
- `e2e/analytics-events.spec.ts` or focused additions to existing E2E specs
- `stories/7-1-product-analytics-and-funnel-events.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- Stripe webhook idempotency internals
- completion report generation service output
- AI provider implementation
- Sentry config / instrumentation files

### References

- `epics.md` Epic 7 Story 7.1.
- `技术架构详细设计.md` §14.2 Product Analytics, §15.1 Analytics provider note.
- `UX设计规格说明.md` landing analytics notes, especially §5.6.
- `src/app/(marketing)/page.tsx`.
- `src/components/onboarding/eligibility-gate.tsx`.
- `src/components/onboarding/personalized-summary.tsx`.
- `src/app/(app)/onboarding/checkout/success/page.tsx`.
- `src/components/day-plan/day-plan-actions.tsx`.
- `src/app/api/chat/route.ts` and existing chat E2E in `e2e/program-entry.spec.ts`.
- `src/components/completion/report-download-action.tsx`.
- `src/components/completion/completion-share-action.tsx`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Created after Story 6.3 was approved without patch and Epic 6 was marked done.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; project context restored from `项目主档案.md`, `stories/sprint-status.yaml`, `epics.md`, architecture, UX, and real code files.
- Source discovery loaded via exact reads and targeted search: Epic 7 section, architecture analytics sections, landing page, onboarding components, checkout success page, day completion client/API, chat route, report download, share action, `.env.example`, and existing E2E coverage.
- Implemented typed analytics vocabulary, safe property sanitizer, and browser-only provider adapter. Analytics remains no-op unless `NEXT_PUBLIC_ANALYTICS_PROVIDER` is `plausible` or `umami`; E2E uses a non-production-only `window.__analyticsProvider` override.
- Initial E2E runs exposed Supabase pooler/transaction instability in profile save, dev-mock checkout provisioning, Day completion, and Chat streaming. The focused analytics spec now mocks those downstream APIs where needed so Story 7.1 tests remain about event emission and privacy, while existing feature specs continue to own DB-backed behavior.

### Completion Notes List

- Story 7.1 should add the first product analytics layer, not monitoring, support, refunds, launch QA, or dashboards.
- The implementation should be provider-agnostic and disabled/no-op by default.
- The event vocabulary should remain centralized and typed.
- The analytics payload must avoid medical, payment, account, chat, report, and internal identifiers.
- Epic 7 later stories own monitoring, payment/refund recovery, and launch readiness.
- Implemented `landing_view`, `cta_click`, `quiz_start`, `quiz_submit`, `checkout_start`, `paid`, `day_completed`, `chat_sent`, `chat_escalated`, `completion_report_view`, and `share_click`.
- Analytics payloads are sanitized to allowed low-cardinality keys only and exclude account, payment, medical profile, chat, report, provider/model, quota, and raw URL data.
- Code review fixed the provider override guard so production analytics cannot be enabled by a browser global alone.
- Added focused `e2e/analytics-events.spec.ts`; validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e e2e/analytics-events.spec.ts` (`6 passed`, `2 skipped`).

### File List

- `stories/7-1-product-analytics-and-funnel-events.md`
- `.env.example`
- `e2e/analytics-events.spec.ts`
- `src/lib/analytics/events.ts`
- `src/lib/analytics/client.ts`
- `src/components/analytics/analytics-page-view.tsx`
- `src/components/analytics/analytics-link.tsx`
- `src/app/(marketing)/page.tsx`
- `src/components/onboarding/eligibility-gate.tsx`
- `src/components/onboarding/personalized-summary.tsx`
- `src/app/(app)/onboarding/checkout/success/page.tsx`
- `src/components/day-plan/day-plan-actions.tsx`
- `src/components/chat/chat-entry-shell.tsx`
- `src/components/completion/report-download-action.tsx`
- `src/components/completion/completion-share-action.tsx`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-10: Created Story 7.1 with typed analytics adapter scope, approved event vocabulary, privacy guardrails, provider-agnostic no-op default, focused instrumentation targets, and focused regression guidance; story marked ready-for-dev.
- 2026-05-10: Implemented Story 7.1 product analytics layer, wired core funnel/usage events, added privacy-safe E2E coverage, passed typecheck/lint/focused E2E, and marked story code-review.
- 2026-05-11: Completed light bmad-code-review, fixed the non-production analytics provider override guard, revalidated typecheck/lint/focused E2E, and marked story done.
