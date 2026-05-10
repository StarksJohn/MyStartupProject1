# Story 6.3: Simple Sharing Flow

Status: done

<!-- Note: Created by bmad-create-story after Story 6.2 was implemented, lightly reviewed, patched, validated, and marked done. -->

## Story

As a satisfied user,  
I want to share the outcome or product link with other people,  
so that I can recommend it without a complex referral program.

## Acceptance Criteria

1. **AC1 - Completed users can access a simple share surface**  
   **Given** a paid authenticated user has a completed 14-day program  
   **When** they open `/completion`  
   **Then** the page shows a simple sharing action near the existing report/download and next-step actions  
   **And** the action is only available from the completion experience in this story.

2. **AC2 - Sharing uses only a public product link and generic copy**  
   **Given** the user triggers sharing  
   **When** the share payload is prepared  
   **Then** it uses the public product URL, such as the site origin or `/`, plus generic recommendation copy  
   **And** it must not include report HTML, report download URLs, internal IDs, body part/subtype, Day 14 content, medical profile details, chat content, payment data, or any other private recovery data.

3. **AC3 - Web Share API is used when safely available**  
   **Given** the browser supports `navigator.share`  
   **When** the user chooses the share action  
   **Then** the client calls `navigator.share(...)` with title, text, and public URL only  
   **And** successful completion shows a clear success state without mutating program/report state.

4. **AC4 - Copy-link fallback is always available**  
   **Given** Web Share API is unavailable, cancelled, or fails for a recoverable reason  
   **When** the user still wants to share  
   **Then** the UI provides a copy-link fallback using the Clipboard API where available  
   **And** the user receives clear copied/fallback/error feedback.

5. **AC5 - Privacy and medical boundaries remain visible**  
   **Given** the completion page shows the share surface  
   **When** the user reads the section  
   **Then** the UI states that sharing is optional and should not be treated as medical advice or proof of recovery  
   **And** the existing completion safety boundary remains visible and unchanged.

6. **AC6 - Scope excludes referral, report sharing, persistence, and analytics implementation**  
   **Given** Epic 7 owns product analytics and the MVP explicitly avoids complex referral mechanics  
   **When** Story 6.3 is implemented  
   **Then** it must not add referral codes, incentives, social tracking pixels, analytics providers/events, `/api/share`, share database tables/fields, report persistence, report share URLs, email delivery, or server-side share logging  
   **And** it may leave a clearly documented extension point for Epic 7 to track `share_click` later without emitting it now.

7. **AC7 - Existing completion and report behavior remains intact**  
   **Given** Stories 6.1 and 6.2 already own completion and report download  
   **When** Story 6.3 adds sharing UI  
   **Then** `/completion` still gates access on completed paid programs  
   **And** `Download summary report`, `Review Day 14`, and `Ask a non-urgent question` continue to work  
   **And** `GET /api/program/report` remains unchanged unless a narrow test selector conflict requires a UI-only adjustment.

8. **AC8 - Focused regression coverage**  
   **Given** this story adds a client-side sharing surface  
   **When** implementation is complete  
   **Then** tests cover completion-page share UI, Web Share success, copy-link fallback, recoverable failure feedback, private-data exclusion from the share payload, and absence of analytics/referral/API/schema behavior  
   **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add a completion share action component** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 Add a small client component under `src/components/completion/`, recommended name `share-action.tsx` or `completion-share-action.tsx`.
  - [x] 1.2 Render it from `src/app/(app)/completion/page.tsx` near the report/download and next-step actions.
  - [x] 1.3 Use existing `Button` styling and mobile-first layout conventions.
  - [x] 1.4 Use `data-testid="completion-share-action"` for the main share button.
  - [x] 1.5 Use `data-testid="completion-copy-link"` for the fallback copy action if it is rendered as a separate control.
  - [x] 1.6 Use `data-testid="completion-share-feedback"` for success/error/cancel feedback.

- [x] **T2 - Build a privacy-safe share payload** (AC: 2, 5, 6)
  - [x] 2.1 Compute the public URL client-side from `window.location.origin` with `/` as the shared path, or use an existing public app URL helper if one already exists.
  - [x] 2.2 Use generic copy such as "I finished a 14-day recovery companion. It is educational support, not medical advice."
  - [x] 2.3 Do not pass program, profile, report, chat, payment, or Day content into the share component.
  - [x] 2.4 Do not include query parameters that identify the user, program, report, campaign, or social channel.
  - [x] 2.5 Keep the copy non-diagnostic and non-medical.

- [x] **T3 - Implement Web Share plus copy fallback** (AC: 3, 4)
  - [x] 3.1 If `navigator.share` exists, call it with only `{ title, text, url }`.
  - [x] 3.2 Treat user cancellation as a non-fatal outcome; avoid scary error copy for cancelled native share dialogs.
  - [x] 3.3 Provide a copy-link fallback using `navigator.clipboard.writeText` where available.
  - [x] 3.4 If Clipboard API is unavailable or fails, show a recoverable message with the public URL visible enough to copy manually.
  - [x] 3.5 Keep all behavior client-side; do not add a route handler or server action for sharing.

- [x] **T4 - Preserve Epic 6 boundaries and Epic 7 ownership** (AC: 5, 6, 7)
  - [x] 4.1 Keep the existing completion safety boundary visible and unchanged unless copy needs a narrow additive sentence.
  - [x] 4.2 Keep `ReportDownloadAction` behavior and `GET /api/program/report` unchanged.
  - [x] 4.3 Do not add analytics imports, tracking helpers, `share_click` emission, Plausible/Umami setup, social pixels, or `navigator.sendBeacon`.
  - [x] 4.4 Do not change `prisma/schema.prisma`.
  - [x] 4.5 Do not add `/api/share`, share/referral services, persisted share records, or report-sharing URLs.

- [x] **T5 - Add focused tests and validation** (AC: 1-8)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` unless a focused completion/share spec becomes cleaner.
  - [x] 5.2 Test a completed user sees the share action on `/completion`.
  - [x] 5.3 Mock `navigator.share` and assert it receives only generic title/text/public URL.
  - [x] 5.4 Test fallback copy behavior when `navigator.share` is unavailable.
  - [x] 5.5 Test failure feedback when native share/copy fails.
  - [x] 5.6 Assert the share payload/page does not expose body part, subtype, report HTML, `contentJson`, Stripe/payment strings, chat content, internal IDs, referral code text, or analytics event names.
  - [x] 5.7 Run `pnpm typecheck`.
  - [x] 5.8 Run `pnpm lint`.
  - [x] 5.9 Run focused Playwright coverage, noting Supabase pooler instability separately from application failures if it occurs.

## Dev Notes

### Product Intent

- Story 6.3 closes Epic 6 by letting a completed user recommend the product with a lightweight share/copy action.
- The share flow should feel like "recommend this educational companion" rather than "publish my medical progress."
- Sharing must not become a referral program, social growth system, analytics implementation, or report-sharing feature.
- The safest MVP payload is a public product link plus generic, non-diagnostic copy.
- This story intentionally narrows the `epics.md` mention of tracking share intent: Epic 7 owns actual analytics instrumentation. Story 6.3 should provide the user-facing share surface and leave analytics-ready naming only as documentation/tests, not runtime emission.

### Story 6.1 and 6.2 Baseline

- `src/app/(app)/completion/page.tsx` is the protected completion page.
- Unauthenticated `/completion` redirects to `/sign-in?callbackUrl=%2Fcompletion`.
- Non-completed users cannot see a false completion state; active users redirect to `/day/{currentDay}`.
- Completed users can revisit `/completion`; `/progress` routes completed programs back to `/completion`.
- The completion page currently exposes:
  - `ReportDownloadAction` / `Download summary report`
  - `Review Day 14`
  - `Ask a non-urgent question`
  - safety boundary copy
- Story 6.2 added:
  - `src/lib/program/completion-report-service.ts`
  - `src/app/api/program/report/route.ts`
  - `src/components/completion/report-download-action.tsx`
- Story 6.2 deliberately avoided share links, copy-link actions, social share APIs, referral mechanics, analytics events, and report persistence. Story 6.3 may add share/copy UI, but must preserve the rest of those exclusions.

### Relevant Architecture Context

- `技术架构详细设计.md` §9.4 says v1 sharing is simple and explicitly not an invitation-code system.
- `技术架构详细设计.md` §14.2 lists `share_click`, but Epic 7 owns analytics implementation and provider setup.
- `epics.md` Story 6.3 asks for copy link or simple share actions with fallback.
- `项目主档案.md` currently calls out two privacy boundaries for 6.3:
  - avoid overlapping with Story 6.2 report download
  - preserve "no report persistence, no social tracking leakage"
- Current repo search shows no existing share module, no `/api/share`, and no analytics provider/helper implementation. Do not invent those in this story.

### Recommended Implementation Shape

- Recommended component:
  - `src/components/completion/completion-share-action.tsx`
  - `"use client"`
  - local state for `isSharing`, `feedback`, and fallback URL
  - no props required if the component computes `window.location.origin`
- Recommended page integration:
  - import the share component in `src/app/(app)/completion/page.tsx`
  - render it in the existing next-step action cluster after `ReportDownloadAction`
  - optionally add one short list item explaining optional sharing
- Recommended share payload:
  - `title`: `Fracture Recovery Companion`
  - `text`: `I finished a 14-day recovery companion. It is educational support, not medical advice.`
  - `url`: `${window.location.origin}/`
- Recommended feedback copy:
  - success: `Share link ready.`
  - copied: `Product link copied.`
  - cancelled: no persistent error required
  - failure: `We could not open sharing. You can copy the product link instead.`
- Recommended fallback:
  - render the public URL in text after failure only if automatic copy fails, so the user can manually copy it.

### Data and Privacy Guardrails

- Do not pass server-side `program`, `recoveryProfile`, `ProgramDay`, or report data into the share component.
- Do not share `/api/program/report`; that route is authenticated and returns private downloadable content.
- Do not create public report pages, signed report URLs, social previews with user-specific content, or persisted report files.
- Do not include:
  - body part/subtype
  - Day 14 title/focus/summary
  - report HTML/text
  - internal database IDs
  - Stripe checkout session/payment intent IDs
  - chat transcripts or RAG citations
  - provider/model metadata
  - quota keys/usage internals
  - risk flag raw JSON
- Do not log share attempts server-side.

### Scope Boundaries

Do not implement in Story 6.3:

- analytics events or analytics provider setup
- `share_click` runtime emission
- social tracking pixels
- `navigator.sendBeacon`
- `/api/share`
- share/referral Prisma models or fields
- referral codes, rewards, invites, or attribution
- report sharing or public report URLs
- report persistence/storage
- email/SMS delivery
- Open Graph image generation
- changes to report generation
- billing/refund behavior
- new dependencies

### Testing Guidance

- Existing `e2e/program-entry.spec.ts` already contains completion and report coverage with seeded completed users.
- Share tests should stay browser/client focused and avoid remote service dependencies where possible.
- Suggested tests:
  - completed user opening `/completion` sees `completion-share-action`
  - mocked Web Share receives only public URL and generic text
  - copy fallback works when `navigator.share` is absent
  - failed copy/share shows recoverable feedback and does not break existing actions
  - report download CTA still exists and `/api/program/report` coverage remains unchanged
  - share payload does not contain profile, report, chat, payment, referral, or analytics strings
- Use `test.setTimeout(...)` for remote DB paths, consistent with Stories 5.4, 6.1, and 6.2.
- Known environment risk:
  - Supabase pooler at `aws-1-ap-northeast-1.pooler.supabase.com:6543` has intermittently failed during prior E2E seed/session calls. If failure occurs before application assertions, document it separately from application failures.

### Previous Story Intelligence

- Story 6.1 established the protected completion page and completed-program guardrails.
- Story 6.1 code review removed a self-looping `Progress overview` CTA; do not reintroduce it.
- Story 6.2 added a report download CTA and safe HTML report route; do not convert that report into a share target.
- Story 6.2 code review specifically checked for no share/copy/referral/analytics language in the report. Story 6.3 should add share UI only on the app page, not inside the downloaded report.
- Story 6.2 validation passed `pnpm typecheck`, `pnpm lint`, and focused Playwright report/completion coverage (`6 passed`).
- Recent git commit titles are not descriptive (`1`), so current working files and story records are the reliable implementation intelligence.

### Likely Files to Add or Modify

- `src/components/completion/completion-share-action.tsx`
- `src/app/(app)/completion/page.tsx`
- `e2e/program-entry.spec.ts` or a focused completion/share E2E file
- `stories/6-3-simple-sharing-flow.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- `src/app/api/program/report/route.ts`
- `src/lib/program/completion-report-service.ts`
- Stripe checkout/webhook code
- Chat API/provider/quota code
- analytics modules or provider setup
- report persistence/storage modules
- program template content JSON files

### References

- `epics.md` Epic 6 Story 6.3.
- `技术架构详细设计.md` §7.5 page structure, §9.4 Share / Referral, §14.2 product events, §14.3 testing strategy.
- `UX设计规格说明.md` §2 shared UX principles and §9 cross-page consistency.
- `项目主档案.md` 下一步 section.
- `stories/6-1-completion-experience-for-day-14.md`.
- `stories/6-2-downloadable-summary-report.md`.
- `src/app/(app)/completion/page.tsx`.
- `src/components/completion/report-download-action.tsx`.
- `src/app/api/program/report/route.ts`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 6.2 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded via exact reads and targeted search: `epics.md`, `技术架构详细设计.md`, `UX设计规格说明.md`, Stories 6.1/6.2, completion page, report download component, report service/route, package dependencies, existing E2E completion/report coverage, and share/analytics code search.
- Current code search found no existing share module, `/api/share`, analytics provider/helper, `navigator.share`, or Clipboard implementation to reuse.
- Recent git commit titles are not descriptive (`1`), so current working files and story records were used as the reliable source of implementation intelligence.
- Implementation followed the Story 6.3 privacy boundary: client-only Web Share / Clipboard fallback, public `/` URL only, no report URL/content, no server route, no schema, no referral, and no analytics runtime emission.
- Validation passed: `pnpm typecheck`, `pnpm lint`, focused share Playwright coverage (`3 passed`, `3 skipped` on Mobile project by existing skip strategy), and updated completion revisit Playwright coverage (`1 passed`, `1 skipped` on Mobile project).

### Completion Notes List

- Story 6.3 should add a client-side share/copy action to the protected completion page for completed users.
- The share payload must use only a public product URL and generic non-diagnostic copy.
- The implementation must not share report content, create public report URLs, persist share records, add analytics runtime emission, add `/api/share`, change schema, or introduce referral mechanics.
- Epic 7 owns actual `share_click` analytics; this story may document the future event but must not emit it.
- Recommended next implementation path is a small `completion-share-action` client component plus focused Playwright coverage for Web Share, copy fallback, failure feedback, and privacy exclusions.
- Implemented `CompletionShareAction` as a client-only component using `navigator.share` when available and `navigator.clipboard.writeText` fallback when native share is unavailable or fails.
- The share payload is fixed to `Fracture Recovery Companion`, generic non-diagnostic text, and the public site root URL (`window.location.origin + "/"`).
- Completion page now includes a short optional sharing note and renders the share action beside the report download and existing next-step links.
- No `/api/share`, Prisma schema changes, referral mechanics, social tracking pixels, analytics imports/events, report sharing, or report persistence were added.
- Added Playwright coverage for Web Share payload privacy, Clipboard fallback, failure feedback with manual public URL, and preserved completion/report actions.
- Validation passed: `pnpm typecheck`; `pnpm lint`; `pnpm test:e2e e2e/program-entry.spec.ts --grep "completed users can share only|completed users can copy the public link|completion sharing shows recoverable feedback"`; `pnpm test:e2e e2e/program-entry.spec.ts --grep "completed users can revisit completion with report and share actions"`.
- Light code-review approved Story 6.3 without patch: public-link-only payload, client-only fallback behavior, completion/report guardrails, and no analytics/referral/API/schema creep all match the story boundaries.

## Review Findings (Story 6.3)

### Blind Hunter（误导 / 产品边界）

- [x] **无** 把分享做成医疗结果公开：payload 只包含公共产品根链接、通用推荐文案和非医疗声明，不包含完成报告、body part、subtype、Day 内容或恢复结论。
- [x] **无** 把 Story 6.3 扩成 referral / growth 系统：未新增 referral code、邀请码、激励、社交追踪像素或渠道参数。
- [x] **无** 抢跑 Epic 7 analytics：未引入 analytics helper/provider，未发出 `share_click`，未使用 `navigator.sendBeacon`。
- [x] **复验通过**：review 后重新运行 `pnpm typecheck`、`pnpm lint`、6.3 聚焦 Playwright；Desktop 4 passed，Mobile 4 skipped（按既有 skip 策略）。

### Edge Case Hunter（异常与泄露）

- [x] Web Share 成功路径只调用 `{ title, text, url }`，且测试断言 payload 不含 report、profile、payment、chat、referral 或 analytics 字符串。
- [x] Web Share 不可用时使用 Clipboard fallback；Web Share / Clipboard 都失败时展示可手动复制的公共 URL。
- [x] 用户取消原生分享时不展示吓人的错误；按钮保持可再次触发，状态会在 `finally` 恢复。

### Acceptance Auditor（对照 AC）

- AC1：完成页显示分享按钮，且只挂在 `/completion`。
- AC2：分享 URL 为 `${window.location.origin}/`，无用户、program、report、渠道或 query 参数。
- AC3-4：Web Share + Clipboard fallback 已实现并有聚焦 E2E。
- AC5：完成页保留 safety boundary，并新增不暴露恢复细节的分享说明。
- AC6：未新增 `/api/share`、schema、服务端日志、持久化、referral、analytics 或报告分享。
- AC7：Report download、Review Day 14、Chat 链接仍可见；`GET /api/program/report` 没有被 Story 6.3 修改。
- AC8：已覆盖成功分享、copy fallback、失败反馈、payload 隐私和现有 completion/report 行为。

### 结论

**Approved without patch**；Story 6.3 可标记 `done`，Epic 6 可收口为 `done`，下一步进入 Epic 7 Story 7.1。

### File List

- `stories/6-3-simple-sharing-flow.md`
- `src/components/completion/completion-share-action.tsx`
- `src/app/(app)/completion/page.tsx`
- `e2e/program-entry.spec.ts`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-10: Created Story 6.3 with simple completion-page sharing scope, privacy-safe public-link payload, Web Share/copy fallback guidance, analytics/referral/report-sharing exclusions, and focused regression guidance; story marked ready-for-dev.
- 2026-05-10: Implemented Story 6.3 client-only completion share/copy flow, preserved report/download boundaries, added focused Playwright coverage, passed typecheck/lint/focused E2E, and marked story code-review.
- 2026-05-10: Light code-review approved without patch; reran typecheck/lint/focused E2E successfully; marked Story 6.3 done and closed Epic 6.
