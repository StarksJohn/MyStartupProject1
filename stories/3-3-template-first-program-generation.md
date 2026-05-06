# Story 3.3: Template-First Program Generation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paid user,
I want my 14-day plan to feel personalized but safe,
so that I get useful day-by-day guidance without unsafe AI improvisation.

## Acceptance Criteria

1. **AC1 - Program generation uses approved content contracts**
   **Given** a paid user has a `RecoveryProfile`, `Purchase`, and `Program`
   **When** the program is generated or backfilled
   **Then** the system reads versioned template content from `content/programs`
   **And** references only exercise metadata from `content/exercises` and FAQ entries from `content/faq`
   **And** runtime loaders skip underscore-prefixed contract files such as `_contract.json`.

2. **AC2 - Rule-based mapping personalizes without AI**
   **Given** the current `RecoveryProfile` stores `bodyPart`, `subType`, `castRemovedAt`, `hasHardware`, `referredToPt`, `painLevel`, `dominantHandAffected`, `jobType`, and `riskFlagsJson`
   **When** template generation selects a plan
   **Then** it uses deterministic rule-based mapping to choose the safest matching template and day content
   **And** it must not call Gemini, Groq, Vercel AI SDK, embeddings, RAG retrieval, or any LLM provider in this story.

3. **AC3 - ProgramDay rows contain structured safe content**
   **Given** the selected template has 14 days
   **When** generation writes `ProgramDay` records
   **Then** each day has `dayIndex`, `stage`, `estimatedMinutes`, and structured `contentJson`
   **And** `contentJson` includes at minimum `title`, `focus`, `summary`, `exerciseSlugs`, `exercises`, `faqSlugs`, `faqs`, `normalSignals`, `getHelpSignals`, and `safetyNotes`
   **And** every referenced exercise/FAQ slug must resolve to an approved content entry before writes occur.

4. **AC4 - Existing Story 3.2 placeholder programs are safely upgraded**
   **Given** Story 3.2 may already have created `Program` and 14 placeholder `ProgramDay` rows with `templateVersion: "story-3-2-placeholder-v1"`
   **When** Story 3.3 generation runs for that program
   **Then** it updates the existing program in place to the selected template version
   **And** it replaces placeholder day content without duplicating days, resetting `completedAt` or breaking `completionPercent`.

5. **AC5 - Safety boundaries are explicit and reviewable**
   **Given** program content is educational support
   **When** a reviewer inspects generated content
   **Then** no content claims diagnosis, medical clearance, cure, or physician replacement
   **And** every day includes "stop and contact a clinician" style escalation language for severe pain, numbness, color change, fever, pus, sudden swelling, or inability to move.

6. **AC6 - Generation is idempotent and transactionally safe**
   **Given** webhook retries, dev-mock success refreshes, or future repair paths may call generation more than once
   **When** the generator runs repeatedly for the same program
   **Then** it produces the same template selection and 14 day rows
   **And** partial writes cannot leave a mixed placeholder/template state.

7. **AC7 - Story 3.3 does not implement downstream experiences**
   **Given** later stories own current program retrieval, Day UI, progress, completion, chat, RAG, analytics, and launch polish
   **When** Story 3.3 is implemented
   **Then** it does not build `/day/[day]`, exercise card UI, completion endpoints, progress entry routes, chat UI/API, embeddings, vector search, Upstash quotas, analytics events, billing portal, refunds UI, subscriptions, i18n, or native app work.

8. **AC8 - Validation covers content and conversion regression**
   **Given** this story changes the paid unlock output
   **When** implementation is complete
   **Then** tests cover content loader validation, `_contract.json` exclusion, unresolved exercise/FAQ references, deterministic template mapping, idempotent placeholder upgrade, dev-mock provisioning, and Stripe webhook provisioning
   **And** `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/stripe-webhook.spec.ts`, and focused `pnpm test:e2e e2e/auth-shell.spec.ts` pass.

## Tasks / Subtasks

- [x] **T1 - Add minimal approved template content** (AC: 1, 3, 5)
  - [x] 1.1 Add a first versioned program template under `content/programs`, preferably `finger-v1.json` or `hand-v1.json`, with exactly 14 days.
  - [x] 1.2 Add the minimum exercise metadata needed by the template under `content/exercises`.
  - [x] 1.3 Add the minimum FAQ entries needed by the template under `content/faq`.
  - [x] 1.4 Keep all content safe, conservative, and educational; do not write diagnosis, medical clearance, or treatment promises.
  - [x] 1.5 Leave `content/blog/_contract.json` untouched unless a compile issue forces a narrow loader exclusion fix.

- [x] **T2 - Implement content loaders and validators** (AC: 1, 3, 5, 8)
  - [x] 2.1 Add a small server-side content module, such as `src/lib/program/program-content.ts`.
  - [x] 2.2 Load JSON content using project-supported imports or filesystem reads compatible with Next.js server code.
  - [x] 2.3 Exclude files whose basename starts with `_`.
  - [x] 2.4 Validate required template, exercise, and FAQ fields with existing `zod`; do not add a new validation dependency.
  - [x] 2.5 Validate all `exerciseSlugs` and `faqSlugs` before any DB write.
  - [x] 2.6 Return clear error messages that identify the invalid content file and missing/unresolved slug.

- [x] **T3 - Replace placeholder generation with template-first generation** (AC: 2, 3, 4, 6)
  - [x] 3.1 Refactor `src/lib/program/provisioning-service.ts` so `createPlaceholderDayContent(...)` and `story-3-2-placeholder-v1` are no longer the normal output path.
  - [x] 3.2 Add a deterministic template selection helper based on `RecoveryProfile`; start with the current supported hand/finger/metacarpal scope and fall back to the safest hand template.
  - [x] 3.3 Write `Program.templateVersion` from the selected content template.
  - [x] 3.4 Write each `ProgramDay.stage`, `ProgramDay.estimatedMinutes`, and `ProgramDay.contentJson` from validated template data.
  - [x] 3.5 Preserve ownership constraints: always scope by `userId`, `purchase.userId`, `recoveryProfile.userId`, and `program.userId`.

- [x] **T4 - Add safe placeholder upgrade/backfill behavior** (AC: 4, 6)
  - [x] 4.1 If an existing active program has placeholder template content, update it in the same transaction instead of creating a second program.
  - [x] 4.2 Use `upsert` or `updateMany` by `[programId, dayIndex]` so repeated calls leave exactly 14 days.
  - [x] 4.3 Preserve `completionPercent` and `completedAt` if a day has already been interacted with.
  - [x] 4.4 Avoid deleting `ProgramDay` rows unless implementation proves this cannot erase progress.

- [x] **T5 - Keep checkout/webhook behavior stable** (AC: 6, 7, 8)
  - [x] 5.1 Ensure `checkout.session.completed` still creates one paid `Purchase`, one active `Program`, and 14 `ProgramDay` rows.
  - [x] 5.2 Ensure `/onboarding/checkout/success?session_id=dev_mock` still unlocks locally without Stripe.
  - [x] 5.3 Keep `session.user.hasPurchase` and `session.user.activeProgramId` shape unchanged.
  - [x] 5.4 Do not change checkout pricing, Stripe mode, webhook signature verification, or `StripeWebhookEvent` idempotency unless a compile issue requires a narrow fix.

- [x] **T6 - Add focused tests and validation** (AC: 8)
  - [x] 6.1 Add content loader tests or focused E2E/API-level assertions for valid templates and `_contract.json` exclusion.
  - [x] 6.2 Add validation coverage for unresolved exercise and FAQ slugs.
  - [x] 6.3 Extend webhook/dev-mock assertions so created day content is no longer the Story 3.2 placeholder and includes resolved exercises/FAQs/safety content.
  - [x] 6.4 Run `pnpm db:generate`.
  - [x] 6.5 Run `pnpm typecheck`.
  - [x] 6.6 Run `pnpm lint`.
  - [x] 6.7 Run focused `pnpm test:e2e e2e/stripe-webhook.spec.ts`.
  - [x] 6.8 Run focused `pnpm test:e2e e2e/auth-shell.spec.ts`.
  - [x] 6.9 Update this story's Dev Agent Record with commands, results, and any content-quality limitations.

## Dev Notes

### Product and Architecture Intent

- Story 3.3 is the bridge from "paid user has a program shell" to "paid user has safe, structured day-by-day content." Story 3.2 already unlocks payment and creates a placeholder program; this story replaces that placeholder output with template-first generation.
- The architecture explicitly rejects full AI plan generation for v1. The approved model is `模板层 -> 规则层 -> LLM 微调层`, but this story implements only the first two layers. LLM micro-adjustment remains out of scope until there is reviewed content and a safety/RAG runtime.
- Source requirements:
  - `epics.md` Epic 3 Story 3.3: template-first logic, rule-based mapping, traceable structured day content.
  - `技术架构详细设计.md` §10: template-first generation and LLM limits.
  - `技术架构详细设计.md` §11: allowed knowledge sources and danger signals.
  - `UX设计规格说明.md` §7: Day content must support Recovery Header, Today's Focus, Exercise Cards, Normal vs Get Help, Quick Questions, and Sticky Complete later.

### Current Real Code Baseline

- `stories/sprint-status.yaml` marks `3-1-program-domain-models-and-provisioning-inputs: done`, `3-2-stripe-webhook-unlock-and-program-creation: done`, and `3-3-template-first-program-generation: backlog` before this story is created.
- `prisma/schema.prisma` already has:
  - `Program.templateVersion`, `startDate`, `endDate`, `currentDay`, `status`, and `generatedSummaryJson`.
  - `ProgramDay.dayIndex`, `stage`, `contentJson`, `estimatedMinutes`, `completedAt`, and `completionPercent`.
  - `@@unique([programId, dayIndex])`, which should be used for idempotent day writes.
- `src/lib/program/provisioning-service.ts` currently uses:
  - `templateVersion = "story-3-2-placeholder-v1"`.
  - `createPlaceholderDayContent(dayIndex)` with empty `exerciseSlugs` and `faqSlugs`.
  - `createProgramDayRows(programId)` with `early_mobility` for days 1-7 and `strengthening` for days 8-14.
  - `provisionProgramForPaidPurchase(tx, { userId, purchaseId })`, called by webhook processing and dev-mock success.
- `src/lib/billing/webhook-service.ts` calls `provisionProgramForPaidPurchase(...)` after a paid checkout session and already has durable `StripeWebhookEvent` idempotency.
- `src/app/(app)/onboarding/checkout/success/page.tsx` calls `provisionDevMockPurchaseAndProgram(...)` for `session_id=dev_mock` and links to `/day/1` only when an active program exists.
- `src/lib/auth/options.ts` derives `session.user.hasPurchase` and `session.user.activeProgramId` from `getActiveProgramForUser(...)`; keep this session shape small.

### Content Contract Baseline

- `content/programs/_contract.json` is the frozen source contract for versioned 14-day templates. It requires `templateVersion`, `bodyPart`, `stages`, and 14 `days` with `dayIndex`, `stage`, `focus`, `exerciseSlugs`, `safetyNotes`, `faqSlugs`, and `estimatedMinutes`.
- `content/exercises/_contract.json` requires exercise entries with `slug`, `title`, `bodyPart`, `stage`, `instructions`, `contraindications`, `durationSeconds`, `repetitions`, `videoUrl`, and `thumbnailUrl`.
- `content/faq/_contract.json` requires FAQ entries with `slug`, `source`, `bodyPart`, `phase`, `riskLevel`, `question`, `answer`, and `escalationRequired`.
- `content/blog/_contract.json` is reserved for future long-form content. Runtime blog content still lives in `src/lib/content/blog.ts`; do not migrate blog content in this story.
- Story 3.1 deferred runtime content validation and `_contract.json` loader exclusion to the first content-loader story. This is that story.

### Recommended Content Shape

The exact JSON shape may be adjusted during implementation, but keep it close to the contracts and optimized for future Day UI:

```json
{
  "templateVersion": "finger-v1",
  "bodyPart": "finger",
  "stages": ["early_mobility", "gentle_strengthening"],
  "days": [
    {
      "dayIndex": 1,
      "stage": "early_mobility",
      "title": "Day 1: Start gentle motion safely",
      "focus": "Reduce fear and begin gentle range of motion",
      "summary": "Short educational copy for the day.",
      "exerciseSlugs": ["gentle-finger-bends"],
      "faqSlugs": ["finger-swelling-after-cast"],
      "normalSignals": ["Mild stiffness during gentle motion"],
      "getHelpSignals": ["Severe pain", "Numbness", "Blue or purple color change"],
      "safetyNotes": ["Stop if symptoms worsen and contact a clinician."]
    }
  ]
}
```

`ProgramDay.contentJson` should store denormalized display-ready content for later Day UI, not only slugs. Include both slugs and resolved summaries so Story 4 can render without inventing content resolution rules.

### Rule Mapping Guardrails

- Start with one supported template family for the current v1 scope: hand/finger/metacarpal. If `bodyPart` is unsupported, choose the safest general hand template and include conservative copy rather than throwing after payment.
- Use `RecoveryProfile` only for safe deterministic adjustments:
  - `dominantHandAffected` can alter copy about daily-use caution.
  - `jobType` can alter practical examples, not exercise boundaries.
  - `painLevel >= 7` or risk flags can add stronger "contact clinician" copy, not more intense exercises.
  - `hasHardware` / `referredToPt` should bias toward clinician-instruction reminders.
- Do not use `notes` as untrusted free text to generate medical instructions. It may be reflected only in a cautious summary if sanitized and clearly non-prescriptive.

### Idempotency and Backfill Requirements

- Story 3.2 created exactly 14 placeholder days. Story 3.3 should be compatible with programs created before and after this story lands.
- Preferred implementation shape:
  - Add a pure helper that selects and validates a template from a `RecoveryProfile`.
  - Add a generator that returns deterministic `Program` summary + 14 day write inputs.
  - Keep `provisionProgramForPaidPurchase(...)` as the main integration point and have it call the generator.
  - If `purchase.program` already exists, update its template fields and upsert/backfill days instead of returning early after `createMany(skipDuplicates: true)`.
- Protect progress fields:
  - `completionPercent` remains `0` for new days.
  - Existing `completionPercent` and `completedAt` should survive a content backfill.
  - `currentDay` should remain within `1..14`; do not introduce active-program policy changes beyond service-level guards needed for generation.

### Safety and Compliance Notes

- Every day must reinforce: educational support, follow clinician instructions, stop if symptoms worsen.
- Minimum danger signals from architecture §11.4: `severe pain`, `purple`, `blue`, `numb`, `fever`, `pus`, `cannot move`, `sudden swelling`.
- Content can say "may be normal" only in conservative contexts; avoid "is normal" for symptoms that could be risky.
- Do not include medical diagnosis, individualized treatment claims, or clearance to return to work/sport.

### Testing Requirements

- Existing E2E framework is Playwright. The repo does not currently have a separate unit-test runner; if adding pure loader tests would require new tooling, prefer focused Playwright/API-level coverage or a small `tsx` script only if it fits existing scripts. Do not add Jest/Vitest just for this story.
- Minimum focused coverage:
  - Valid template data creates 14 structured days with non-empty exercises/FAQs/safety sections.
  - `_contract.json` files are ignored by runtime loaders.
  - A template with an unresolved exercise or FAQ slug fails before DB writes.
  - Re-running generation for the same purchase/program remains idempotent.
  - Dev-mock checkout success still reaches "Your 14-day plan is ready".
  - Stripe webhook test still proves one purchase, one program, and 14 days.
- Expected validation commands:
  - `pnpm db:generate`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e e2e/stripe-webhook.spec.ts`
  - `pnpm test:e2e e2e/auth-shell.spec.ts`

### Project Structure Notes

Likely files to add or modify:

- `content/programs/finger-v1.json` or `content/programs/hand-v1.json`
- `content/exercises/*.json`
- `content/faq/*.json`
- `src/lib/program/program-content.ts`
- `src/lib/program/provisioning-service.ts`
- `e2e/stripe-webhook.spec.ts`
- `e2e/auth-shell.spec.ts`
- `stories/3-3-template-first-program-generation.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- Landing/marketing pages
- Onboarding eligibility/profile UI
- Stripe checkout creation, pricing, and webhook signature verification
- `prisma/schema.prisma`, unless a narrow service-level guard reveals a schema compile issue
- Day page UI or `/day/[day]` route
- Chat UI/API, AI provider modules, embeddings, vector search, or Upstash quota code
- Analytics/monitoring setup

### Previous Story Intelligence

- Story 3.2 review fixed a concurrent Stripe webhook idempotency risk. Do not weaken `StripeWebhookEvent` handling while integrating template generation.
- Story 3.2 currently acknowledges a `/day/1` placeholder CTA before Day UI exists. That remains acceptable; Story 3.3 should improve the program data behind the CTA, not build the CTA target.
- Story 3.1 review deferred content validation and contract-file exclusion to the content-loader story. Failing to handle `_contract.json` would make runtime loaders treat documentation as data.
- Supabase/Postgres remains the canonical DB target for webhook/program work. SQLite-only shortcuts are not valid for this story.

### References

- `epics.md` Epic 3 Story 3.3.
- `技术架构详细设计.md` §10 and §11.
- `UX设计规格说明.md` §7.
- `stories/3-1-program-domain-models-and-provisioning-inputs.md`.
- `stories/3-2-stripe-webhook-unlock-and-program-creation.md`.
- `stories/deferred-work.md`.
- `content/programs/_contract.json`.
- `content/exercises/_contract.json`.
- `content/faq/_contract.json`.
- `prisma/schema.prisma`.
- `src/lib/program/provisioning-service.ts`.
- `src/lib/billing/webhook-service.ts`.
- `src/app/(app)/onboarding/checkout/success/page.tsx`.
- `e2e/stripe-webhook.spec.ts`.
- `e2e/auth-shell.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 3.2 dev-story and lightweight code-review were completed and marked done.
- Recent git commit titles were not informative in this repository (`1`), so implementation guidance is based on current files and story records.
- No external library documentation was required for this story because no new third-party API surface is introduced; use existing `zod`, Prisma, Next.js server code, and Playwright patterns.
- Initial `pnpm test:e2e e2e/stripe-webhook.spec.ts` failed because template-first `ProgramDay` writes exceeded Prisma's default interactive transaction timeout against the current remote Postgres path. Fixed by preparing template content outside the transaction and setting a 30s timeout for the short write transaction.
- Initial `pnpm test:e2e e2e/auth-shell.spec.ts` failed because the dev-mock success navigation exceeded the default 10s URL assertion window after writing larger template content. Fixed the focused assertion timeout while keeping the user-facing flow unchanged.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 3.3 must replace Story 3.2 placeholder program content with template-first, rule-based, validated content while preserving webhook/dev-mock unlock behavior.
- The story deliberately freezes AI/RAG/Day UI out of scope so the next dev pass only creates safe structured program data.
- Added `finger-v1` 14-day template content, minimal exercise metadata, and FAQ content under `content/`.
- Added `src/lib/program/program-content.ts` with runtime JSON loading, `_contract.json` exclusion, `zod` validation, slug reference checks, deterministic template selection, and display-ready `ProgramDay.contentJson` generation.
- Updated provisioning so webhook and dev-mock unlocks write `finger-v1` template content, backfill existing placeholder programs idempotently, and preserve `completionPercent` / `completedAt`.
- Extended focused Playwright coverage for loader validation, unresolved references, Stripe webhook template content, placeholder backfill, and dev-mock template content.
- Validation passed: `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e e2e/stripe-webhook.spec.ts`, and `pnpm test:e2e e2e/auth-shell.spec.ts`.
- Code review patch completed: ProgramDay writes now upsert by `[programId, dayIndex]` and remove invalid non-template days, safety notes always include clinician-escalation language, exercise bodyPart references are validated, and tests cover missing FAQ refs plus invalid extra placeholder days.
- Review patch validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e e2e/stripe-webhook.spec.ts`, and `pnpm test:e2e e2e/auth-shell.spec.ts`.

### File List

- `stories/3-3-template-first-program-generation.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
- `content/programs/finger-v1.json`
- `content/exercises/finger-basic-v1.json`
- `content/faq/finger-basic-v1.json`
- `src/lib/program/program-content.ts`
- `src/lib/program/provisioning-service.ts`
- `src/lib/billing/webhook-service.ts`
- `e2e/stripe-webhook.spec.ts`
- `e2e/auth-shell.spec.ts`

### Change Log

- 2026-05-02: Implemented template-first program generation and moved Story 3.3 to code-review.
- 2026-05-02: Completed lightweight code review patches and moved Story 3.3 to done.
