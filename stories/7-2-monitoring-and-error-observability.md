# Story 7.2: Monitoring and Error Observability

Status: done

<!-- Created by bmad-create-story after Story 7.1 product analytics was implemented, lightly reviewed, and marked done. -->

## Story

As the product operator,  
I want production failures to be visible quickly,  
so that broken core flows can be fixed before they damage trust.

## Acceptance Criteria

1. **AC1 - Sentry setup follows the approved Next.js baseline**  
   **Given** the project already has `@sentry/nextjs`, `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and conditional `withSentryConfig`  
   **When** Story 7.2 is implemented  
   **Then** the implementation keeps the existing Sentry baseline working for App Router, server, edge, client, source-map wrapping, replay privacy masking, and no-DSN local/CI no-op behavior  
   **And** it does not add a new monitoring vendor, logging package, database table, dashboard, or background job.

2. **AC2 - Caught core-flow failures are manually captured**  
   **Given** Next.js and the app currently catch errors and return graceful responses in several routes/services  
   **When** checkout, Stripe webhook, Day completion, completion report, chat generation, chat quota, chat stream, citation retrieval, and session purchase-state resolution fail inside `try/catch` blocks  
   **Then** those caught failures are sent to Sentry or the approved observability helper before returning the existing user-safe response  
   **And** the existing response status codes, JSON contracts, streaming fallback behavior, and user-facing copy remain unchanged unless a current bug is discovered.

3. **AC3 - Monitoring context is useful but privacy-safe**  
   **Given** the product is medical-adjacent and handles account, payment, recovery, chat, and report data  
   **When** an error event is captured  
   **Then** tags/extra identify the affected flow using low-cardinality values such as `flow`, `route`, `operation`, `status`, `stripe_event_type`, `day`, `provider`, and `used_fallback`  
   **And** events must not include email, raw Stripe secrets, raw checkout URLs, recovery profile fields, pain level, notes, chat question/answer text, citations text, report HTML/text, `contentJson`, or raw request headers/cookies.

4. **AC4 - Operator-critical fallbacks remain observable**  
   **Given** the app intentionally falls back for AI provider errors, Upstash quota failures, missing current day content, missing completion report content, and Stripe webhook duplicate/ignored states  
   **When** those fallbacks happen  
   **Then** expected non-fatal states are captured as breadcrumbs/messages or low-severity events where useful  
   **And** noisy expected states such as unauthenticated, unauthorized, normal 404s, unsupported Stripe event types, disabled analytics, and local dev no-DSN runs do not create alert noise.

5. **AC5 - Error boundaries cover render failures**  
   **Given** Sentry documentation for Next.js App Router requires manual capture in `error.tsx` / `global-error.tsx` because error boundaries intercept render errors  
   **When** the app renders an unexpected route-level or root-level error  
   **Then** a client error boundary captures the error with Sentry and shows a recovery UI  
   **And** it preserves the app's medical safety tone without exposing stack traces or sensitive details to users.

6. **AC6 - Observability helper centralizes safe capture behavior**  
   **Given** many routes currently use direct `console.error` calls with ad hoc metadata  
   **When** new monitoring capture is added  
   **Then** implementation should prefer a small shared helper such as `src/lib/observability/server.ts` and, only if needed, `src/lib/observability/client.ts`  
   **And** the helper should no-op when Sentry DSN is absent, sanitize disallowed keys, normalize unknown errors, and avoid duplicating captures for the same failure path.

7. **AC7 - Environment verification includes production monitoring readiness**  
   **Given** `.env.example` and `scripts/verify-env.ts` already list Sentry variables as optional and source-map upload variables as optional  
   **When** production verification runs  
   **Then** the script should continue to allow local dev without Sentry  
   **And** it should clearly warn or fail in production when monitoring/source-map settings are incomplete according to the chosen production-readiness policy for this story.

8. **AC8 - Focused regression proves capture behavior without hitting real Sentry**  
   **Given** CI/local tests must stay deterministic and should not call external Sentry endpoints  
   **When** Story 7.2 is complete  
   **Then** focused tests or test seams prove that captured errors are sanitized, core caught failures call the shared capture path, no-DSN mode does not throw, and existing user-facing error responses still work  
   **And** `pnpm typecheck`, `pnpm lint`, and focused E2E or unit-level coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add a shared observability capture helper** (AC: 2, 3, 4, 6, 8)
  - [x] 1.1 Add a server-safe helper under `src/lib/observability/server.ts` or equivalent.
  - [x] 1.2 Expose functions for `captureError(error, context)` and, if useful, `captureMessage(message, context)` with typed `flow` / `operation` fields.
  - [x] 1.3 Import `@sentry/nextjs` only inside the helper or in a way that stays compatible with the existing server/client configs.
  - [x] 1.4 No-op when neither `SENTRY_DSN` nor `NEXT_PUBLIC_SENTRY_DSN` is configured.
  - [x] 1.5 Sanitize metadata by allowlisting safe keys and dropping private keys before calling Sentry.
  - [x] 1.6 Keep existing `console.error` only where it still helps local development, but do not rely on console output as the only production observability path.

- [x] **T2 - Capture checkout and Stripe webhook failures** (AC: 2, 3, 4, 8)
  - [x] 2.1 In `src/app/api/checkout/route.ts`, capture `createCheckoutSession` failures with `flow: "checkout"` and `operation: "create_checkout_session"`.
  - [x] 2.2 Do not include email, raw Stripe URLs, or Stripe secrets in captured metadata.
  - [x] 2.3 In `src/app/api/stripe/webhook/route.ts`, capture webhook processing failures with `flow: "billing_webhook"`, `stripe_event_type`, and `stripe_event_id`.
  - [x] 2.4 Treat invalid signatures as warnings/noise unless the story intentionally adds a low-severity breadcrumb/message; do not make expected invalid signatures alert as P0 errors.
  - [x] 2.5 In `src/lib/billing/webhook-service.ts`, capture cleanup failures and ignored/duplicate states only if doing so will not create alert noise.

- [x] **T3 - Capture paid app API and content failures** (AC: 2, 3, 4, 8)
  - [x] 3.1 In `src/app/api/program/day/[day]/complete/route.ts`, capture unexpected completion failures with `flow: "day_completion"` and `day`.
  - [x] 3.2 In `src/app/api/program/report/route.ts`, capture report generation exceptions with `flow: "completion_report"` while excluding report HTML/text and filenames if they could become user-specific.
  - [x] 3.3 Consider adding low-severity capture for missing content states already logged from Day and Completion pages, but avoid duplicate captures if the API/service layer already records the same failure.
  - [x] 3.4 Preserve all current response contracts and cache headers.

- [x] **T4 - Capture AI chat provider, quota, stream, and citation failures** (AC: 2, 3, 4, 8)
  - [x] 4.1 In `src/app/api/chat/route.ts`, capture final chat generation failures with `flow: "chat"` and `operation: "generate_answer"`.
  - [x] 4.2 In `src/lib/chat/provider.ts`, capture primary provider failure as a fallback breadcrumb/message rather than a fatal error when Groq or deterministic fallback succeeds.
  - [x] 4.3 In `src/lib/chat/quota.ts`, capture Upstash quota read failures as non-fatal fallback-to-database events.
  - [x] 4.4 In `src/lib/chat/stream.ts`, capture stream persistence/finalization errors while preserving the existing NDJSON `error` event.
  - [x] 4.5 In `src/lib/chat/context.ts`, capture citation retrieval failures as non-fatal RAG degradation.
  - [x] 4.6 Never capture the user's question, model answer, citation excerpts, matched danger terms, quota keys, or full recovery context.

- [x] **T5 - Capture session purchase-state degradation** (AC: 2, 3, 4, 8)
  - [x] 5.1 In `src/lib/auth/options.ts`, capture failures from `getActiveProgramForUser` during JWT/session refresh.
  - [x] 5.2 Preserve the current fallback of `hasPurchase = false` and `activeProgramId = null`.
  - [x] 5.3 Use safe metadata only; do not include email or profile fields.

- [x] **T6 - Add App Router error boundaries if missing** (AC: 1, 5, 8)
  - [x] 6.1 Check whether `src/app/error.tsx` and `src/app/global-error.tsx` already exist.
  - [x] 6.2 If missing, add minimal client boundaries that call `Sentry.captureException(error)` and show safe recovery UI.
  - [x] 6.3 Keep the UI non-diagnostic and generic; do not expose stack traces, digests, raw route params, or request data.
  - [x] 6.4 Avoid duplicate capture with parent boundaries where possible.

- [x] **T7 - Update monitoring environment docs and verification** (AC: 1, 7)
  - [x] 7.1 Update `.env.example` comments if needed to clarify which Sentry vars are local-optional and production-recommended/required.
  - [x] 7.2 Update `scripts/verify-env.ts` production policy for `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` only if this story chooses to make launch monitoring a production gate.
  - [x] 7.3 Do not require source-map upload vars in local dev or CI unless a production build verification path explicitly needs them.

- [x] **T8 - Add focused tests for observability behavior** (AC: 2, 3, 6, 8)
  - [x] 8.1 Add helper-level tests or focused Playwright/API tests using a mocked Sentry capture seam; do not send real events to Sentry.
  - [x] 8.2 Assert no-DSN mode does not throw.
  - [x] 8.3 Assert sanitizer drops private keys such as email, chat text, recovery fields, raw headers/cookies, report content, `contentJson`, and Stripe secrets.
  - [x] 8.4 Assert at least checkout failure, webhook processing failure, chat generation failure, quota fallback, and report generation failure call the capture helper or documented observability path.
  - [x] 8.5 Re-run `pnpm typecheck`.
  - [x] 8.6 Re-run `pnpm lint`.
  - [x] 8.7 Run focused E2E/API coverage that proves user-facing responses remain unchanged where practical.

### Review Findings

- [x] [Review][Patch] Sentry capture path should not rely on asynchronous dynamic import and should preserve safe stack context [src/lib/observability/server.ts:168] — fixed by using the Sentry SDK directly inside the shared helpers and preserving sanitized error stacks.
- [x] [Review][Patch] Completion report observability should not emit warning events for normal `not_completed` access [src/app/api/program/report/route.ts:44] — fixed by only capturing `missing_content` report fallback as a monitoring event.

## Dev Notes

### Product Intent

- Epic 7 is the operator-readiness epic. Story 7.2 should answer: "When a core flow breaks, will I know quickly and have enough safe context to debug it?"
- Story 7.1 already owns product analytics events. Do not expand analytics vocabulary here unless a monitoring test needs a tiny support hook.
- Story 7.3 owns payment failure/refund/support recovery UX and state changes. Story 7.2 may observe failures, but it should not implement new billing recovery flows.
- Story 7.4 owns launch readiness runbook and broad regression safety net. Story 7.2 should add focused monitoring coverage, not the full launch QA suite.

### Current Code Baseline

- `@sentry/nextjs` is already installed in `package.json` (`^10.32.1`), and current Sentry docs indicate the App Router `onRequestError` pattern is supported for Next.js 15+ with SDK `8.28.0+`.
- `next.config.ts` already conditionally wraps the app with `withSentryConfig` when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` exists.
- `instrumentation.ts` already imports server/edge Sentry config by runtime and implements `onRequestError` with `Sentry.captureException(error, { extra })`.
- `sentry.client.config.ts` already initializes browser Sentry only when `NEXT_PUBLIC_SENTRY_DSN` exists, enables replay with text/media masking, and filters some network errors.
- `sentry.server.config.ts` and `sentry.edge.config.ts` already no-op without DSN and set sample rates/environment.
- The codebase still has many caught failures that only call `console.error`, so Sentry will not see them unless Story 7.2 adds manual capture.
- `.env.example` currently includes Sentry DSNs and source-map upload vars, but comments still describe Story 1.1 baseline and do not define a clear production gate.

### Caught Failure Paths Found During Story Creation

- `src/app/api/checkout/route.ts`: catches checkout session creation failures and returns `stripe_checkout_unavailable`.
- `src/app/api/stripe/webhook/route.ts`: catches invalid signature with `console.warn`, catches processing failures with `eventId` and `type`, returns `stripe_webhook_processing_failed`.
- `src/lib/billing/webhook-service.ts`: cleans up unprocessed Stripe event locks and logs cleanup failures.
- `src/app/api/program/day/[day]/complete/route.ts`: catches day completion failures and returns `completion_unavailable`.
- `src/app/api/program/report/route.ts`: logs unavailable report states and catches report generation failures.
- `src/app/api/chat/route.ts`: catches provider generation failures and quota consumption failures.
- `src/lib/chat/provider.ts`: catches primary provider failure and tries fallback.
- `src/lib/chat/quota.ts`: catches Upstash read failure and falls back to database quota.
- `src/lib/chat/stream.ts`: catches stream finalization errors and emits an NDJSON `error` event.
- `src/lib/chat/context.ts`: catches citation retrieval failures and returns an empty citation set.
- `src/lib/auth/options.ts`: catches active program lookup failure during JWT/session callback and falls back to no purchase state.

### Privacy and Safety Guardrails

Allowed monitoring context should stay small and operational:

- `flow`: `checkout | billing_webhook | day_completion | completion_report | chat | chat_quota | chat_stream | rag_retrieval | auth_session | app_render`
- `operation`: short low-cardinality operation name
- `route`: static route pattern such as `/api/chat`, not a raw URL with query string
- `status`: known status/error code returned by the application
- `day`: numeric day only when relevant
- `stripe_event_type` and `stripe_event_id` for webhook debugging
- `provider`: `gemini | groq | mock` only where needed; avoid model names unless they are already generic and non-user-specific

Do not capture:

- email, raw user profile fields, pain level, cast removal date, notes, job type
- chat question, answer, matched danger terms, citation excerpts, prompt text, raw recovery context
- report HTML/text, report filename if user-specific, `contentJson`, exercise/FAQ slugs if they can reveal health context
- raw request headers, cookies, authorization headers, raw URLs with query strings
- Stripe secret keys, webhook secrets, full checkout URLs, payment intent payloads

Internal IDs need judgment:

- For server-side operator debugging, `userId`, `programId`, or `purchaseId` may be useful, but avoid sending them by default from generic helpers. Prefer adding them only on server-side events where they are already necessary to resolve a support issue and never include email.
- Stripe webhook events may include `stripe_event_id` and `stripe_event_type`; avoid full event payloads.

### Sentry / Next.js Implementation Notes

- Current Sentry Next.js docs say unhandled client errors and server crashes are captured automatically, but `try/catch` blocks and App Router error boundaries need manual `Sentry.captureException`.
- Current docs show `instrumentation.ts` can export `onRequestError = Sentry.captureRequestError`; this project already has a custom `onRequestError` that captures selected request metadata. Implementation may keep the custom version if it adds safer context than the one-liner.
- App Router `error.tsx` and `global-error.tsx` should call `Sentry.captureException(error)` because boundaries intercept errors before Sentry can see them.
- If enabling Sentry logs (`enableLogs: true`) is considered, keep it out of scope unless it clearly improves this story without adding noise or changing vendor usage.
- Do not enable `sendDefaultPii: true`; the product is medical-adjacent and the current client replay config already masks text/media.

### Testing Guidance

- Prefer helper-level tests for sanitizer behavior because they are deterministic and do not require real Sentry.
- If the repo has no unit test runner configured beyond E2E and type/lint, use focused Playwright/API tests or a small exported pure sanitizer function that can be validated indirectly without adding dependencies.
- Avoid real Sentry network calls by mocking the helper, using no-DSN mode, or injecting a non-production test seam.
- Existing DB-backed E2E tests sometimes depend on Supabase pooler stability. If DB instability occurs before application assertions, document it separately; do not weaken privacy/capture assertions.

### Likely Files to Add or Modify

- `src/lib/observability/server.ts`
- `src/lib/observability/client.ts` only if client boundary/helper reuse needs it
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/api/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/billing/webhook-service.ts`
- `src/app/api/program/day/[day]/complete/route.ts`
- `src/app/api/program/report/route.ts`
- `src/app/api/chat/route.ts`
- `src/lib/chat/provider.ts`
- `src/lib/chat/quota.ts`
- `src/lib/chat/stream.ts`
- `src/lib/chat/context.ts`
- `src/lib/auth/options.ts`
- `.env.example`
- `scripts/verify-env.ts`
- focused E2E or helper coverage under `e2e/` if no unit test path exists
- `stories/7-2-monitoring-and-error-observability.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- analytics event vocabulary from Story 7.1
- Stripe purchase/refund state machine for Story 7.3
- launch-readiness runbook/regression matrix for Story 7.4
- Sentry package version or new logging dependencies

### References

- `epics.md` Epic 7 Story 7.2.
- `技术架构详细设计.md` §14.1 Monitoring, §15.1 production monitoring, §15.2 env vars.
- `UX设计规格说明.md` shared feedback/error/critical patterns.
- `产品Brief.md` quality保障 / Sentry baseline and medical-adjacent privacy constraints.
- Sentry Next.js manual setup docs fetched 2026-05-11: App Router setup uses `instrumentation.ts`, server/edge/client configs, `withSentryConfig`, source maps, and error boundaries.
- Sentry Next.js capturing errors docs fetched 2026-05-11: caught errors and `error.tsx` / `global-error.tsx` require manual `captureException`.
- `package.json`.
- `.env.example`.
- `next.config.ts`.
- `instrumentation.ts`.
- `sentry.client.config.ts`.
- `sentry.server.config.ts`.
- `sentry.edge.config.ts`.
- `src/app/api/checkout/route.ts`.
- `src/app/api/stripe/webhook/route.ts`.
- `src/lib/billing/webhook-service.ts`.
- `src/app/api/program/day/[day]/complete/route.ts`.
- `src/app/api/program/report/route.ts`.
- `src/app/api/chat/route.ts`.
- `src/lib/chat/provider.ts`.
- `src/lib/chat/quota.ts`.
- `src/lib/chat/stream.ts`.
- `src/lib/chat/context.ts`.
- `src/lib/auth/options.ts`.
- `stories/7-1-product-analytics-and-funnel-events.md`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Created after `/ask-MyStartupProject1` restored state from `项目主档案.md` and `stories/sprint-status.yaml`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; project context restored from project docs and real code.
- bmad-create-story prerequisites loaded from `C:\Users\Stark8964911\.cursor\skills\bmad-create-story\SKILL.md`, `workflow.md`, `discover-inputs.md`, `checklist.md`, and `template.md`.
- Auto-discovered first backlog story from `stories/sprint-status.yaml`: `7-2-monitoring-and-error-observability`.
- Latest Sentry Next.js docs were checked via web fetch because Context7 documentation querying was unavailable after descriptor discovery; relevant current guidance was included in Dev Notes.
- Dev implementation prerequisites loaded from `C:\Users\Stark8964911\.cursor\skills\bmad-dev-story\SKILL.md`, `workflow.md`, and `checklist.md`.
- Story status moved `ready-for-dev` -> `in-progress` before implementation, then `code-review` after implementation and validation.
- `pnpm exec playwright test --project="Desktop Chrome" --workers=1 --reporter=line` reached 73 passed, 1 failed, 2 did not run; the remaining failure was a Prisma 30s transaction timeout in `paid purchase with inactive program restores active program`, and the same test passed when rerun in isolation.
- Light `bmad-code-review` prerequisites loaded from `C:\Users\Stark8964911\.cursor\skills\bmad-code-review\SKILL.md`, `workflow.md`, `checklist.md`, and steps `step-01-gather-context.md` through `step-04-present.md`.
- Repository BMAD config gap fixed with `_bmad/bmm/config.yaml`; `bmad-code-review/checklist.md` was added to the local Cursor skill directory before continuing review.

### Completion Notes List

- Added shared server/client observability helpers that no-op without DSN, sanitize metadata through an allowlist, redact sensitive error messages, and expose a test sink for deterministic no-network coverage.
- Wired safe capture calls into caught checkout, Stripe webhook, webhook service, day completion, completion report, chat generation/quota/stream/citation, and session/current-program degradation paths without changing user-facing response contracts.
- Added App Router `error.tsx` and `global-error.tsx` boundaries with safe recovery UI and client-side render-error capture.
- Updated Sentry environment readiness comments and production verification policy while keeping local/CI no-DSN runs allowed.
- Added focused observability E2E coverage for sanitizer behavior, no-DSN capture safety, and static integration of core caught-failure paths.
- Stabilized two existing program-entry E2E assertions uncovered during full regression: the chat quota assertion now waits for stream completion, and the Day page chat CTA assertion verifies the link target plus chat reachability instead of depending on a long-run click transition.
- Code review fixed 2 patch findings: capture helpers now use direct Sentry SDK calls and preserve sanitized stack context; completion report warning capture is limited to missing content rather than normal not-completed access.

### File List

- `_bmad/bmm/config.yaml`
- `.env.example`
- `e2e/observability.spec.ts`
- `e2e/program-entry.spec.ts`
- `scripts/verify-env.ts`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/api/chat/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/program/current/route.ts`
- `src/app/api/program/day/[day]/complete/route.ts`
- `src/app/api/program/report/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/auth/options.ts`
- `src/lib/billing/webhook-service.ts`
- `src/lib/chat/context.ts`
- `src/lib/chat/provider.ts`
- `src/lib/chat/quota.ts`
- `src/lib/chat/stream.ts`
- `src/lib/observability/client.ts`
- `src/lib/observability/server.ts`
- `stories/7-2-monitoring-and-error-observability.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-11: Created Story 7.2 with Sentry/Next.js observability scope, caught-failure capture targets, privacy-safe metadata rules, error-boundary guidance, production env verification guidance, and focused testing requirements; story marked ready-for-dev.
- 2026-05-11: Implemented Story 7.2 observability helper, safe capture integrations, App Router error boundaries, environment production gates, and focused tests; story marked code-review.
- 2026-05-12: Completed light bmad-code-review, fixed 2 patch findings, verified typecheck/lint/focused E2E, and marked story done.
