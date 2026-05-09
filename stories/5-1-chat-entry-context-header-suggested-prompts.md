# Story 5.1: Chat Entry, Context Header, and Suggested Prompts

Status: done

<!-- Note: Created by bmad-create-story after Epic 4 was completed and Story 4.4 was marked done. -->

## Story

As a user with immediate recovery concerns,
I want to enter chat with relevant context already visible,
so that I can ask focused questions without re-explaining everything.

## Acceptance Criteria

1. **AC1 - Protected chat entry**
   **Given** a visitor opens `/chat`
   **When** they are unauthenticated
   **Then** they are redirected to sign in with a `/chat` callback.

2. **AC2 - Paid program context is required**
   **Given** a logged-in user opens `/chat`
   **When** they do not have a paid active or completed program context
   **Then** the route follows the existing safe program-entry fallbacks (`/onboarding` or `/progress`) instead of showing an empty AI surface.

3. **AC3 - Chat page uses approved 4-section structure**
   **Given** a paid user with a valid program opens `/chat`
   **When** the page loads
   **Then** the UI renders exactly the first-version chat shell sections: Context Header, Suggested Prompts, Chat Stream fresh state, and Input Area.

4. **AC4 - Context header shows recovery context**
   **Given** a paid user with `RecoveryProfile` and current program data
   **When** `/chat` renders
   **Then** the header shows body part, current day, remaining daily quota display, and a brief non-diagnostic disclaimer.

5. **AC5 - Fresh state suggested prompts**
   **Given** the user has no prior messages displayed in this story
   **When** the fresh chat state is shown
   **Then** the page offers 3-5 suggested prompts that are relevant to the current recovery context and not open-ended companionship prompts.

6. **AC6 - Suggested prompts fill input only**
   **Given** the user clicks a suggested prompt
   **When** the click is handled
   **Then** the prompt text fills the chat input
   **And** the prompt is not sent automatically
   **And** no chat backend/API call is made.

7. **AC7 - Input area is present but sending is not implemented**
   **Given** Story 5.2 owns streaming AI answers
   **When** Story 5.1 renders the input area
   **Then** it may show a disabled or non-submitting send action with copy that answers arrive in the next story
   **And** it must not call LLM providers, create chat messages, create conversations, retrieve knowledge chunks, or stream responses.

8. **AC8 - Day page has a clear chat entry**
   **Given** a paid user is viewing a valid Day page
   **When** the Day page renders
   **Then** there is a clear `Ask AI about today` entry point to `/chat`
   **And** adding this entry must not disturb Day completion controls, locked/review behavior, or missing-content fallbacks from Epic 4.

9. **AC9 - Scope stays limited to the chat shell**
   **Given** later Epic 5 stories own answer generation, RAG, danger escalation, provider fallback, quota enforcement, and network retry behavior
   **When** Story 5.1 is implemented
   **Then** it must not add provider SDKs, API streaming routes, vector search, Redis/Upstash quota enforcement, ChatConversation persistence, ChatMessage persistence, danger keyword evaluation, citations, analytics events, new Prisma schema changes, or new dependencies.

10. **AC10 - Focused regression coverage**
   **Given** this story adds a new protected app page and a Day-page entry point
   **When** implementation is complete
   **Then** tests cover unauthenticated `/chat` redirect, missing program fallback, valid paid-user chat shell, context header content, 3-5 suggested prompts, prompt-click input fill without send, Day-page chat entry link, and preservation of existing program-entry/Day happy paths
   **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright coverage pass.

## Tasks / Subtasks

- [x] **T1 - Add protected Chat page route** (AC: 1, 2, 3, 4)
  - [x] 1.1 Create `src/app/(app)/chat/page.tsx` as a Server Component with `dynamic = "force-dynamic"`.
  - [x] 1.2 Use `getAuthSession()` and redirect unauthenticated users to `/sign-in?callbackUrl=%2Fchat`.
  - [x] 1.3 Resolve current program with `resolveCurrentProgramForUser(session.user.id)`.
  - [x] 1.4 Redirect `no_purchase` and `missing_profile` to `/onboarding`.
  - [x] 1.5 Redirect `missing_day_content` to `/progress`.
  - [x] 1.6 Render the 4-section chat shell for `ready` and `missing_program_recovered` states only.

- [x] **T2 - Load safe chat context** (AC: 4, 9)
  - [x] 2.1 Read the user's `RecoveryProfile` body-part context on the server.
  - [x] 2.2 Display body part and subtype using user-safe labels; do not expose raw notes or full `riskFlagsJson`.
  - [x] 2.3 Display current day from `CurrentProgramEntry.currentDay` and `totalDays`.
  - [x] 2.4 Display a remaining quota placeholder based on the architecture limit of 20 daily messages, clearly scoped as the first-version display until Story 5.4 implements enforcement.
  - [x] 2.5 Keep session payload small; do not add large program/profile state to NextAuth JWT/session.

- [x] **T3 - Build client chat shell interactions** (AC: 3, 5, 6, 7)
  - [x] 3.1 Add a small client component under `src/components/chat/` for suggested prompts and input state.
  - [x] 3.2 Render 3-5 suggested prompts tailored to current body part/day in a deterministic way.
  - [x] 3.3 Clicking a suggested prompt fills the textarea/input but does not submit.
  - [x] 3.4 Render fresh chat stream copy that sets expectations without pretending there are stored messages.
  - [x] 3.5 Render send action as disabled or non-submitting with explanatory copy that answers arrive in Story 5.2.
  - [x] 3.6 Add stable test ids such as `chat-context-header`, `chat-suggested-prompts`, `chat-stream-fresh`, and `chat-input`.

- [x] **T4 - Add Day page chat entry** (AC: 8)
  - [x] 4.1 Add an `Ask AI about today` link to `/chat` on valid Day pages using existing `Button`/`Link` patterns.
  - [x] 4.2 Keep locked, review, completed-review, and missing-content states free from unusable completion controls.
  - [x] 4.3 Do not wire query params or hidden send behavior unless the existing routing pattern makes it clearly safer.

- [x] **T5 - Add focused E2E coverage and validation** (AC: 10)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` or add a focused chat-entry spec if cleaner.
  - [x] 5.2 Cover unauthenticated `/chat` redirect to sign-in.
  - [x] 5.3 Cover authenticated no-purchase or missing-program fallback.
  - [x] 5.4 Cover paid user `/chat` shell with header body part, current day, quota display, disclaimer, suggested prompts, fresh state, and input.
  - [x] 5.5 Cover clicking a prompt fills input without sending or creating messages.
  - [x] 5.6 Cover Day page `Ask AI about today` link reaches `/chat`.
  - [x] 5.7 Re-run core program-entry/Day regressions that could be affected by the new link.
  - [x] 5.8 Run `pnpm typecheck`.
  - [x] 5.9 Run `pnpm lint`.
  - [x] 5.10 Run focused Playwright tests.

## Dev Notes

### Product and UX Intent

- Epic 5 starts the AI support surface, but Story 5.1 is only the entry shell.
- The Chat page is an anxiety-reduction page, not a general-purpose AI companion.
- The page should answer the user's first concern: "What context does the assistant already know, and what can I ask safely?"
- Suggested prompts should narrow the user's question, not invite open-ended companionship or medical diagnosis.
- The disclaimer must remain visible and plain: educational recovery support only, not diagnosis, not a replacement for clinician instructions.

### Current Baseline From Prior Epics

- Auth uses NextAuth v4 through `getAuthSession()`.
- Paid program access uses `resolveCurrentProgramForUser(userId)`.
- `/progress` and `/day/[day]` already implement the safe entry/fallback behavior for no purchase, missing profile, missing program recovery, and missing day content.
- Day pages already expose safety copy, current day, program stage, focus, completion controls, locked state, read-only review state, and missing-content state.
- Story 4.4 completed Epic 4 and added:
  - explicit Day modes: `current`, `locked`, `review`, `completed-review`
  - `loadProgramDayForProgram()` for past-day review
  - missing-content support fallback and safe logs
  - stable day completion behavior with short batch transaction.

### Required Chat Shape

Use the approved UX 4-section structure:

1. Context Header
   - body part
   - subtype if safe and available
   - current day out of 14
   - remaining quota display
   - short disclaimer
2. Suggested Prompts
   - 3-5 prompts
   - buttons or cards
   - click fills input only
3. Chat Stream
   - fresh state only in this story
   - no stored messages required yet
4. Input Area
   - textarea/input
   - send button disabled or non-submitting
   - brief disclaimer/quota note

### Data and Access Requirements

- `RecoveryProfile` fields available in Prisma:
  - `bodyPart`
  - `subType`
  - `painLevel`
  - `dominantHandAffected`
  - `jobType`
  - `riskFlagsJson`
  - `notes`
- For Story 5.1, use only low-risk display fields:
  - `bodyPart`
  - `subType`
  - optionally `painLevel` only if the copy remains non-diagnostic
- Do not display `notes` or full `riskFlagsJson`.
- `Program.currentDay`, `Program.totalDays`, and `currentProgramDay` come from `CurrentProgramEntry`.
- Do not create `ChatConversation` or `ChatMessage` rows in this story even though the schema exists.

### Quota Guidance

- Architecture says the daily AI chat limit is 20 per user.
- Story 5.4 owns real quota enforcement with Upstash Redis.
- Story 5.1 can display a first-version quota label such as `20 questions left today` or `Daily limit: 20 questions`.
- Do not decrement quota locally.
- Do not add Upstash/Redis dependency.

### Suggested Prompt Guidance

Prompts should be deterministic and safe. Examples the dev agent can adapt:

- `Is this level of stiffness expected for Day {currentDay}?`
- `What symptoms today would mean I should contact a clinician?`
- `How should I think about swelling after today's exercises?`
- `Can I keep going if the movement feels tight but not painful?`
- `What should I avoid during today's recovery work?`

Rules:

- 3-5 prompts only.
- No diagnosis wording.
- No "tell me anything" open-ended prompt.
- No prompt should imply the AI can override clinician instructions.
- Clicking a prompt fills the input and leaves the user in control.

### Recommended Implementation Approach

- Add `src/app/(app)/chat/page.tsx`.
- Add `src/components/chat/chat-entry-shell.tsx` or similarly named client component.
- Keep server-only data loading in the page.
- Pass only a small serializable context object to the client component.
- Reuse existing `Button`, `Link`, Tailwind/card styling, and mobile-first layout patterns.
- If a helper is needed to read `RecoveryProfile`, keep it small and local unless it clearly belongs in `src/lib/program/` or a new `src/lib/chat/` module.
- Prefer test ids:
  - `chat-context-header`
  - `chat-suggested-prompts`
  - `chat-suggested-prompt`
  - `chat-stream-fresh`
  - `chat-input`
  - `chat-send-disabled`

### Testing Requirements

- Existing Playwright helper patterns in `e2e/program-entry.spec.ts` are reusable:
  - `seedDevUser`
  - `seedRecoveryProfile`
  - `seedPaidPurchaseAndProgram`
  - `signInAs`
- Add tests that assert:
  - unauthenticated `/chat` redirects to `/sign-in?callbackUrl=%2Fchat`
  - no-purchase users do not see chat shell
  - paid users see context header with body part/current day/quota/disclaimer
  - 3-5 suggested prompt buttons render
  - prompt click fills `chat-input`
  - clicking prompt does not auto-create a chat message or navigate
  - Day page exposes `Ask AI about today` and the link reaches `/chat`
- Validation commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - focused `pnpm test:e2e ... --project="Desktop Chrome"` for the changed coverage.

### Previous Story Intelligence

- Story 4.4 completed after a light review with no blocking findings.
- Story 4.4 E2E currently has 19/19 passing tests and includes protected Day/program-entry regression coverage.
- Prior E2E failures came from slow/flaky interactive Prisma transactions; keep tests focused and avoid unnecessary long browser flows.
- Keep new chat shell tests lightweight because they do not need LLM/provider/network behavior.

### Scope Boundaries

Do not implement in Story 5.1:

- `POST /api/chat`
- streaming responses
- Gemini/Groq provider calls
- RAG/vector retrieval
- `KnowledgeChunk` querying
- citations UI beyond placeholder/fresh-state copy
- danger keyword evaluation or escalation banners
- Redis/Upstash quota enforcement
- ChatConversation or ChatMessage persistence
- analytics events
- new dependencies
- Prisma schema changes
- completion reports, PDFs, sharing, billing/refund, i18n, or native app work.

### Likely Files to Add or Modify

- `src/app/(app)/chat/page.tsx`
- `src/components/chat/chat-entry-shell.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `e2e/program-entry.spec.ts` or a focused `e2e/chat-entry.spec.ts`
- `stories/5-1-chat-entry-context-header-suggested-prompts.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not be changed unless a narrow compile issue forces it:

- `prisma/schema.prisma`
- provider / RAG / vector retrieval modules
- Stripe checkout/webhook code
- Program content JSON files

### References

- `epics.md` Epic 5 Story 5.1.
- `UX设计规格说明.md` §8 Chat page spec.
- `技术架构详细设计.md` §9.3 AI Chat, §11 AI/RAG/Safety, §12 Auth and Access Control.
- `stories/4-4-locked-review-and-missing-content-states.md`.
- `src/app/(app)/day/[day]/page.tsx`.
- `src/app/(app)/progress/page.tsx`.
- `src/lib/program/current-program-service.ts`.
- `prisma/schema.prisma`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Epic 4 was completed and Story 4.4 was implemented, lightly reviewed, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded via small exact reads after broad search was too slow: `epics.md`, `UX设计规格说明.md`, `技术架构详细设计.md`, Story 4.4, Day/Progress pages, current program service, auth session helper, Prisma schema, package dependencies, and existing Button component.

### Completion Notes List

- Story 5.1 should create the protected Chat shell and Day entry point only.
- The story deliberately excludes streaming, RAG, provider calls, persisted chat history, danger escalation, real quota enforcement, analytics, schema changes, and new dependencies.
- The dev agent should reuse current auth/program-entry patterns and preserve all Epic 4 Day behavior.
- Implemented protected `/chat` Server Component with auth, current-program fallback handling, safe `RecoveryProfile` context selection, and no session/JWT expansion.
- Added `src/components/chat/chat-entry-shell.tsx` client component with Context Header, Suggested Prompts, Fresh Chat Stream, and disabled/non-submitting Input Area.
- Added deterministic 5-prompt set where clicks fill `chat-input` without sending or calling `/api/chat`.
- Added `Ask AI about today` link from valid Day pages to `/chat`.
- Extended focused E2E coverage to 21 tests for protected chat entry, no-purchase fallback, paid-user chat shell, prompt fill behavior, Day-page chat entry, and existing program/day regressions.
- Validation passed on 2026-05-08: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 21/21 tests passing.
- Light code review completed on 2026-05-08. One prompt relevance polish was applied so suggested prompts include the current body part as well as the current day; validation passed again and story moved to done.

### File List

- `stories/5-1-chat-entry-context-header-suggested-prompts.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
- `src/app/(app)/chat/page.tsx`
- `src/components/chat/chat-entry-shell.tsx`
- `src/app/(app)/day/[day]/page.tsx`
- `e2e/program-entry.spec.ts`

### Change Log

- 2026-05-07: Created Story 5.1 with protected chat shell, context header, suggested prompt fill behavior, Day-page entry point, scope boundaries, and focused regression-test guidance; story marked ready-for-dev.
- 2026-05-08: Implemented Story 5.1 protected chat shell, suggested-prompt input fill behavior, Day-page chat entry, and focused E2E coverage; story moved to code-review.
- 2026-05-08: Completed light code review prompt-relevance patch; focused validation passed and story moved to done.

### Senior Developer Review (AI)

Outcome: Approved after patch

Findings:

- Low: Suggested prompts were deterministic and day-aware, but not explicitly body-part-aware despite AC5 requiring relevance to the current recovery context. Patched `src/app/(app)/chat/page.tsx` so the first prompt includes the formatted body part, and extended E2E to assert `finger stiffness expected for Day 5`.

Residual Risk:

- Story 5.1 intentionally uses a static `20 questions left today` quota display. Real quota enforcement remains Story 5.4.
- Story 5.1 intentionally does not create chat conversations/messages, stream answers, or call providers. Those remain Story 5.2+ responsibilities.

Validation:

- 2026-05-08: `pnpm typecheck` passed.
- 2026-05-08: `pnpm lint` passed.
- 2026-05-08: `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` passed with 21/21 tests.
