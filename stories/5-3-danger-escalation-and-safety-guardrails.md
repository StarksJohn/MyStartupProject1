# Story 5.3: Danger Escalation and Safety Guardrails

Status: done

<!-- Note: Created by bmad-create-story after Story 5.2 was implemented, lightly reviewed, patched, validated, and marked done. -->

## Story

As a user describing potentially dangerous symptoms,
I want the system to stop giving ordinary guidance and tell me to seek medical help,
so that I am not misled by an unsafe AI response.

## Acceptance Criteria

1. **AC1 - Danger keyword detection runs before normal generation**
   **Given** a paid user submits a chat message
   **When** the message contains supported danger keywords or escalation patterns
   **Then** the chat backend detects escalation before RAG/provider generation
   **And** it does not call the normal provider answer path.

2. **AC2 - Escalated response is short, prominent, and non-diagnostic**
   **Given** a danger escalation is detected
   **When** the response is returned
   **Then** the answer tells the user to contact a clinician or seek urgent care as appropriate
   **And** it avoids exercise suggestions, diagnosis, reassurance, or ordinary recovery coaching.

3. **AC3 - Stream contract supports escalation state**
   **Given** the backend emits an escalated response
   **When** the client consumes the stream
   **Then** the stream includes an explicit escalation signal
   **And** the client can render a visually distinct danger state without inferring from plain answer text.

4. **AC4 - UI renders accessible warning block**
   **Given** a danger escalation response is shown in `/chat`
   **When** the user sees the chat stream
   **Then** the UI includes a prominent warning block
   **And** the block is screen-reader accessible with an appropriate role/label.

5. **AC5 - Persistence marks escalated interaction**
   **Given** a danger escalation occurs
   **When** messages are stored
   **Then** the assistant `ChatMessage.escalated` is `true`
   **And** the user message and assistant message remain linked to the active `ChatConversation`.

6. **AC6 - Non-danger messages still use Story 5.2 behavior**
   **Given** a normal recovery question is submitted
   **When** no escalation pattern matches
   **Then** the existing Story 5.2 streaming/RAG/citation/persistence behavior remains unchanged
   **And** `ChatMessage.escalated` remains `false`.

7. **AC7 - Detection avoids obvious false positives**
   **Given** a message mentions danger terms in a clearly negated way such as "no numbness" or "not severe pain"
   **When** the safety layer evaluates it
   **Then** it should not escalate solely because of the negated phrase
   **And** the normal answer path may proceed.

8. **AC8 - Scope stays limited to safety escalation**
   **Given** later stories own quota, provider fallback, and broader error recovery
   **When** Story 5.3 is implemented
   **Then** it must not implement quota enforcement, Upstash Redis, Groq fallback, analytics, new billing/support flows, or new Prisma schema changes.

9. **AC9 - Focused regression coverage**
   **Given** Story 5.3 changes the chat decision path
   **When** implementation is complete
   **Then** tests cover danger keyword escalation, negated danger phrase non-escalation, accessible warning UI, provider bypass for escalated input, `ChatMessage.escalated = true`, and Story 5.2 normal chat regressions
   **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright/API coverage pass.

## Tasks / Subtasks

- [x] **T1 - Add safety detection service** (AC: 1, 2, 7, 8)
  - [x] 1.1 Create a small `src/lib/chat/safety.ts` service or equivalent under existing `src/lib/chat/`.
  - [x] 1.2 Implement the minimum architecture keyword set: `severe pain`, `purple`, `blue`, `numb`, `fever`, `pus`, `cannot move`, `sudden swelling`.
  - [x] 1.3 Add simple phrase-level negation handling for obvious cases such as `no numbness`, `not numb`, `no severe pain`, `not severe pain`, and `no sudden swelling`.
  - [x] 1.4 Return structured safety result data, not only a boolean, so UI/persistence can use a stable escalation signal.
  - [x] 1.5 Keep detection deterministic and local; do not call AI providers to decide escalation in this story.

- [x] **T2 - Integrate escalation into `/api/chat`** (AC: 1, 2, 3, 5, 6)
  - [x] 2.1 Run safety detection after request validation and paid-program context resolution.
  - [x] 2.2 If escalation is detected, bypass `generateChatAnswer` and normal RAG/provider generation.
  - [x] 2.3 Emit a short escalated response through the existing NDJSON stream.
  - [x] 2.4 Add an explicit stream event or event field for escalation, e.g. `{ type: "escalation", ... }`.
  - [x] 2.5 Persist user and assistant messages in the active `ChatConversation`.
  - [x] 2.6 Store `ChatMessage.escalated = true` for the assistant message and `false` for the user message.
  - [x] 2.7 Preserve Story 5.2 normal path with `escalated = false`.

- [x] **T3 - Render accessible danger escalation UI** (AC: 3, 4)
  - [x] 3.1 Extend `ChatStreamEvent` types and `ChatEntryShell` stream handling for escalation.
  - [x] 3.2 Render a distinct warning block separate from normal citations.
  - [x] 3.3 Use accessible semantics, such as `role="alert"` and an explicit heading/label.
  - [x] 3.4 Ensure the escalated UI does not show normal exercise coaching copy as the primary guidance.
  - [x] 3.5 Preserve suggested prompt fill behavior and normal non-escalated chat rendering.

- [x] **T4 - Add focused tests and validation** (AC: 1, 4, 5, 6, 7, 9)
  - [x] 4.1 Add API/E2E coverage for a danger phrase such as `My finger is blue and numb`.
  - [x] 4.2 Assert normal provider/RAG answer path is bypassed for escalated input.
  - [x] 4.3 Assert warning UI is visible and accessible.
  - [x] 4.4 Assert assistant `ChatMessage.escalated` is `true`.
  - [x] 4.5 Assert obvious negation such as `no numbness` does not escalate by itself.
  - [x] 4.6 Preserve Story 5.2 normal streaming/citation tests.
  - [x] 4.7 Run `pnpm typecheck`.
  - [x] 4.8 Run `pnpm lint`.
  - [x] 4.9 Run focused Playwright/API tests.

## Dev Notes

### Product and Safety Intent

- Story 5.3 is a safety story, not a smarter coaching story.
- If a user mentions red-flag symptoms, the product should stop ordinary recovery guidance and direct the user toward clinical help.
- The response must be short, clear, non-diagnostic, and visually distinct.
- This story should reduce harm from false reassurance; it should not attempt medical triage beyond the approved keyword/pattern layer.

### Current Baseline From Story 5.2

- `/api/chat` exists and handles:
  - auth
  - strict question validation
  - paid program context
  - safe chat context
  - keyword-first bounded RAG citation retrieval
  - deterministic non-production provider answer
  - Gemini production path
  - NDJSON streaming
  - citations UI
  - `ChatConversation` and `ChatMessage` persistence
- `ChatStreamEvent` currently supports:
  - `user`
  - `status`
  - `token`
  - `citations`
  - `done`
  - `error`
- `ChatEntryShell` currently displays:
  - user/assistant messages
  - answering state
  - citations
  - retryable error state
- `ChatMessage.escalated` exists in Prisma schema and is currently stored as `false` for normal interactions.
- Story 5.2 deliberately did not implement danger escalation.

### Safety Keyword Source

Architecture §11.4 defines the minimum danger keyword set:

- `severe pain`
- `purple`
- `blue`
- `numb`
- `fever`
- `pus`
- `cannot move`
- `sudden swelling`

The same section defines the strategy:

- response content is shortened
- do not continue exercise suggestions
- force medical-help guidance
- set `ChatMessage.escalated = true`

### Suggested Escalated Copy

Use concise copy similar to:

> This may be a warning sign. Please contact your clinician now or seek urgent medical help if symptoms are severe, rapidly worsening, or you feel unsafe. I cannot diagnose this or guide exercises for these symptoms.

Keep wording educational and non-diagnostic. Do not say the user has a condition. Do not tell the user to continue exercises.

### Detection Guidance

- Prefer deterministic local detection over provider-based classification.
- Match case-insensitively.
- Keep the first version simple and auditable.
- Negation handling should only cover obvious phrase-level cases; do not overbuild NLP.
- If both danger and non-danger phrasing appear, prefer escalation unless the matched danger phrase is clearly negated.
- Return the matched terms/patterns in structured data for logging/persistence/UI if needed, but do not expose internal debugging details prominently to the user.

### Stream Contract Guidance

- Extend the existing NDJSON stream instead of replacing it.
- A simple event is enough, for example:
  - `{ "type": "escalation", "message": "...", "matchedTerms": [...] }`
- The client should not infer escalation from answer text.
- Persist before or no later than emitting the final visible escalated state, following the Story 5.2 persistence-order lesson.

### Persistence Guidance

- Reuse the active `ChatConversation` pattern from Story 5.2.
- Store user message with `escalated = false`.
- Store assistant escalated warning with:
  - `role = ASSISTANT`
  - `content = escalated warning text`
  - `escalated = true`
  - provider/model can be omitted or set to local safety metadata if helpful
  - citations can be omitted unless a static safety source is later available
- Do not create new schema fields.

### Testing Guidance

- Existing focused E2E file `e2e/program-entry.spec.ts` already covers Story 5.2 and program/day regressions.
- Story 5.3 may extend that file or add a focused chat safety spec if the file becomes too large.
- Avoid real provider calls. Use the existing deterministic non-production path.
- To prove provider bypass, prefer a test mode such as `CHAT_PROVIDER_TEST_MODE=error` on an escalated request, or assert output does not include normal deterministic provider wording.
- Keep full-file E2E timeout considerations in mind; remote Supabase paths can be slower than local-only tests.

### Scope Boundaries

Do not implement in Story 5.3:

- quota decrement/enforcement
- Upstash Redis
- Groq fallback
- provider fallback UI
- analytics events
- new Prisma schema changes
- billing/support workflows
- vector search
- broad medical triage NLP
- clinician contact workflow beyond guidance copy
- emergency-services localization beyond a generic urgent-help instruction

### Likely Files to Add or Modify

- `src/lib/chat/safety.ts`
- `src/lib/chat/types.ts`
- `src/app/api/chat/route.ts`
- `src/components/chat/chat-entry-shell.tsx`
- `e2e/program-entry.spec.ts` or a focused chat safety E2E spec
- `stories/5-3-danger-escalation-and-safety-guardrails.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless there is a narrow compile/test requirement:

- `prisma/schema.prisma`
- Stripe checkout/webhook code
- Day completion services
- billing/refund/support modules
- provider fallback/quota modules

### References

- `epics.md` Epic 5 Story 5.3.
- `UX设计规格说明.md` §8.3-8.5 Chat stream and Danger Escalation state.
- `技术架构详细设计.md` §9.3 AI Chat and §11.4 Prompt Guardrails.
- `stories/5-2-streaming-ai-answers-with-rag-citations.md`.
- `src/app/api/chat/route.ts`.
- `src/lib/chat/types.ts`.
- `src/components/chat/chat-entry-shell.tsx`.
- `prisma/schema.prisma`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 5.2 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded via exact reads only: `epics.md`, `UX设计规格说明.md`, `技术架构详细设计.md`, Story 5.2 completion/review notes, sprint status, current chat API route, and chat stream event types.
- 2026-05-09: Dev implementation started and story moved to `in-progress`.
- 2026-05-09: Initial safety E2E exposed a Playwright strict-mode conflict with Next.js route announcer also using `role="alert"`; test assertion was narrowed to `chat-escalation-warning`.
- 2026-05-09: Safety E2E then exposed an escalation stream/persistence race where the warning became visible before `ChatMessage` rows were persisted; `createChatStream` now runs the persistence callback before emitting `escalation`, `citations`, or `done`.
- 2026-05-09: Validation passed: `pnpm typecheck`, `pnpm lint`, focused safety E2E grep, and full `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 25/25 tests passing.
- 2026-05-09: Light code review completed in the main session. Patched danger detection to use word-boundary regular expressions instead of substring matching, preventing false positives such as `push` matching `pus`.
- 2026-05-09: Review patch validation passed: `pnpm typecheck`, `pnpm lint`, focused safety E2E grep, and full `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 25/25 tests passing.

### Completion Notes List

- Story 5.3 should add deterministic danger escalation on top of Story 5.2's chat backend.
- The story deliberately separates safety escalation from quota enforcement, provider fallback, analytics, and broader medical triage.
- The dev agent should preserve Story 5.2 normal streaming/RAG/citation behavior for non-escalated messages.
- Implemented deterministic local safety detection with the architecture keyword set and simple phrase-level negation handling.
- Integrated safety escalation into `/api/chat` after validation/program-context resolution and before RAG/provider generation; escalated input bypasses normal provider/RAG work.
- Extended NDJSON events with `escalation` and rendered a distinct accessible `role="alert"` warning block in the chat UI.
- Persisted escalated assistant messages with `ChatMessage.escalated = true`, `provider = local-safety`, and `model = deterministic-danger-keywords`.
- Added E2E coverage for danger escalation, accessible warning UI, provider/RAG bypass signal, escalated persistence, negated danger non-escalation, and Story 5.2 normal path regression.
- Validation passed on 2026-05-09: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` with 25/25 tests passing.
- Light code review approved after patch. The final patch uses word-boundary danger matching and extends the negated danger E2E to prove ordinary words like `push` do not trigger the `pus` danger term.

### File List

- `stories/5-3-danger-escalation-and-safety-guardrails.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`
- `src/lib/chat/safety.ts`
- `src/lib/chat/types.ts`
- `src/lib/chat/context.ts`
- `src/lib/chat/stream.ts`
- `src/app/api/chat/route.ts`
- `src/components/chat/chat-entry-shell.tsx`
- `e2e/program-entry.spec.ts`

### Change Log

- 2026-05-08: Created Story 5.3 with safety detection, escalated stream contract, accessible warning UI, persistence semantics, scope boundaries, and focused test guidance; story marked ready-for-dev.
- 2026-05-09: Implemented Story 5.3 deterministic danger escalation, accessible warning UI, escalated persistence, and focused E2E coverage; story moved to code-review.
- 2026-05-09: Completed light code review patch, revalidated focused tests, and moved story to done.

### Senior Developer Review (AI)

Outcome: Approved after patch

Findings:

- Medium: Danger detection used substring matching, so `pus` could match ordinary words such as `push`, and single-word terms like `blue`/`numb` could theoretically match inside longer words. Patched `src/lib/chat/safety.ts` to use explicit word-boundary/phrase regular expressions and updated the negated danger E2E to include `push`.

Residual Risk:

- Negation handling remains intentionally simple and phrase-level. Ambiguous messages that contain both red flags and negations may still escalate, which is acceptable for this safety-first story.
- The warning copy is generic and not localized; broader urgent-care localization remains out of scope.

Validation:

- 2026-05-09: `pnpm typecheck` passed.
- 2026-05-09: `pnpm lint` passed.
- 2026-05-09: `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome" --grep "danger chat input|negated danger"` passed with 2/2 tests.
- 2026-05-09: `pnpm test:e2e e2e/program-entry.spec.ts --project="Desktop Chrome"` passed with 25/25 tests.
