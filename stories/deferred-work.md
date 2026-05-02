# Deferred Work Log

This file tracks deferred items raised during code review. Each section identifies the source review and date; entries are append-only.

## Deferred from: code review of 2-4-personalized-summary-one-time-checkout (2026-04-29)

- Day-15 phrasing for the upper boundary of the 2-week recovery window (`src/lib/onboarding/summary.ts:47-50`) — copy follows spec dev-notes verbatim. Revisit during a later UX/copy polish pass.
- Multi-step `RecoveryProfileForm` remount loses entered state when the user navigates back from Summary via Previous (`src/components/onboarding/recovery-profile-form.tsx`) — pre-existing Story 2.3 behavior; spec does not require state preservation. Consider hoisting form state into the parent or persisting per-step values when investing in onboarding UX polish.

## Deferred from: code review of 3-1-program-domain-models-and-provisioning-inputs (2026-05-01)

- Durable Stripe event idempotency table — defer to Story 3.2, where webhook signature verification and `checkout.session.completed` processing are implemented.
- Program numeric/date check constraints and active-program service guards — defer to Story 3.2/3.3 provisioning and template generation, where real creation paths can enforce `currentDay`, `dayIndex`, `completionPercent`, date ordering, and active-program policy.
- Executable pgvector extension migration/preflight — defer until the first database migration/schema-application step; `schema.prisma` documents `CREATE EXTENSION IF NOT EXISTS vector;`, but the repo does not yet have Prisma migrations.
- Runtime content validation and `_contract.json` loader exclusion — defer until content loaders are introduced; future loaders should skip underscore-prefixed contract files and validate cross-file exercise/FAQ references.
