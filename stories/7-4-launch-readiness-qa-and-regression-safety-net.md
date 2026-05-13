# Story 7.4: Launch Readiness QA and Regression Safety Net

Status: ready-for-dev

<!-- Created by bmad-create-story after Story 7.3 payment failure/refund/support recovery paths were implemented, lightly reviewed, and marked done. -->

## Story

As the product operator,
I want a minimal but real quality gate before launch,
so that the first public release does not break the core value flow.

## Acceptance Criteria

1. **AC1 - Launch regression gate covers the whole MVP value path**
   **Given** the MVP is nearing launch
   **When** the launch regression gate is run
   **Then** it covers, at minimum, Landing -> Onboarding -> Checkout, paid Day usage, paid Chat, Day 14 completion, report download, sharing, analytics no-op/provider behavior, observability helper behavior, and Stripe webhook/billing recovery states
   **And** critical failures are easy to identify as release blockers.

2. **AC2 - Regression gate reuses existing Playwright coverage instead of duplicating flows**
   **Given** the repo already has focused E2E coverage in `e2e/marketing-shell.spec.ts`, `e2e/auth-shell.spec.ts`, `e2e/stripe-webhook.spec.ts`, `e2e/program-entry.spec.ts`, `e2e/analytics-events.spec.ts`, and `e2e/observability.spec.ts`
   **When** this story defines the launch QA safety net
   **Then** it composes or documents those existing specs as the launch gate before adding new tests
   **And** any new E2E fills a genuine gap rather than re-testing an already covered path.

3. **AC3 - Environment verification supports an explicit production-readiness mode**
   **Given** `scripts/verify-env.ts` currently checks required local variables and only treats `requiredInProduction` as blocking when `NODE_ENV=production`
   **When** the launch readiness command is run
   **Then** production-critical variables are checked even from a local shell via an explicit production-readiness option or documented command
   **And** missing or malformed variables block release readiness with clear variable names and descriptions.

4. **AC4 - Runtime/toolchain prerequisites are surfaced before E2E launch validation**
   **Given** `next@16.1.1` in `pnpm-lock.yaml` requires Node `>=20.9.0`
   **When** a developer or operator follows the launch runbook
   **Then** the required Node and pnpm versions are visible before running the dev server or Playwright
   **And** the Story 7.3 known failure mode, local Node `18.20.8` blocking the Next.js dev server, is prevented or clearly explained.

5. **AC5 - README or runbook contains a compact launch QA checklist**
   **Given** README currently documents getting started, smoke E2E, and `pnpm run deploy:verify`, but still reflects early Story 1.1 status in places
   **When** this story is complete
   **Then** README and/or a focused runbook lists the exact pre-launch checks, commands, expected pass/fail meaning, and what to do when a gate fails
   **And** the guidance points to existing setup sections rather than scattering contradictory instructions.

6. **AC6 - Launch gate does not call real external services by default**
   **Given** local and CI E2E should remain deterministic
   **When** launch QA runs locally or in CI without real production credentials
   **Then** it uses dev-mock Stripe checkout, signed test webhook payloads, no-op or mocked analytics, no-DSN Sentry behavior, and deterministic chat provider paths
   **And** it does not send email, call live Stripe, call live Sentry, call Plausible/Umami, call Gemini/Groq, or require Upstash unless an explicit production verification step is being run.

7. **AC7 - Privacy and medical-safety assertions stay in the launch safety net**
   **Given** previous stories added explicit privacy/safety guardrails for analytics, observability, billing support, chat, reports, and sharing
   **When** launch readiness is checked
   **Then** the gate preserves assertions that private identifiers, payment secrets, recovery profile details, chat content, report content, and medical-diagnostic language are not exposed in analytics, monitoring, API responses, or public sharing flows
   **And** the product still states educational support rather than diagnosis, treatment, or medical clearance.

8. **AC8 - Final validation results are recorded without pretending blocked checks passed**
   **Given** launch readiness can fail because of local runtime, missing production env, database instability, or application assertions
   **When** the dev agent completes this story
   **Then** the Dev Agent Record lists the exact commands run, pass/fail/blocked status, and blocker category
   **And** `stories/sprint-status.yaml` only moves beyond `code-review` after launch-readiness blockers are resolved or explicitly accepted.

## Tasks / Subtasks

- [ ] **T1 - Inventory and formalize the launch regression gate** (AC: 1, 2, 6, 7)
  - [ ] 1.1 Build a compact launch matrix that maps MVP flow areas to existing specs:
    - Landing, legal, SEO trust content, mobile overflow -> `e2e/marketing-shell.spec.ts`
    - Onboarding, profile, dev checkout fallback, checkout success/cancelled states -> `e2e/auth-shell.spec.ts`
    - Stripe webhook unlock, idempotency, pending/failure/refund transitions -> `e2e/stripe-webhook.spec.ts`
    - Paid Day, completion, report download, sharing, Chat, billing-blocked access -> `e2e/program-entry.spec.ts`
    - Analytics vocabulary/privacy -> `e2e/analytics-events.spec.ts`
    - Observability sanitization/no-DSN behavior -> `e2e/observability.spec.ts`
  - [ ] 1.2 Decide whether the gate should be a README/runbook command sequence or a package script. Prefer a command sequence if `deploy:verify` can intentionally fail without production env.
  - [ ] 1.3 If adding a package script, make its name explicit, such as `qa:launch`, and keep it deterministic; do not hide production env failures inside a broad command.
  - [ ] 1.4 Do not add a second test suite that duplicates existing full flows unless the matrix reveals an uncovered launch-critical path.

- [ ] **T2 - Add production-readiness env verification mode** (AC: 3, 4, 5, 6)
  - [ ] 2.1 Update `scripts/verify-env.ts` so launch checks can force production requirements from a local shell, for example via `--production` or an equivalent documented flag.
  - [ ] 2.2 Keep normal local `pnpm run deploy:verify` behavior friendly for development; local optional DSNs/Stripe keys should not become mandatory unless production mode is requested.
  - [ ] 2.3 Ensure production mode blocks missing or malformed:
    - `NEXT_PUBLIC_APP_URL`
    - `NEXTAUTH_URL`
    - `NEXTAUTH_SECRET`
    - `DATABASE_URL`
    - `DIRECT_URL`
    - `EMAIL_SERVER`
    - `EMAIL_FROM`
    - `SENTRY_DSN`
    - `NEXT_PUBLIC_SENTRY_DSN`
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `GEMINI_API_KEY`
    - `GROQ_API_KEY`
  - [ ] 2.4 Keep `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_ANALYTICS_PROVIDER`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` optional unless the story deliberately changes their launch policy and explains why.
  - [ ] 2.5 Add tests or low-cost script assertions for the new production-readiness mode if practical without adding a new test framework.

- [ ] **T3 - Surface Node/pnpm and local E2E prerequisites** (AC: 4, 5, 8)
  - [ ] 3.1 Add an explicit Node runtime requirement for `next@16.1.1`: Node `>=20.9.0`.
  - [ ] 3.2 Prefer documenting the requirement in README and, if appropriate, adding `package.json` `engines` to prevent repeated local confusion.
  - [ ] 3.3 Keep `packageManager: "pnpm@8.15.0"` unchanged unless there is a concrete reason to upgrade.
  - [ ] 3.4 Mention the current Playwright config behavior: one worker, Desktop Chrome + Mobile Chrome projects, `next dev --webpack`, and `PLAYWRIGHT_TEST_BASE_URL` reuse when an external server is already running.

- [ ] **T4 - Update README / runbook for launch readiness** (AC: 1, 3, 4, 5, 6, 8)
  - [ ] 4.1 Refresh README's stale current-status text so it no longer says only Story 1.1 is landed.
  - [ ] 4.2 Add a compact "Launch Readiness" section with the recommended order:
    - confirm Node/pnpm versions
    - install/generate Prisma if needed
    - run `pnpm typecheck`
    - run `pnpm lint`
    - run local env verification
    - run production-readiness env verification with placeholders replaced
    - run the launch E2E matrix or script
    - record blockers and release decision
  - [ ] 4.3 Explain the difference between local deterministic QA and production configuration verification.
  - [ ] 4.4 Point failures to likely owners: env/config, DB, auth/email, Stripe/webhook, AI/chat, analytics/monitoring, or product assertion.
  - [ ] 4.5 Avoid promising a production deployment, incident process, admin dashboard, or formal legal/compliance signoff in this story.

- [ ] **T5 - Fill only real coverage gaps** (AC: 1, 2, 6, 7)
  - [ ] 5.1 Review existing tests before adding new ones; use `rg -n "test\\(" e2e/*.ts` and the launch matrix.
  - [ ] 5.2 If no new E2E is needed, state that the launch safety net is a curated gate over existing specs.
  - [ ] 5.3 If a gap exists, add the smallest focused test in the most relevant existing spec; avoid a slow all-in-one browser journey unless it catches something existing specs cannot.
  - [ ] 5.4 Keep DB-backed tests serial/Desktop-only where existing specs already do so.
  - [ ] 5.5 Do not call live external services; use the existing dev login, dev-mock checkout, Stripe signed payload helpers, analytics mock, observability test sink, and deterministic chat test modes.

- [ ] **T6 - Run and record validation honestly** (AC: 8)
  - [ ] 6.1 Run or document why unable to run `pnpm typecheck`.
  - [ ] 6.2 Run or document why unable to run `pnpm lint`.
  - [ ] 6.3 Run or document why unable to run local deterministic launch E2E coverage.
  - [ ] 6.4 Run or document why unable to run production-readiness env verification.
  - [ ] 6.5 If Node version blocks E2E, document it as a toolchain blocker and do not label E2E as passed.
  - [ ] 6.6 Update this story's Dev Agent Record with exact commands and results.

## Dev Notes

### Product Intent

- This is the final story in Epic 7. It should make launch readiness visible and repeatable, not add new product features.
- The launch gate should answer: "Can the current MVP be released without breaking the paid value path or leaking private/sensitive data?"
- This story should not redesign onboarding, billing, chat, analytics, monitoring, reports, or legal copy. It should connect existing safeguards into an operator-friendly release check.

### Current Code Baseline

- `package.json` scripts currently include `typecheck`, `lint`, `test:e2e`, `deploy:verify`, and `db:generate`.
- `package.json` pins `next` to `16.1.1`, `react` to `19.2.3`, `@playwright/test` to `^1.57.0`, `@prisma/client` to `^6.19.0`, `@sentry/nextjs` to `^10.32.1`, and `stripe` to `^22.1.0`.
- `pnpm-lock.yaml` resolves `next@16.1.1` with `engines: {node: '>=20.9.0'}`. Story 7.3's focused Playwright rerun was blocked by local Node `18.20.8`; prevent this from being rediscovered the hard way.
- `playwright.config.ts` already uses one worker, Desktop Chrome and Mobile Chrome projects, `next dev --webpack`, `PLAYWRIGHT_TEST_BASE_URL` reuse, and a test `STRIPE_WEBHOOK_SECRET` default.
- `scripts/verify-env.ts` already has an `ENV_REQUIREMENTS` table with `required`, `requiredInProduction`, `pattern`, and `description`. Extend this table-driven pattern rather than rewriting the script.
- `.env.example` documents core auth/database/email, Sentry, product analytics, and Stripe variables. It does not yet document Gemini/Groq/Upstash keys even though `verify-env.ts` checks Gemini/Groq in production mode.
- README still contains early Story 1.1 current-status language. Update it to reflect the actual Epic 7 launch-readiness moment.

### Existing Regression Coverage to Reuse

- `e2e/marketing-shell.spec.ts`: home page, landing value sections, FAQ/safety/footer CTA, mobile overflow, SEO trust article, legal pages, unknown routes.
- `e2e/auth-shell.spec.ts`: sign-in, auth redirects, eligibility gate, profile validation/persistence, personalized summary, dev checkout fallback, checkout cancelled recovery, checkout success pending/failed/refunded copy.
- `e2e/stripe-webhook.spec.ts`: content contract, checkout unlock, idempotency, placeholder upgrade, invalid signatures, missing profile, pending purchase, failed/expired checkout transitions, stale failure non-downgrade, refund revocation.
- `e2e/program-entry.spec.ts`: current program API, Day routes, Chat shell/API/streaming/quota/safety/provider fallback, completion/report/share, day completion, locked/review/missing-content states, paid program recovery, billing-blocked API/progress/day/chat states.
- `e2e/analytics-events.spec.ts`: disabled analytics, landing/onboarding/checkout/paid-usage events, approved vocabulary, private payload exclusion.
- `e2e/observability.spec.ts`: metadata sanitization, no-DSN behavior, low-cardinality context, and caught failure path helper usage.

### Launch Gate Recommendation

Use a two-layer gate:

1. **Local deterministic gate** for every release candidate:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm run deploy:verify`
   - curated Playwright launch matrix using existing specs, at least Desktop Chrome for DB-backed flows
2. **Production configuration gate** before public launch:
   - explicit production-readiness env verification
   - no real user data
   - no live external side effects from Playwright
   - manual confirmation that actual deployment secrets match the verified variable names

Do not make a single local command fail just because production secrets are intentionally absent. The runbook should make the difference clear.

### Environment Policy

- Production-critical for MVP launch:
  - app/auth/database/email: `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `EMAIL_SERVER`, `EMAIL_FROM`
  - monitoring: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
  - billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - AI chat: `GEMINI_API_KEY`, `GROQ_API_KEY`
- Optional unless policy changes:
  - `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps
  - `NEXT_PUBLIC_ANALYTICS_PROVIDER`; analytics must no-op cleanly without it
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`; current code falls back to database quota reads when Upstash is not configured
- Never print env values or secrets in verification output.

### Privacy and Safety Guardrails

Keep these out of analytics, monitoring metadata, launch reports, support copy, screenshots committed to the repo, and README examples:

- email, user id, purchase id, program id, checkout session id, payment intent id, Stripe customer id
- Stripe secrets, webhook signatures, raw Checkout URLs, headers, cookies
- recovery profile fields such as body part, subtype, cast removal date, pain level, notes, hardware/PT status, job type
- chat question/answer text, report HTML/text, `contentJson`, provider/model/quota keys
- medical claims that imply diagnosis, treatment, medical clearance, or guaranteed recovery

### Implementation Boundaries

Allowed:

- README/runbook updates.
- `scripts/verify-env.ts` production-readiness flag or equivalent.
- `package.json` script/engine metadata if useful.
- `.env.example` comments for already-used launch variables.
- Tiny focused E2E additions only if the matrix reveals a real gap.

Not allowed:

- New product features, UI redesign, new payment behavior, new refund behavior, new analytics vocabulary, new observability abstraction, admin dashboards, support ticketing, production deployment automation, GitHub Actions, or new paid services.
- Real Stripe/AI/Sentry/analytics calls in automated local E2E.
- Broad dependency upgrades. Do not upgrade Next, React, Prisma, Stripe, Sentry, or Playwright as part of this story unless a launch blocker is proven and documented.

### Likely Files to Add or Modify

- `README.md`
- `scripts/verify-env.ts`
- `.env.example`
- `package.json`
- `e2e/*.spec.ts` only if a real uncovered launch-critical gap is found
- `stories/7-4-launch-readiness-qa-and-regression-safety-net.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- `src/lib/billing/*` and Stripe webhook behavior from Story 7.3
- `src/lib/analytics/*` event vocabulary from Story 7.1
- `src/lib/observability/*` capture helpers from Story 7.2
- Chat provider, quota, RAG, report, share, and Day completion product behavior

### References

- `epics.md` Epic 7 Story 7.4.
- `项目主档案.md` current stage and next-step block.
- `stories/sprint-status.yaml` current story order and status definitions.
- `stories/7-3-payment-failure-refund-and-support-recovery-paths.md` previous story review finding, validation blocker, file list, and billing state learnings.
- `技术架构详细设计.md` §5 logical layers, §6 module structure, §13 payment design, §14 monitoring/analytics/testing, §15.3 environment validation.
- `UX设计规格说明.md` §2 UX principles and §3 key user journeys.
- `产品Brief.md` §1 executive summary, §3 user journey, §5 success metrics, §8 technical/payment considerations.
- `README.md` current Getting Started, existing environment verification command, and stale current-status section.
- `package.json` scripts and dependency versions.
- `pnpm-lock.yaml` `next@16.1.1` Node engine requirement.
- `playwright.config.ts` current E2E runtime configuration.
- `scripts/verify-env.ts` current environment requirement table.
- `.env.example` currently documented variables.
- Existing E2E specs listed in "Existing Regression Coverage to Reuse".

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Created after `/MyStartupProject1` restored state from `项目主档案.md` and `stories/sprint-status.yaml`.
- MyStartupProject1 prerequisites loaded from the Codex project skill: **Windows** `%USERPROFILE%\.codex\skills\MyStartupProject1\SKILL.md`; **macOS/Linux** `~/.codex/skills/MyStartupProject1/SKILL.md`.
- bmad-create-story prerequisites loaded from the BMAD skill: **Windows** `%USERPROFILE%\.cursor\skills\bmad-create-story\SKILL.md`; **macOS/Linux** `~/.cursor/skills/bmad-create-story/SKILL.md`, plus `workflow.md`, `discover-inputs.md`, `checklist.md`, and `template.md`.
- Auto-discovered first backlog story from `stories/sprint-status.yaml`: `7-4-launch-readiness-qa-and-regression-safety-net`.
- Discovery loaded `epics.md`, `产品Brief.md`, `技术架构详细设计.md`, `UX设计规格说明.md`, Story 7.3, package/test/env/runbook files, and existing E2E coverage inventory.
- Git intelligence checked recent commit `ceb9328`, which completed Story 7.3 review patch and changed `src/lib/billing/webhook-service.ts`, `e2e/stripe-webhook.spec.ts`, Story 7.3, sprint status, project master doc, and a log file.

### Completion Notes List

- Story 7.4 should turn the existing accumulated E2E and env checks into an explicit release gate.
- The highest-risk known blocker is toolchain drift: local Node 18.20.8 blocked Next.js 16.1.1 dev-server E2E during Story 7.3 review.
- Reuse existing tests first. A new all-in-one launch journey is not automatically better than the existing focused specs and may create slow/flaky duplication.
- Production env verification should be explicit, because normal local development intentionally omits real Stripe/Sentry/AI secrets.
- This story should end with an honest launch-readiness record: passed, failed, or blocked, with commands and reasons.

### File List

- `stories/7-4-launch-readiness-qa-and-regression-safety-net.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-13: Created Story 7.4 with launch regression matrix, production env verification requirements, Node/pnpm prerequisite guidance, README/runbook scope, privacy/safety guardrails, and validation recording requirements; story marked ready-for-dev.
