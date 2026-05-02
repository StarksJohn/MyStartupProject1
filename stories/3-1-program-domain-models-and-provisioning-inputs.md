# Story 3.1: Program Domain Models and Provisioning Inputs

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paid user,
I want my purchase and recovery profile to map to a real program instance,
so that the product can deliver my plan consistently across sessions.

## Acceptance Criteria

1. **AC1 - Prisma domain models are frozen for Epic 3**
   **Given** Epic 2 has completed identity, eligibility, recovery profile, and checkout session creation
   **When** Story 3.1 updates the data layer
   **Then** `prisma/schema.prisma` includes the approved domain models: `Purchase`, `Program`, `ProgramDay`, `ChatConversation`, `ChatMessage`, `KnowledgeDocument`, and `KnowledgeChunk`
   **And** existing `User`, `Account`, `Session`, `VerificationToken`, and `RecoveryProfile` behavior remains compatible with Stories 2.1-2.4.

2. **AC2 - Purchase to Program linkage is idempotent by schema design**
   **Given** Story 3.2 will process Stripe webhooks
   **When** the new schema is inspected
   **Then** `Purchase` has unique constraints for Stripe checkout/payment identifiers
   **And** `Program.purchaseId` is unique so one paid purchase can provision at most one program
   **And** relations make it possible for webhook processing to safely find or create the same `Purchase` / `Program` without duplicate records.

3. **AC3 - Program and ProgramDay support a 14-day template-first plan**
   **Given** a user has a `RecoveryProfile` and a paid `Purchase`
   **When** a future story creates a program
   **Then** `Program` can store `userId`, `recoveryProfileId`, `purchaseId`, `templateVersion`, `startDate`, `endDate`, `currentDay`, `status`, and `generatedSummaryJson`
   **And** `ProgramDay` can store one row per day with `dayIndex`, `stage`, `contentJson`, `estimatedMinutes`, `completedAt`, and `completionPercent`
   **And** schema constraints/indexes prevent duplicate day rows for the same program/day.

4. **AC4 - Knowledge and chat models are prepared without implementing AI runtime**
   **Given** Epic 5 will implement RAG chat later
   **When** Story 3.1 adds knowledge/chat models
   **Then** `KnowledgeDocument` and `KnowledgeChunk` represent source documents and chunks for AAOS, NHS, GUZHE, and FAQ content
   **And** `KnowledgeChunk.embedding` uses PostgreSQL pgvector via Prisma `Unsupported("vector(1536)")`
   **And** `ChatConversation` / `ChatMessage` can later store program-scoped conversation history, citations, provider/model metadata, escalation state, and token usage
   **And** no AI provider calls, embeddings generation, retrieval logic, chat API, or Upstash quota logic is implemented in this story.

5. **AC5 - Content input structure is frozen as implementation contract**
   **Given** program generation is template-first
   **When** Story 3.1 lands
   **Then** the repository recognizes `content/programs`, `content/faq`, `content/blog`, and `content/exercises` as the canonical content inputs
   **And** each directory has a documented expected shape or starter placeholder that future stories can fill without inventing a new content layout
   **And** the structure does not introduce a CMS, remote content service, or admin editor.

6. **AC6 - pgvector strategy is explicit and Postgres-first**
   **Given** RAG and webhook/schema validation must match production
   **When** developers read the story and implementation notes
   **Then** the story documents that Supabase Postgres is the canonical dev/prod database for this work
   **And** pgvector requires `CREATE EXTENSION IF NOT EXISTS vector;` before vector columns can be used
   **And** Prisma `Unsupported` fields are treated as raw-SQL-only for vector reads/writes in future stories.

7. **AC7 - Session purchase fields remain unchanged until webhook unlock**
   **Given** Story 2.1 currently exposes `session.user.hasPurchase` and `session.user.activeProgramId` as defaults
   **When** Story 3.1 adds database models
   **Then** it does not change NextAuth callbacks to derive real purchase/program session state yet
   **And** `hasPurchase` and `activeProgramId` remain backed by defaults until Story 3.2 connects webhook unlock and session resolution.

8. **AC8 - Story 3.1 does not implement downstream behavior**
   **Given** later Epic 3 stories own provisioning and retrieval
   **When** Story 3.1 is implemented
   **Then** it does not add `POST /api/stripe/webhook`, does not verify Stripe signatures, does not create purchases from webhook events, does not generate programs, does not redirect users to Day 1, and does not implement Day UI or Chat UI
   **And** it does not add Gemini, Groq, Upstash, analytics, video hosting, PDF generation, billing portal, refund handling, subscription logic, i18n, or native app work.

9. **AC9 - Validation protects existing conversion flow**
   **Given** Epic 2 conversion flow is green
   **When** Story 3.1 updates schema and content inputs
   **Then** `pnpm db:generate`, `pnpm typecheck`, and `pnpm lint` pass
   **And** focused `pnpm test:e2e e2e/auth-shell.spec.ts` still passes unless explicitly blocked by unavailable local database connectivity
   **And** if database schema application cannot run from the shell, the story records the exact blocker and the Supabase SQL/manual application path used.

## Tasks / Subtasks

- [x] **T1 - Freeze Prisma domain model contract** (AC: 1, 2, 3, 4, 6, 7)
  - [x] 1.1 Update `prisma/schema.prisma` by adding `PurchaseStatus`, `ProgramStatus`, `ChatConversationStatus`, `ChatMessageRole`, and `KnowledgeSourceType` enums.
  - [x] 1.2 Add `Purchase` with `userId`, `stripeCheckoutSessionId`, `stripePaymentIntentId`, `stripeCustomerId`, `amount`, `currency`, `status`, `paidAt`, `refundedAt`, `createdAt`, `updatedAt`.
  - [x] 1.3 Add uniqueness/idempotency constraints: `stripeCheckoutSessionId` unique, optional `stripePaymentIntentId` unique when present, and `Program.purchaseId` unique.
  - [x] 1.4 Add `Program` related to `User`, `RecoveryProfile`, and `Purchase`, with fields from AC3.
  - [x] 1.5 Add `ProgramDay` related to `Program`, with unique `[programId, dayIndex]`.
  - [x] 1.6 Add `ChatConversation`, `ChatMessage`, `KnowledgeDocument`, and `KnowledgeChunk`.
  - [x] 1.7 Add relation arrays to `User`, `RecoveryProfile`, `Purchase`, `Program`, and `KnowledgeDocument` as needed without breaking current auth/profile code.

- [x] **T2 - Define pgvector and raw SQL boundary** (AC: 4, 6)
  - [x] 2.1 Represent `KnowledgeChunk.embedding` as `Unsupported("vector(1536)")?`, not a required field, so Prisma Client can still create non-vector chunk metadata.
  - [x] 2.2 Add comments near the field explaining that future embedding read/write uses `$executeRaw` / `$queryRaw`.
  - [x] 2.3 Document the required Supabase/Postgres extension command: `CREATE EXTENSION IF NOT EXISTS vector;`.
  - [x] 2.4 Do not add embedding-generation scripts, model provider keys, or vector search code in this story.

- [x] **T3 - Freeze content input directories** (AC: 5)
  - [x] 3.1 Add `content/programs/` as the canonical source for 14-day program templates.
  - [x] 3.2 Add `content/exercises/` as the canonical source for exercise/video metadata.
  - [x] 3.3 Add `content/faq/` as the canonical source for product/recovery FAQ and later RAG FAQ chunks.
  - [x] 3.4 Recognize existing `src/lib/content/blog.ts` as the current public blog source, and only add `content/blog/` if the implementation chooses to freeze future source content outside `src/lib`.
  - [x] 3.5 Add concise shape documentation or starter placeholder files; do not add full 14-day medical content in this story.

- [x] **T4 - Keep Epic 2 runtime behavior unchanged** (AC: 7, 8, 9)
  - [x] 4.1 Do not change `src/lib/auth/options.ts` session callbacks to query `Purchase` or `Program`.
  - [x] 4.2 Do not change `src/app/api/checkout/route.ts` or `src/lib/billing/purchase-service.ts` except for narrow type/import fixes caused by schema generation.
  - [x] 4.3 Do not change onboarding UI, checkout success/cancelled pages, or existing auth/profile APIs unless a schema compile error requires a narrow fix.
  - [x] 4.4 Preserve Story 2.4 dev-mock checkout fallback.

- [x] **T5 - Validate schema and regression surface** (AC: 9)
  - [x] 5.1 Run `pnpm db:generate`.
  - [x] 5.2 Run `pnpm typecheck`.
  - [x] 5.3 Run `pnpm lint`.
  - [x] 5.4 Run focused `pnpm test:e2e e2e/auth-shell.spec.ts` if database connectivity is available.
  - [x] 5.5 If applying schema to Supabase is needed, document whether it was done through Prisma CLI, Supabase SQL Editor, or deferred with a clear blocker.

### Review Findings

- [x] [Review][Patch] Program and chat ownership were not database-enforced — fixed with composite ownership constraints across `Program` -> `Purchase` / `RecoveryProfile` and `ChatConversation` -> `Program`.
- [x] [Review][Patch] User deletion could conflict with `Program` restrict relations — fixed by aligning `Program` upstream relations to cascade with user-owned data.
- [x] [Review][Patch] `KnowledgeDocument` unique key was too narrow — fixed by changing uniqueness to `[sourceType, slug, version]`.
- [x] [Review][Patch] `prisma/schema.prisma` header still described Story 2.1-only baseline — fixed to describe the Story 3.1 domain-model baseline and pgvector raw-SQL boundary.
- [x] [Review][Patch] `项目主档案.md` still contained stale Story 2.4 review and subscription wording — fixed to reflect Story 3.1 review and one-time purchase positioning.
- [x] [Review][Defer] Durable Stripe event idempotency table — deferred to Story 3.2 webhook implementation.
- [x] [Review][Defer] Program numeric/date check constraints and active-program service guards — deferred to Story 3.2/3.3 provisioning and program-generation services.
- [x] [Review][Defer] Executable pgvector extension migration/preflight — deferred until the first database migration/schema-application step.
- [x] [Review][Defer] Runtime content validation and `_contract.json` loader exclusion — deferred until content loaders are introduced.

## Dev Notes

### Product and Architecture Intent

- Epic 3 starts the post-payment product experience. Story 3.1 is a foundation story: freeze the data model and content inputs before implementing webhook unlock, program generation, Day UI, or chat.
- The Epic 2 retrospective identified the key risk: **do not start Epic 3 by writing code into a vague schema**. This story exists to remove that ambiguity.
- Source requirements:
  - `epics.md` Epic 3 Story 3.1, FR5, NFR8, Additional Requirements for `User / Account / Session / VerificationToken / RecoveryProfile / Purchase / Program / ProgramDay / ChatMessage / KnowledgeChunk`.
  - `技术架构详细设计.md` §8.2 model list, §8.3 Postgres-first database strategy, §9.1 provisioning flow, §10 template-first generation, §11 RAG/Safety, §13 payment, §14 testing.
  - `UX设计规格说明.md` §10 frozen inputs: data-level and content-level contracts.
  - `stories/epic-2-retro-2026-04-29.md` preparation items for Story 3.1.

### Current Real Code Baseline

- `stories/sprint-status.yaml` marks `epic-2: done`, `epic-2-retrospective: done`, and `3-1-program-domain-models-and-provisioning-inputs: backlog` before this story is created.
- `prisma/schema.prisma` currently contains:
  - NextAuth-compatible `User`, `Account`, `Session`, `VerificationToken`
  - `RecoveryProfile`
  - no `Purchase`, `Program`, `ProgramDay`, `ChatConversation`, `ChatMessage`, `KnowledgeDocument`, or `KnowledgeChunk`
- `User` currently has `recoveryProfile RecoveryProfile?`; Story 3.1 should extend it with relation arrays for purchases/programs/conversations without changing existing auth behavior.
- `src/lib/auth/options.ts` currently keeps `hasPurchase` and `activeProgramId` as JWT/session defaults. Do not wire them to real database state in this story.
- `src/app/api/checkout/route.ts` verifies a `RecoveryProfile` and calls `createCheckoutSession(...)`; it does not write `Purchase`.
- `src/lib/billing/purchase-service.ts` creates Stripe Checkout sessions with `mode: "payment"`, fixed `$14.99`, and dev-mock fallback when `STRIPE_SECRET_KEY` is absent.
- `content/` does not currently exist. Public blog content currently lives in `src/lib/content/blog.ts`.

### Recommended Prisma Contract

Use these names unless implementation discovers a direct compile/schema issue:

- `enum PurchaseStatus { PENDING PAID FAILED REFUNDED }`
- `enum ProgramStatus { ACTIVE COMPLETED EXPIRED }`
- `enum ChatConversationStatus { ACTIVE ARCHIVED }`
- `enum ChatMessageRole { USER ASSISTANT SYSTEM }`
- `enum KnowledgeSourceType { AAOS NHS GUZHE FAQ BLOG }`

Recommended relation invariants:

- `User` -> many `Purchase`
- `User` -> many `Program`
- `User` -> many `ChatConversation`
- `RecoveryProfile` -> many `Program`
- `Purchase` -> optional one `Program` through `Program.purchaseId @unique`
- `Program` -> many `ProgramDay`
- `Program` -> many `ChatConversation`
- `KnowledgeDocument` -> many `KnowledgeChunk`

Recommended idempotency constraints:

- `Purchase.stripeCheckoutSessionId @unique`
- `Purchase.stripePaymentIntentId @unique` if non-null; keep it optional because some local/dev states may not have a real payment intent yet.
- `Program.purchaseId @unique`
- `ProgramDay @@unique([programId, dayIndex])`
- `KnowledgeChunk @@unique([documentId, chunkIndex])`

Recommended indexes:

- `Purchase`: `@@index([userId])`, `@@index([status])`
- `Program`: `@@index([userId])`, `@@index([status])`, `@@index([currentDay])`
- `ProgramDay`: `@@index([programId])`, `@@index([stage])`
- `ChatConversation`: `@@index([userId])`, `@@index([programId])`
- `ChatMessage`: `@@index([conversationId])`, `@@index([createdAt])`, `@@index([escalated])`
- `KnowledgeDocument`: `@@index([sourceType])`, `@@unique([sourceType, slug, version])`
- `KnowledgeChunk`: `@@index([documentId])`

### pgvector and Prisma `Unsupported` Notes

- Current stack uses Prisma `^6.19.0` and `@prisma/client ^6.19.0`.
- Context7 Prisma docs checked on 2026-05-01 confirm:
  - pgvector/custom PostgreSQL types can be represented as `Unsupported("vector")` or a sized variant such as `Unsupported("vector(1536)")`.
  - `Unsupported` fields are not first-class Prisma Client fields; required `Unsupported` fields can restrict `create`, `update`, and `upsert`.
  - Use optional `Unsupported("vector(1536)")?` for `KnowledgeChunk.embedding` in this story so non-vector chunk metadata remains Prisma-writeable.
  - Future vector writes/search should use raw SQL (`$executeRaw` / `$queryRaw`) or a dedicated helper; do not pretend Prisma Client can perform vector similarity queries directly.
- Supabase/Postgres must have pgvector enabled before vector columns work:
  - `CREATE EXTENSION IF NOT EXISTS vector;`

### Content Input Contract

Freeze directory names now; full content is not required in this story.

Recommended starter contract:

- `content/programs/`
  - Holds versioned 14-day program templates.
  - Suggested future file shape: `finger-v1.json`, `metacarpal-v1.json`, or a single `hand-v1.json` with body-part variants.
  - Must include template version, body part, stages, 14 days, exercise references, safety notes, and FAQ references.
- `content/exercises/`
  - Holds exercise/video metadata.
  - Must avoid claims of diagnosis or medical clearance.
  - Future entries should include slug, title, body part, stage, instructions, contraindications, duration/reps, video URL, thumbnail URL.
- `content/faq/`
  - Holds manually curated FAQ used by Day/Chat/RAG.
  - Future entries should include source, body part, phase, risk level, question, answer, and escalation flag.
- `content/blog/`
  - Existing public blog source is `src/lib/content/blog.ts`.
  - If this story adds `content/blog/`, document whether it is future source-of-truth or just a placeholder. Do not duplicate existing blog runtime unless the dev updates the content loader intentionally.

### Implementation Boundaries

Do not implement in Story 3.1:

- Stripe webhook route or signature verification
- `STRIPE_WEBHOOK_SECRET`
- Purchase writes from Stripe events
- Program creation/provisioning service
- Template mapping or LLM micro-adjustment
- Active-program lookup API
- Day page, completion endpoint, or progress UI
- AI chat API, embeddings generation, vector search, Upstash rate limiting
- Gemini/Groq env variables or dependencies
- Analytics events
- Refund handling, billing portal, subscriptions, invoices, tax logic

### Environment and Database Notes

- Continue the architecture decision that real persistence work uses Supabase Postgres, not SQLite.
- `DATABASE_URL` is currently required and already validated.
- Architecture mentions `DIRECT_URL`, but the current Prisma schema does not use it. Only add `DIRECT_URL` if the implementation also adds a clear Prisma datasource need and updates `.env.example` / `scripts/verify-env.ts` consistently.
- Story 2.3 previously needed Supabase SQL Editor because direct Prisma schema application was blocked by local DB connectivity. If that happens again, record the exact command/error and the SQL path used.

### Testing Requirements

Minimum validation after implementation:

- `pnpm db:generate`
- `pnpm typecheck`
- `pnpm lint`
- focused `pnpm test:e2e e2e/auth-shell.spec.ts` if database connectivity is available

Do not add a new test runner just for this story. If schema-only validation is the main deliverable, `db:generate` + TypeScript + existing focused E2E are sufficient.

### Project Structure Notes

Files expected to change or be created:

- `prisma/schema.prisma`
- `content/programs/**`
- `content/exercises/**`
- `content/faq/**`
- optionally `content/blog/**` if used only to freeze future content inputs
- `stories/3-1-program-domain-models-and-provisioning-inputs.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files expected to remain unchanged unless a narrow compile/schema issue requires otherwise:

- `src/lib/auth/options.ts`
- `src/types/next-auth.d.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/checkout/route.ts`
- `src/lib/billing/purchase-service.ts`
- `src/app/(app)/onboarding/**`
- `src/components/onboarding/**`
- `e2e/auth-shell.spec.ts`

### Previous Story Intelligence

- Epic 2 succeeded because each story strictly avoided future scope. Preserve that discipline.
- Story 2.3 proved Postgres parity matters. Treat Supabase/Postgres as canonical for schema validation.
- Story 2.4 left checkout success honest: it says plan unlock is later. Story 3.1 still does not make the plan ready.
- Keep Story 2.4 dev-mock checkout fallback until Story 3.2 has real webhook unlock coverage.
- Do not derive `hasPurchase` / `activeProgramId` from new models until Story 3.2.

### References

- `epics.md` Epic 3 Story 3.1 and FR5 / NFR8.
- `技术架构详细设计.md` §8.2, §8.3, §9.1, §10, §11, §13, §14.
- `UX设计规格说明.md` §10 frozen inputs.
- `stories/epic-2-retro-2026-04-29.md` preparation findings.
- `stories/2-4-personalized-summary-one-time-checkout.md` boundaries for webhook / Purchase / Program deferral.
- `prisma/schema.prisma` current auth + RecoveryProfile baseline.
- `src/app/api/checkout/route.ts` current checkout read-side profile check.
- `src/lib/billing/purchase-service.ts` current Stripe Checkout session creation.

## Change Log

- 2026-05-01: Implemented Story 3.1 schema/content contract freeze and moved story to code-review.
- 2026-05-01: Addressed lightweight code-review patch findings and moved story to done.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created from Epic 3 backlog after Epic 2 retrospective.
- Context7 Prisma docs checked for `Unsupported("vector(1536)")` / pgvector limitations.
- 2026-05-01: Implemented Prisma domain models and content input contracts.
- 2026-05-01: Validation passed: `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/auth-shell.spec.ts` (30/30 passed).
- 2026-05-01: Review patch validation passed: `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, focused `pnpm test:e2e e2e/auth-shell.spec.ts` (30/30 passed).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 3.1 intentionally freezes data/content contracts before any webhook, program generation, Day UI, or AI work.
- Added `Purchase`, `Program`, `ProgramDay`, `ChatConversation`, `ChatMessage`, `KnowledgeDocument`, and `KnowledgeChunk` to Prisma with idempotency constraints and indexes.
- Added optional pgvector field `KnowledgeChunk.embedding Unsupported("vector(1536)")?` with raw-SQL and extension notes.
- Added JSON contract placeholders under `content/programs`, `content/exercises`, `content/faq`, and `content/blog`.
- Preserved Epic 2 runtime behavior: no auth callback, checkout route, onboarding UI, webhook, program generation, Day UI, or AI/RAG runtime changes.
- Lightweight code review found 5 patch items and 4 deferred follow-ups; all patch items were fixed and deferred items were logged in `stories/deferred-work.md`.

### File List

- `content/blog/_contract.json`
- `content/exercises/_contract.json`
- `content/faq/_contract.json`
- `content/programs/_contract.json`
- `prisma/schema.prisma`
- `stories/3-1-program-domain-models-and-provisioning-inputs.md`
- `stories/deferred-work.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
