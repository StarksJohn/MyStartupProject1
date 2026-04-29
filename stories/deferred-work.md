# Deferred Work Log

This file tracks deferred items raised during code review. Each section identifies the source review and date; entries are append-only.

## Deferred from: code review of 2-4-personalized-summary-one-time-checkout (2026-04-29)

- Day-15 phrasing for the upper boundary of the 2-week recovery window (`src/lib/onboarding/summary.ts:47-50`) — copy follows spec dev-notes verbatim. Revisit during a later UX/copy polish pass.
- Multi-step `RecoveryProfileForm` remount loses entered state when the user navigates back from Summary via Previous (`src/components/onboarding/recovery-profile-form.tsx`) — pre-existing Story 2.3 behavior; spec does not require state preservation. Consider hoisting form state into the parent or persisting per-step values when investing in onboarding UX polish.
